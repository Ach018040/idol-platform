#!/usr/bin/env python3
"""
pipeline/fetch_members.py
從 idolmaps Supabase 抓取完整成員/團體資料，
生成前端所需的三支 JSON：
  - member_rankings.json  (成員列表 + 分數)
  - v7_rankings.json      (團體排行)
  - insights.json         (市場快照)
"""
import os, sys, json, pathlib, random
from datetime import datetime, timezone
import httpx

SUPABASE_URL = "https://ziiagdrrytyrmzoeegjk.supabase.co"
ANON_KEY = os.environ.get("IDOLMAPS_ANON_KEY", "") or "sb_publishable_PtKb4LIJeJN3cECUJllW7w_UFRVTbTv"

REPO_ROOT  = pathlib.Path(__file__).parent.parent
DATA_DIR   = REPO_ROOT / "frontend-next" / "public" / "data"
OUT_MEMBERS  = DATA_DIR / "member_rankings.json"
OUT_GROUPS   = DATA_DIR / "v7_rankings.json"
OUT_INSIGHTS = DATA_DIR / "insights.json"


def sb(path, params):
    h = {"apikey": ANON_KEY, "Authorization": f"Bearer {ANON_KEY}",
         "Accept": "application/json", "Accept-Profile": "public"}
    r = httpx.get(f"{SUPABASE_URL}/rest/v1/{path}", headers=h, params=params, timeout=30)
    r.raise_for_status()
    return r.json()


def score_member(m: dict) -> dict:
    """用現有欄位估算社群活躍度 + 溫度指數"""
    has_ig = bool((m.get("instagram") or "").startswith("http"))
    has_fb = bool((m.get("facebook") or "").startswith("http"))
    has_tw = bool((m.get("x") or "").startswith("http"))
    has_ph = bool((m.get("photo_url") or "").startswith("http"))
    # 社群活躍度：有多個平台 + 照片 = 高分
    sa = sum([has_ig * 40, has_fb * 20, has_tw * 25, has_ph * 15])
    sa = min(100, sa + random.randint(0, 10))  # 加小幅隨機波動
    # 溫度指數 = 社群活躍度 * 0.7 + 小波動
    ti = round(sa * 0.7 + random.uniform(0, 8), 1)
    return {"social_activity": sa, "temperature_index": ti, "conversion_score": round(ti * 0.6, 1)}


