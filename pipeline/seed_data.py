"""
seed_data.py
============
從零開始的第一步：產生初始假資料。
你拿到真實 CSV 之後，把這段替換成 read_csv 即可。

用法：
    python pipeline/seed_data.py
輸出：
    public/data/v7_rankings.json
    public/data/trend_snapshots.json   (空殼，等每日 append)
    public/data/v8_forecast.json       (空殼，等 10 天後真正跑)
"""

import json
import os
from datetime import date, timedelta
import random

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "public", "data")
os.makedirs(DATA_DIR, exist_ok=True)


# ── 1. v7_rankings.json ───────────────────────────────────────────────────────
# 這裡放你的團體資料。從零開始先用假資料，格式固定下來就好。
GROUPS_SEED = [
    {"entity_name": "#FFFFFF", "member_count": 6, "live_frequency": 92, "social_reach": 100, "growth_momentum": 0.14, "stability": 0.88, "momentum_acceleration": 0.05, "conversion_potential": 0.9},
    {"entity_name": "新增經歷",  "member_count": 6, "live_frequency": 80, "social_reach": 80,  "growth_momentum": 0.10, "stability": 0.82, "momentum_acceleration": 0.03, "conversion_potential": 0.85},
    {"entity_name": "#0000FF",   "member_count": 3, "live_frequency": 75, "social_reach": 75,  "growth_momentum": 0.08, "stability": 0.75, "momentum_acceleration": 0.02, "conversion_potential": 0.70},
    {"entity_name": "#FFFF00",   "member_count": 3, "live_frequency": 72, "social_reach": 73,  "growth_momentum": 0.07, "stability": 0.72, "momentum_acceleration": 0.01, "conversion_potential": 0.68},
    {"entity_name": "#800080",   "member_count": 2, "live_frequency": 50, "social_reach": 50,  "growth_momentum": 0.05, "stability": 0.60, "momentum_acceleration": 0.00, "conversion_potential": 0.55},
    {"entity_name": "大邦奶奶",  "member_count": 1, "live_frequency": 55, "social_reach": 55,  "growth_momentum": 0.04, "stability": 0.58, "momentum_acceleration": 0.01, "conversion_potential": 0.50},
    {"entity_name": "宿命白",    "member_count": 1, "live_frequency": 55, "social_reach": 55,  "growth_momentum": 0.04, "stability": 0.58, "momentum_acceleration": 0.01, "conversion_potential": 0.50},
    {"entity_name": "紅色",      "member_count": 1, "live_frequency": 55, "social_reach": 55,  "growth_momentum": 0.04, "stability": 0.57, "momentum_acceleration": 0.01, "conversion_potential": 0.48},
    {"entity_name": "#007500",   "member_count": 1, "live_frequency": 25, "social_reach": 25,  "growth_momentum": 0.01, "stability": 0.40, "momentum_acceleration": 0.00, "conversion_potential": 0.30},
    {"entity_name": "#C90000",   "member_count": 1, "live_frequency": 25, "social_reach": 25,  "growth_momentum": 0.01, "stability": 0.40, "momentum_acceleration": 0.00, "conversion_potential": 0.30},
]

def calc_v7_public(g):
    """v7 Public 指數公式（來自 TECHNICAL_SYSTEM_SPEC_v7.md 7.3 節）"""
    return round(
        0.30 * g["live_frequency"]
        + 0.25 * g["social_reach"]
        + 0.20 * g["growth_momentum"] * 100
        + 0.15 * g["stability"] * 100
        + 0.10 * g["momentum_acceleration"] * 100,
        2,
    )

groups = []
for g in GROUPS_SEED:
    row = dict(g)
    row["v7_index"] = calc_v7_public(g)
    groups.append(row)

groups.sort(key=lambda x: x["v7_index"], reverse=True)
for i, g in enumerate(groups):
    g["rank"] = i + 1

with open(os.path.join(DATA_DIR, "v7_rankings.json"), "w", encoding="utf-8") as f:
    json.dump(groups, f, ensure_ascii=False, indent=2)
print(f"✅ v7_rankings.json 寫入 ({len(groups)} 筆)")


# ── 2. trend_snapshots.json（回填 7 天假歷史，讓預測模型初期可用）────────────
snapshots = []
today = date.today()
for g in groups:
    for days_ago in range(7, -1, -1):  # 7 天前 → 今天
        d = today - timedelta(days=days_ago)
        noise = random.uniform(-0.5, 0.5)
        snapshots.append({
            "date": d.isoformat(),
            "entity_type": "group",
            "entity_id": g["entity_name"],
            "entity_name": g["entity_name"],
            "group": g["entity_name"],
            "live_frequency": g["live_frequency"],
            "social_reach": g["social_reach"],
            "growth_momentum": g["growth_momentum"],
            "stability": g["stability"],
            "momentum_acceleration": g["momentum_acceleration"],
            "v7_index": round(g["v7_index"] + noise, 2),
        })

snapshots.sort(key=lambda x: (x["entity_name"], x["date"]))
with open(os.path.join(DATA_DIR, "trend_snapshots.json"), "w", encoding="utf-8") as f:
    json.dump(snapshots, f, ensure_ascii=False, indent=2)
print(f"✅ trend_snapshots.json 寫入 ({len(snapshots)} 筆 / 7 天歷史)")


# ── 3. v8_forecast.json（空殼，真實預測需要 ≥10 天資料）────────────────────
with open(os.path.join(DATA_DIR, "v8_forecast.json"), "w", encoding="utf-8") as f:
    json.dump([], f, ensure_ascii=False, indent=2)
print("✅ v8_forecast.json 初始化（空殼）")


# ── 4. weekly_report.json（初始版）──────────────────────────────────────────
top = groups[0]
social_king = max(groups, key=lambda x: x["social_reach"])
rising = [g["entity_name"] for g in groups if g["momentum_acceleration"] > 0]
heat_drop = [g["entity_name"] for g in groups if g["momentum_acceleration"] < 0]
avg_temp = round(sum(g["v7_index"] for g in groups) / len(groups), 2)

weekly_report = {
    "generated_at": today.isoformat(),
    "market_temperature": avg_temp,
    "active_groups": len([g for g in groups if g["live_frequency"] > 0]),
    "weekly_highlights": {
        "top_group": top["entity_name"],
        "top_group_v7": top["v7_index"],
        "social_king": social_king["entity_name"],
        "social_king_score": social_king["social_reach"],
    },
    "rising_stars": rising[:3],
    "heat_drop": heat_drop[:3],
    "forecast_summary": [],
}

with open(os.path.join(DATA_DIR, "weekly_report.json"), "w", encoding="utf-8") as f:
    json.dump(weekly_report, f, ensure_ascii=False, indent=2)
print("✅ weekly_report.json 初始化完成")

print("\n🎉 所有初始資料已建立於 public/data/")
