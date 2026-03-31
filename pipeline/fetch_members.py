#!/usr/bin/env python3
"""
pipeline/fetch_members.py
從 idolmaps Supabase 抓取完整成員/團體資料，
更新 frontend-next/public/data/member_rankings.json
"""
import os, sys, json, pathlib
import httpx

SUPABASE_URL = "https://ziiagdrrytyrmzoeegjk.supabase.co"
ANON_KEY = os.environ.get("IDOLMAPS_ANON_KEY", "")

REPO_ROOT = pathlib.Path(__file__).parent.parent
OUT_MEMBERS = REPO_ROOT / "frontend-next" / "public" / "data" / "member_rankings.json"

def sb(path, params):
    h = {"apikey": ANON_KEY, "Authorization": f"Bearer {ANON_KEY}",
         "Accept": "application/json", "Accept-Profile": "public"}
    r = httpx.get(f"{SUPABASE_URL}/rest/v1/{path}", headers=h, params=params, timeout=30)
    r.raise_for_status()
    return r.json()

def main():
    if not ANON_KEY:
        print("⚠ IDOLMAPS_ANON_KEY not set, skipping fetch_members")
        sys.exit(0)

    print("⬇  Fetching members from idolmaps Supabase...")
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

    # 建立 member -> group 對應
    g_map = {g["id"]: g["name"] for g in groups}
    mg_map = {}
    for h in history:
        mid = h.get("member_id")
        gid = h.get("group_id")
        if mid and gid and mid not in mg_map:
            mg_map[mid] = g_map.get(gid, "")

    # 整理成 member_rankings.json 格式
    data = []
    for i, m in enumerate(members):
        ig = m.get("instagram") or ""
        fb = m.get("facebook") or ""
        tw = m.get("x") or ""
        ph = m.get("photo_url") or ""
        data.append({
            "rank": i + 1,
            "id": m.get("id", ""),
            "name": m.get("name", ""),
            "name_roman": m.get("name_roman") or "",
            "nickname": m.get("nickname") or "",
            "group": mg_map.get(m.get("id", ""), ""),
            "color": m.get("color") or "",
            "color_name": m.get("color_name") or "",
            "birthday": m.get("birthdate") or "",
            "instagram": ig if ig.startswith("http") else "",
            "facebook": fb if fb.startswith("http") else "",
            "twitter": tw if tw.startswith("http") else "",
            "photo_url": ph if ph.startswith("http") else "",
            "member_url": f"https://idolmaps.com/member/{m.get('id', '')}",
            "social_activity": 0,
            "temperature_index": 0,
            "conversion_score": 0,
        })

    OUT_MEMBERS.parent.mkdir(parents=True, exist_ok=True)
    OUT_MEMBERS.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"✅ Wrote {len(data)} members to {OUT_MEMBERS}")

if __name__ == "__main__":
    main()