def main():
    print("⬇  Fetching from idolmaps Supabase...")
    members = sb("members", {
        "select": "id,name,name_roman,nickname,color,color_name,birthdate,instagram,facebook,x,photo_url",
        "order": "updated_at.desc", "limit": 500
    })
    groups = sb("groups", {"select": "id,name,color", "order": "name.asc", "limit": 300})
    history = sb("history", {
        "select": "member_id,group_id,joined_at",
        "order": "joined_at.desc", "limit": 2000
    })
    print(f"   成員 {len(members)} | 團體 {len(groups)} | 歷程 {len(history)}")

    # member -> 最新 group 對應
    g_map = {g["id"]: g for g in groups}
    mg_map: dict[str, dict] = {}
    for h in history:
        mid, gid = h.get("member_id"), h.get("group_id")
        if mid and gid and mid not in mg_map:
            mg_map[mid] = g_map.get(gid, {})

    # ── 1. member_rankings.json ─────────────────────────────────────────
    member_data = []
    for i, m in enumerate(members):
        scores = score_member(m)
        gobj = mg_map.get(m.get("id", ""), {})
        ig = m.get("instagram") or ""
        fb = m.get("facebook") or ""
        tw = m.get("x") or ""
        ph = m.get("photo_url") or ""
        member_data.append({
            "rank": i + 1,
            "id":   m.get("id", ""),
            "name": m.get("name", ""),
            "name_roman":  m.get("name_roman") or "",
            "nickname":    m.get("nickname") or "",
            "group":       gobj.get("name", ""),
            "color":       m.get("color") or "",
            "color_name":  m.get("color_name") or "",
            "birthday":    m.get("birthdate") or "",
            "instagram":   ig if ig.startswith("http") else "",
            "facebook":    fb if fb.startswith("http") else "",
            "twitter":     tw if tw.startswith("http") else "",
            "photo_url":   ph if ph.startswith("http") else "",
            "member_url":  f"https://idolmaps.com/member/{m.get('id','')}",
            "social_activity":  scores["social_activity"],
            "temperature_index": scores["temperature_index"],
            "conversion_score":  scores["conversion_score"],
        })

    # 依溫度指數重排
    member_data.sort(key=lambda x: x["temperature_index"], reverse=True)
    for i, m in enumerate(member_data):
        m["rank"] = i + 1

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    OUT_MEMBERS.write_text(json.dumps(member_data, ensure_ascii=False, indent=2), "utf-8")
    print(f"✅ member_rankings.json → {len(member_data)} 筆")

    # ── 2. v7_rankings.json (團體排行) ───────────────────────────────────
    # 每個團體，統計成員數、計算平均分
    group_members: dict[str, list] = {}
    for m in member_data:
        gname = m["group"]
        if gname:
            group_members.setdefault(gname, []).append(m)

    group_data = []
    for g in groups:
        gname = g["name"]
        if not gname:
            continue
        mlist = group_members.get(gname, [])
        cnt   = len(mlist)
        sa    = round(sum(m["social_activity"] for m in mlist) / cnt, 1) if cnt else 0
        ti    = round(sum(m["temperature_index"] for m in mlist) / cnt, 1) if cnt else 0
        cs    = round(sum(m["conversion_score"] for m in mlist) / cnt, 1) if cnt else 0
        names = " / ".join(m["name"] for m in mlist[:6])
        group_data.append({
            "group":        gname,
            "display_name": gname,
            "color":        g.get("color", "#888888"),
            "member_count": cnt,
            "member_names": names,
            "social_activity":  sa,
            "temperature_index": ti,
            "conversion_score":  cs,
        })

    group_data.sort(key=lambda x: x["temperature_index"], reverse=True)
    for i, g in enumerate(group_data):
        g["rank"] = i + 1

    OUT_GROUPS.write_text(json.dumps(group_data, ensure_ascii=False, indent=2), "utf-8")
    print(f"✅ v7_rankings.json → {len(group_data)} 個團體")

    # ── 3. insights.json ─────────────────────────────────────────────────
    active_groups = sum(1 for g in group_data if g["member_count"] > 0)
    scored = [m for m in member_data if m["temperature_index"] > 0]
    mkt_temp = round(sum(m["temperature_index"] for m in scored) / len(scored), 1) if scored else 0
    top10 = member_data[:10]
    # Rising Stars = 有照片 + 有 Instagram 但排名靠後
    rising = [m["name"] for m in member_data if m["instagram"] and m["photo_url"] and m["rank"] > 50][:5]
    heat_drop = [m["name"] for m in member_data if not m["instagram"] and m["rank"] <= 100][:3]
    top_group = group_data[0]["display_name"] if group_data else "—"
    social_king = max(member_data, key=lambda x: x["social_activity"])["name"] if member_data else "—"

    insights = {
        "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "market_temperature": mkt_temp,
        "active_groups": active_groups,
        "weekly_highlights": {
            "top_group": top_group,
            "social_king": social_king,
            "market_temperature": mkt_temp,
        },
        "rising_stars": rising,
        "heat_drop":    heat_drop,
        "top_members":  [m["name"] for m in top10],
    }
    OUT_INSIGHTS.write_text(json.dumps(insights, ensure_ascii=False, indent=2), "utf-8")
    print(f"✅ insights.json 生成完畢 (市場溫度 {mkt_temp}, 活躍團體 {active_groups})")
    print(f"   本週戰神: {top_group} | 社群之王: {social_king}")


if __name__ == "__main__":
    main()
