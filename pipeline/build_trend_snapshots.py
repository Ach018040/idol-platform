"""
build_trend_snapshots.py
========================
每日執行一次，把最新 v7_rankings.json 的資料
append 進 trend_snapshots.json，並截斷保留最近 37 天。

用法：
    python pipeline/build_trend_snapshots.py
"""

import json
import os
from datetime import date, timedelta

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "public", "data")

SNAPSHOT_FIELDS = [
    "entity_type",
    "entity_id",
    "entity_name",
    "group",
    "live_frequency",
    "social_reach",
    "growth_momentum",
    "stability",
    "momentum_acceleration",
    "v7_index",
]


def build_trend_snapshots(
    v7_file: str = None,
    snapshot_file: str = None,
):
    v7_file = v7_file or os.path.join(DATA_DIR, "v7_rankings.json")
    snapshot_file = snapshot_file or os.path.join(DATA_DIR, "trend_snapshots.json")

    today = date.today().isoformat()

    # 1. 讀最新 v7 排行
    with open(v7_file, encoding="utf-8") as f:
        rankings = json.load(f)

    # 2. 建今日快照（只取需要的欄位）
    today_snaps = []
    for g in rankings:
        snap = {
            "date": today,
            "entity_type": "group",
            "entity_id": g.get("entity_name", g.get("group", "unknown")),
            "entity_name": g.get("entity_name", g.get("group", "unknown")),
            "group": g.get("entity_name", g.get("group", "unknown")),
            "live_frequency": g.get("live_frequency", 0),
            "social_reach": g.get("social_reach", 0),
            "growth_momentum": g.get("growth_momentum", 0),
            "stability": g.get("stability", 0),
            "momentum_acceleration": g.get("momentum_acceleration", 0),
            "v7_index": g.get("v7_index", 0),
        }
        today_snaps.append(snap)

    # 3. 讀歷史快照
    try:
        with open(snapshot_file, encoding="utf-8") as f:
            history = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        history = []

    # 4. 防重複：移除同一天已存在的資料再合併
    history = [s for s in history if s.get("date") != today]
    all_snaps = history + today_snaps

    # 5. 截斷：只保留最近 37 天（規格要求）
    cutoff = (date.today() - timedelta(days=37)).isoformat()
    all_snaps = [s for s in all_snaps if s.get("date", "") >= cutoff]

    # 6. 排序
    all_snaps.sort(key=lambda x: (x.get("entity_name", ""), x.get("date", "")))

    # 7. 寫出
    with open(snapshot_file, "w", encoding="utf-8") as f:
        json.dump(all_snaps, f, ensure_ascii=False, indent=2)

    print(f"✅ trend_snapshots.json updated — {today} ({len(today_snaps)} groups, total {len(all_snaps)} records)")


if __name__ == "__main__":
    build_trend_snapshots()
