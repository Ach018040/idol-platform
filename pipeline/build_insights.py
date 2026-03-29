"""
pipeline/build_insights.py
產生 insights.json：Rising Star、Heat Drop、週報、市場溫度
"""
import json
import pandas as pd
from datetime import date
from pathlib import Path

ROOT     = Path(__file__).parent.parent
V7       = ROOT / "public" / "data" / "v7_rankings.json"
SNAP     = ROOT / "public" / "data" / "trend_snapshots.json"
FORECAST = ROOT / "public" / "data" / "v8_forecast.json"
OUT      = ROOT / "public" / "data" / "insights.json"


def build():
    # ── Load data ────────────────────────────────────────────────────
    v7 = pd.read_json(V7)
    try:
        snap = pd.read_json(SNAP)
    except (FileNotFoundError, ValueError):
        snap = pd.DataFrame()
    try:
        forecast = pd.read_json(FORECAST)
    except (FileNotFoundError, ValueError):
        forecast = pd.DataFrame()

    # ── Weekly highlights ────────────────────────────────────────────
    v7_sorted = v7.sort_values("v7_index", ascending=False).reset_index(drop=True)
    top_group   = v7_sorted.iloc[0]["entity_name"] if len(v7_sorted) else "—"

    social_col = "social_reach" if "social_reach" in v7.columns else "social_activity"
    social_king = (
        v7.sort_values(social_col, ascending=False).iloc[0]["entity_name"]
        if social_col in v7.columns and len(v7) else "—"
    )

    market_temp = round(v7["v7_index"].mean(), 2) if "v7_index" in v7.columns else 0.0
    active      = int((v7["social_activity"] > 0).sum()) if "social_activity" in v7.columns else len(v7)

    # ── Rising Star / Heat Drop (from trend snapshots) ───────────────
    rising    = []
    heat_drop = []
    if not snap.empty and "momentum_acceleration" in snap.columns:
        for name, g in snap.groupby("entity_name"):
            g = g.sort_values("date")
            if len(g) < 5:
                continue
            acc = g["momentum_acceleration"].iloc[-1]
            if acc > 0.02:
                rising.append(name)
            elif acc < -0.02:
                heat_drop.append(name)

    # Fallback: use forecast direction
    if not rising and not forecast.empty and "direction" in forecast.columns:
        rising    = forecast[forecast["direction"] == "up"]["entity_name"].tolist()
        heat_drop = forecast[forecast["direction"] == "down"]["entity_name"].tolist()

    # ── Rank changes ──────────────────────────────────────────────────
    rank_changes = v7_sorted[["entity_name"]].copy()
    rank_changes["rank"] = range(1, len(rank_changes) + 1)

    result = {
        "generated_at":    date.today().isoformat(),
        "market_temperature": market_temp,
        "active_groups":   active,
        "weekly_highlights": {
            "top_group":          top_group,
            "social_king":        social_king,
            "market_temperature": market_temp,
        },
        "rising_stars": rising[:5],
        "heat_drop":    heat_drop[:5],
        "rank_changes": rank_changes.to_dict(orient="records"),
    }

    OUT.write_text(json.dumps(result, ensure_ascii=False, indent=2))
    print(f"✨ insights.json generated — rising:{len(rising)} drop:{len(heat_drop)}")


if __name__ == "__main__":
    build()
