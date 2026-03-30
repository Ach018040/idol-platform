#!/usr/bin/env python3
"""
idol-platform / pipeline / sync_notion.py
==========================================
從 idolmaps.com 爬取成員、團體資料，同步至 Notion 資料庫。

環境變數：
  IDOLMAPS_ANON_KEY   — idolmaps.com 的 Supabase anon key
  NOTION_TOKEN        — Notion integration token (secret_xxx)
  NOTION_MEMBERS_DB   — 成員資料庫 data_source_id
  NOTION_GROUPS_DB    — 團體資料庫 data_source_id
  NOTION_LOG_DB       — 同步日誌 data_source_id
"""
from __future__ import annotations
import os, sys, json, time, logging
from datetime import datetime, timezone
from typing import Any
import httpx

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger("sync_notion")

SUPABASE_URL = "https://ziiagdrrytyrmzoeegjk.supabase.co"
ANON_KEY     = os.environ.get("IDOLMAPS_ANON_KEY", "")
NOTION_TOKEN = os.environ.get("NOTION_TOKEN", "")
MEMBERS_DB   = os.environ.get("NOTION_MEMBERS_DB", "2046ee1e-6124-43e6-8c5e-e7fd02ef038e")
GROUPS_DB    = os.environ.get("NOTION_GROUPS_DB",  "250a50df-827b-40d0-a753-73466d15b72b")
LOG_DB       = os.environ.get("NOTION_LOG_DB",     "129ac173-e7bb-408e-b2f7-b1aaac56f0e3")
NOTION_API   = "https://api.notion.com/v1"
NOTION_VER   = "2022-06-28"

def sb_get(path, params=None):
    if not ANON_KEY:
        log.warning("IDOLMAPS_ANON_KEY 未設定")
        return []
    h = {"apikey": ANON_KEY, "Authorization": f"Bearer {ANON_KEY}", "Accept": "application/json"}
    r = httpx.get(f"{SUPABASE_URL}/rest/v1/{path}", headers=h, params=params, timeout=30)
    r.raise_for_status()
    return r.json()

def notion_headers():
    return {"Authorization": f"Bearer {NOTION_TOKEN}", "Notion-Version": NOTION_VER, "Content-Type": "application/json"}

def notion_get_db_pages(db_id):
    pages, cursor = [], None
    while True:
        body = {"page_size": 100}
        if cursor: body["start_cursor"] = cursor
        r = httpx.post(f"{NOTION_API}/databases/{db_id}/query", headers=notion_headers(), json=body, timeout=30)
        r.raise_for_status()
        data = r.json()
        pages.extend(data.get("results", []))
        if not data.get("has_more"): break
        cursor = data.get("next_cursor")
    return pages

def get_prop_text(page, name):
    p = page.get("properties", {}).get(name, {})
    t = p.get("type")
    items = p.get("title" if t == "title" else "rich_text", [])
    return "".join(i.get("plain_text","") for i in items)

def upsert_page(db_id, page_id, props):
    hdrs = notion_headers()
    if page_id:
        r = httpx.patch(f"{NOTION_API}/pages/{page_id}", headers=hdrs, json={"properties": props}, timeout=30)
    else:
        r = httpx.post(f"{NOTION_API}/pages", headers=hdrs, json={"parent": {"database_id": db_id}, "properties": props}, timeout=30)
    if r.status_code not in (200, 201):
        log.warning(f"Notion {r.status_code}: {r.text[:200]}")
    return r.json()

def sync_members(members, history):
    log.info(f"同步 {len(members)} 位成員...")
    # 建立 member_id -> 最新團體名稱對照
    gmap = {}
    for h in sorted(history, key=lambda x: x.get("joined_at",""), reverse=True):
        mid = h.get("member_id")
        if mid and mid not in gmap:
            gmap[mid] = h.get("stage_name") or h.get("group_id","")

    # 取現有記錄
    existing = {}
    try:
        for p in notion_get_db_pages(MEMBERS_DB):
            uuid = get_prop_text(p, "UUID")
            if uuid: existing[uuid] = p["id"]
    except Exception as e:
        log.warning(f"取現有記錄失敗: {e}")

    added = updated = 0
    for i, m in enumerate(members):
        mid = m.get("id","")
        def url_prop(v): return {"url": v} if v and v.startswith("http") else None

        props = {
            "姓名":     {"title": [{"text": {"content": m.get("name","")}}]},
            "UUID":     {"rich_text": [{"text": {"content": mid}}]},
            "狀態":     {"select": {"name": "活躍"}},
            "idolmaps 頁面": {"url": f"https://idolmaps.com/member/{mid}"},
        }
        if m.get("name_roman"):   props["羅馬拼音"] = {"rich_text": [{"text":{"content":m["name_roman"]}}]}
        if m.get("nickname"):     props["暱稱"]     = {"rich_text": [{"text":{"content":m["nickname"]}}]}
        if m.get("color"):        props["代表色 HEX"] = {"rich_text": [{"text":{"content":m["color"]}}]}
        if m.get("color_name"):   props["色名"]     = {"rich_text": [{"text":{"content":m["color_name"]}}]}
        if m.get("birthdate"):    props["生日"]     = {"rich_text": [{"text":{"content":m["birthdate"]}}]}
        if gmap.get(mid):         props["所屬團體"] = {"rich_text": [{"text":{"content":gmap[mid]}}]}
        if ig := url_prop(m.get("instagram")): props["Instagram"] = ig
        if x  := url_prop(m.get("x")):         props["Twitter / X"] = x
        if fb := url_prop(m.get("facebook")):  props["Facebook"] = fb
        if ph := url_prop(m.get("photo_url")): props["照片 URL"] = ph

        pid = existing.get(mid)
        try:
            upsert_page(MEMBERS_DB, pid, props)
            if pid: updated += 1
            else:   added += 1
        except Exception as e:
            log.warning(f"成員 {m.get('name')} 失敗: {e}")
        if (i+1) % 10 == 0:
            log.info(f"  {i+1}/{len(members)}")
            time.sleep(0.4)

    log.info(f"  成員: +{added} 新增, {updated} 更新")
    return added, updated

