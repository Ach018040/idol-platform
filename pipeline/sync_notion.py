#!/usr/bin/env python3
"""
pipeline/sync_notion.py  —  地下偶像企劃 v3.7
==============================================
兩種模式：
  A. 有 IDOLMAPS_ANON_KEY  → 直接從 idolmaps Supabase 抓最新資料
  B. 無 IDOLMAPS_ANON_KEY  → 從 repo 內 JSON 靜態檔案同步至 Notion

環境變數：
  IDOLMAPS_ANON_KEY  — idolmaps.com Supabase anon key（可選）
  NOTION_TOKEN       — Notion integration token  (必填)
  NOTION_MEMBERS_DB  — 成員資料庫 data_source_id
  NOTION_GROUPS_DB   — 團體資料庫 data_source_id
  NOTION_LOG_DB      — 同步日誌 data_source_id
"""
from __future__ import annotations
import os, sys, json, time, logging, pathlib
from datetime import datetime, timezone
from typing import Any
import httpx

logging.basicConfig(level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s", datefmt="%H:%M:%S")
log = logging.getLogger("sync")

# ── 設定 ─────────────────────────────────────────────────────────────────────
SUPABASE_URL = "https://ziiagdrrytyrmzoeegjk.supabase.co"
ANON_KEY     = os.environ.get("IDOLMAPS_ANON_KEY", "")
NOTION_TOKEN = os.environ.get("NOTION_TOKEN", "")
MEMBERS_DB   = os.environ.get("NOTION_MEMBERS_DB", "70309897460044b0992f542307ca3472")
GROUPS_DB    = os.environ.get("NOTION_GROUPS_DB",  "d9ef091156d24fb5b64f0ad9b183e11a")
LOG_DB       = os.environ.get("NOTION_LOG_DB",     "c678a44a36d54fd3a2e97ccb101e3839")
NOTION_API   = "https://api.notion.com/v1"
NOTION_VER   = "2022-06-28"

# JSON 靜態檔案路徑（相對於 repo root）
REPO_ROOT = pathlib.Path(__file__).parent.parent
JSON_MEMBERS = REPO_ROOT / "frontend-next" / "public" / "data" / "member_rankings.json"
JSON_GROUPS  = REPO_ROOT / "frontend-next" / "public" / "data" / "v7_rankings.json"

# ── Supabase（模式 A）─────────────────────────────────────────────────────────
def sb_fetch(path: str, params: dict) -> list[dict]:
    h = {"apikey": ANON_KEY, "Authorization": f"Bearer {ANON_KEY}",
         "Accept": "application/json"}
    r = httpx.get(f"{SUPABASE_URL}/rest/v1/{path}", headers=h,
                  params=params, timeout=30)
    r.raise_for_status()
    return r.json()

def fetch_from_supabase() -> tuple[list, list, list]:
    log.info("⬇  模式 A：從 idolmaps Supabase 抓取...")
    members = sb_fetch("members", {
        "select": "id,name,name_roman,nickname,color,color_name,"
                  "birthdate,instagram,facebook,x,photo_url",
        "order": "updated_at.desc", "limit": "500"})
    groups  = sb_fetch("groups",  {"select": "*", "order": "name.asc", "limit": "300"})
    history = sb_fetch("history", {
        "select": "member_id,group_id,role,joined_at,stage_name",
        "order": "joined_at.desc", "limit": "1000"})
    log.info(f"   成員 {len(members)} 位 | 團體 {len(groups)} 個 | 歷程 {len(history)} 筆")
    return members, groups, history

# ── JSON 靜態（模式 B）───────────────────────────────────────────────────────
def fetch_from_json() -> tuple[list, list, list]:
    log.info("⬇  模式 B：從 repo JSON 靜態檔讀取...")
    members, groups = [], []
    if JSON_MEMBERS.exists():
        raw = json.loads(JSON_MEMBERS.read_text("utf-8"))
        # 轉換成 Supabase schema 格式
        for m in raw:
            members.append({
                "id":        m.get("id", ""),
                "name":      m.get("name", ""),
                "name_roman": m.get("name_roman", ""),
                "nickname":  m.get("nickname", ""),
                "color":     m.get("color", ""),
                "color_name": m.get("color_name", ""),
                "birthdate": m.get("birthday", ""),
                "instagram": m.get("instagram", ""),
                "facebook":  m.get("facebook", ""),
                "x":         m.get("twitter", ""),
                "photo_url": m.get("photo_url", ""),
                "_group":    m.get("group", ""),
                "_rank":     m.get("rank", 99),
                "_social":   m.get("social_activity", 0),
                "_temp":     m.get("temperature_index", 0),
            })
    if JSON_GROUPS.exists():
        raw = json.loads(JSON_GROUPS.read_text("utf-8"))
        for g in raw:
            groups.append({
                "name":         g.get("display_name") or g.get("group", ""),
                "color":        g.get("color", ""),
                "member_count": g.get("member_count", 0),
                "member_names": g.get("member_names", ""),
                "_rank":        g.get("rank", 99),
                "_social":      g.get("social_activity", 0),
                "_temp":        g.get("temperature_index", 0),
                "_conv":        g.get("conversion_score", 0),
            })
    log.info(f"   成員 {len(members)} 位 | 團體 {len(groups)} 個")
    return members, groups, []

# ── Notion helpers ────────────────────────────────────────────────────────────
def nh() -> dict:
    return {"Authorization": f"Bearer {NOTION_TOKEN}",
            "Notion-Version": NOTION_VER, "Content-Type": "application/json"}

def get_existing(db_id: str, uuid_prop: str) -> dict[str, str]:
    """取得已有記錄的 uuid → page_id 對照表。"""
    existing: dict[str, str] = {}
    cursor = None
    while True:
        body: dict[str, Any] = {"page_size": 100}
        if cursor: body["start_cursor"] = cursor
        r = httpx.post(f"{NOTION_API}/databases/{db_id}/query",
                       headers=nh(), json=body, timeout=30)
        if r.status_code != 200: break
        data = r.json()
        for p in data.get("results", []):
            props = p.get("properties", {})
            prop = props.get(uuid_prop, {})
            t = prop.get("type")
            items = prop.get("title" if t == "title" else "rich_text", [])
            val = "".join(i.get("plain_text", "") for i in items)
            if val: existing[val] = p["id"]
        if not data.get("has_more"): break
        cursor = data.get("next_cursor")
    return existing

def upsert(db_id: str, page_id: str | None, props: dict) -> bool:
    hdrs = nh()
    if page_id:
        r = httpx.patch(f"{NOTION_API}/pages/{page_id}",
                        headers=hdrs, json={"properties": props}, timeout=30)
    else:
        r = httpx.post(f"{NOTION_API}/pages",
                       headers=hdrs,
                       json={"parent": {"database_id": db_id}, "properties": props},
                       timeout=30)
    return r.status_code in (200, 201)

def rt(v: str) -> dict:
    return {"rich_text": [{"text": {"content": v[:2000]}}]}

def url_prop(v: str) -> dict | None:
    return {"url": v} if v and v.startswith("http") else None

# ── 同步成員 ──────────────────────────────────────────────────────────────────
def sync_members(members: list, history: list) -> tuple[int, int]:
    log.info(f"🔄 同步 {len(members)} 位成員...")
    # member_id → 最新團體
    gmap: dict[str, str] = {}
    for h in sorted(history, key=lambda x: x.get("joined_at",""), reverse=True):
        mid = h.get("member_id")
        if mid and mid not in gmap:
            gmap[mid] = h.get("stage_name") or h.get("group_id","")

    existing = {}
    try:
        existing = get_existing(MEMBERS_DB, "UUID")
        log.info(f"   現有 {len(existing)} 筆")
    except Exception as e:
        log.warning(f"   取現有記錄失敗: {e}")

    added = updated = errors = 0
    for i, m in enumerate(members):
        mid = m.get("id","")
        group = gmap.get(mid) or m.get("_group","")

        props: dict[str, Any] = {
            "姓名":    {"title": [{"text":{"content": m.get("name","")}}]},
            "UUID":    rt(mid),
            "狀態":    {"select":{"name":"活躍"}},
            "idolmaps 頁面": {"url": f"https://idolmaps.com/member/{mid}"},
        }
        for k, fld in [("name_roman","羅馬拼音"),("nickname","暱稱"),
                       ("color","代表色 HEX"),("color_name","色名"),
                       ("birthdate","生日")]:
            if v := m.get(k,""):
                props[fld] = rt(v)
        if group: props["所屬團體"] = rt(group)

        # 排名/指數（模式 B 才有 _rank）
        if m.get("_rank"): props["排名"] = {"number": m["_rank"]}
        if m.get("_social") is not None: props["社群活躍度"] = {"number": m["_social"]}
        if m.get("_temp")   is not None: props["溫度指數"]   = {"number": m["_temp"]}

        for k, fld in [("instagram","Instagram"),("x","Twitter / X"),("facebook","Facebook"),("photo_url","照片 URL")]:
            if p := url_prop(m.get(k,"")): props[fld] = p

        pid = existing.get(mid)
        ok = upsert(MEMBERS_DB, pid, props)
        if ok:
            if pid: updated += 1
            else:   added += 1
        else:
            errors += 1

        if (i+1) % 10 == 0:
            log.info(f"   進度 {i+1}/{len(members)}")
            time.sleep(0.35)

    log.info(f"   ✓ +{added} 新增 / {updated} 更新 / {errors} 錯誤")
    return added, updated

# ── 同步團體 ──────────────────────────────────────────────────────────────────
def sync_groups(groups: list) -> tuple[int, int]:
    log.info(f"🔄 同步 {len(groups)} 個團體...")
    existing = {}
    try:
        existing = get_existing(GROUPS_DB, "團體名稱")
        log.info(f"   現有 {len(existing)} 筆")
    except Exception as e:
        log.warning(f"   取現有記錄失敗: {e}")

    added = updated = 0
    for g in groups:
        name = g.get("name","")
        if not name: continue
        props: dict[str, Any] = {
            "團體名稱": {"title": [{"text":{"content": name}}]},
            "狀態":     {"select":{"name":"活躍"}},
        }
        if c := g.get("color",""):    props["代表色 HEX"] = rt(c)
        if n := g.get("member_count"): props["成員數"] = {"number": n}
        if mn := g.get("member_names",""): props["成員名單"] = rt(mn)
        if g.get("_rank"):   props["排名"]      = {"number": g["_rank"]}
        if g.get("_social"): props["社群活躍度"] = {"number": g["_social"]}
        if g.get("_temp"):   props["溫度指數"]   = {"number": g["_temp"]}
        if g.get("_conv"):   props["轉換分數"]   = {"number": g["_conv"]}

        pid = existing.get(name)
        if upsert(GROUPS_DB, pid, props):
            if pid: updated += 1
            else:   added += 1
        time.sleep(0.2)

    log.info(f"   ✓ +{added} 新增 / {updated} 更新")
    return added, updated

# ── 寫入日誌 ──────────────────────────────────────────────────────────────────
def write_log(status, n_members, n_groups, added, updated, elapsed, error=""):
    ts  = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    sha = os.environ.get("GITHUB_SHA","manual")[:8]
    src = "GitHub Actions" if os.environ.get("GITHUB_ACTIONS") else "手動執行"
    body = {
        "parent": {"database_id": LOG_DB},
        "properties": {
            "執行時間":     {"title": [{"text":{"content": ts}}]},
            "狀態":         {"select":{"name": status}},
            "來源":         {"select":{"name": src}},
            "成員筆數":     {"number": n_members},
            "團體筆數":     {"number": n_groups},
            "新增筆數":     {"number": added},
            "更新筆數":     {"number": updated},
            "執行時長(秒)": {"number": round(elapsed, 1)},
            "Commit SHA":   rt(sha),
        }
    }
    if error:
        body["properties"]["錯誤訊息"] = rt(error[:500])
    try:
        httpx.post(f"{NOTION_API}/pages", headers=nh(), json=body, timeout=30)
        log.info(f"📝 日誌寫入：{ts} | {status}")
    except Exception as e:
        log.warning(f"日誌寫入失敗: {e}")

# ── 主流程 ────────────────────────────────────────────────────────────────────
def main():
    t0 = time.time()
    log.info("=" * 55)
    log.info("🚀 地下偶像企劃 Notion 同步開始")
    log.info(f"   ANON_KEY : {'✓ 已設定' if ANON_KEY else '✗ 未設定 → 使用 JSON 模式'}")
    log.info(f"   NOTION   : {'✓ 已設定' if NOTION_TOKEN else '✗ 未設定'}")
    log.info("=" * 55)

    if not NOTION_TOKEN:
        log.error("NOTION_TOKEN 未設定，無法同步"); sys.exit(1)

    members = groups = history = []
    added = updated = 0
    status = "成功"; err = ""

    try:
        if ANON_KEY:
            members, groups, history = fetch_from_supabase()
        else:
            members, groups, history = fetch_from_json()

        if members:
            a, u = sync_members(members, history); added += a; updated += u
        else:
            log.warning("⚠ 無成員資料"); status = "部分成功"

        if groups:
            a, u = sync_groups(groups); added += a; updated += u

    except Exception as e:
        log.error(f"同步錯誤: {e}", exc_info=True)
        err = str(e); status = "失敗"

    elapsed = time.time() - t0
    log.info(f"\n{'='*55}")
    log.info(f"✅ {status} | {elapsed:.1f}s | +{added} 新增 / {updated} 更新")
    log.info(f"   成員 {len(members)} | 團體 {len(groups)}")
    log.info("="*55)

    write_log(status, len(members), len(groups), added, updated, elapsed, err)
    if status == "失敗": sys.exit(1)

if __name__ == "__main__":
    main()