def sync_groups(groups):
    log.info(f"同步 {len(groups)} 個團體...")
    existing = {}
    try:
        for p in notion_get_db_pages(GROUPS_DB):
            name = get_prop_text(p, "團體名稱")
            if name: existing[name] = p["id"]
    except Exception as e:
        log.warning(f"取現有記錄失敗: {e}")

    added = updated = 0
    for g in groups:
        name = g.get("name","") or g.get("display_name","")
        if not name: continue
        props = {
            "團體名稱": {"title": [{"text":{"content":name}}]},
            "狀態":     {"select":{"name":"活躍"}},
        }
        if g.get("color"):       props["代表色 HEX"] = {"rich_text":[{"text":{"content":g["color"]}}]}
        if g.get("description"): props["備註"]       = {"rich_text":[{"text":{"content":g["description"][:500]}}]}
        pid = existing.get(name)
        try:
            upsert_page(GROUPS_DB, pid, props)
            if pid: updated += 1
            else:   added += 1
        except Exception as e:
            log.warning(f"團體 {name} 失敗: {e}")
        time.sleep(0.2)
    log.info(f"  團體: +{added} 新增, {updated} 更新")
    return added, updated

def write_log(status, members, groups, added, updated, elapsed, error=""):
    ts  = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    sha = os.environ.get("GITHUB_SHA","manual")[:8]
    src = "GitHub Actions" if os.environ.get("GITHUB_ACTIONS") else "手動執行"
    body = {
        "parent": {"database_id": LOG_DB},
        "properties": {
            "執行時間":    {"title":[{"text":{"content":ts}}]},
            "狀態":        {"select":{"name":status}},
            "來源":        {"select":{"name":src}},
            "成員筆數":    {"number":members},
            "團體筆數":    {"number":groups},
            "新增筆數":    {"number":added},
            "更新筆數":    {"number":updated},
            "執行時長(秒)":{"number":round(elapsed,1)},
            "Commit SHA":  {"rich_text":[{"text":{"content":sha}}]},
        }
    }
    if error: body["properties"]["錯誤訊息"] = {"rich_text":[{"text":{"content":error[:500]}}]}
    try:
        httpx.post(f"{NOTION_API}/pages", headers=notion_headers(), json=body, timeout=30)
    except Exception as e:
        log.warning(f"寫入日誌失敗: {e}")

def main():
    t0 = time.time()
    if not NOTION_TOKEN:
        log.error("NOTION_TOKEN 未設定"); sys.exit(1)

    members = history = groups = []
    added = updated = 0
    status = "成功"; err = ""
    try:
        members = sb_get("members", {"select":"id,name,name_roman,nickname,color,color_name,birthdate,instagram,facebook,x,photo_url","order":"updated_at.desc","limit":"500"})
        groups  = sb_get("groups",  {"select":"*","order":"name.asc","limit":"300"})
        history = sb_get("history", {"select":"member_id,group_id,role,joined_at,stage_name","group_id":"not.is.null","order":"joined_at.desc","limit":"1000"})

        if members:
            a,u = sync_members(members, history); added+=a; updated+=u
        else:
            status = "部分成功"
        if groups:
            a,u = sync_groups(groups); added+=a; updated+=u
    except Exception as e:
        log.error(f"錯誤: {e}", exc_info=True); err=str(e); status="失敗"

    elapsed = time.time()-t0
    log.info(f"完成 | {status} | {elapsed:.1f}s | +{added} 更新{updated}")
    write_log(status, len(members), len(groups), added, updated, elapsed, err)
    if status == "失敗": sys.exit(1)

if __name__ == "__main__":
    main()
