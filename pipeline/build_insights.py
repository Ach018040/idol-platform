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
SOCIAL_HEAT = ROOT / "public" / "data" / "social_heat_v9.json"
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
    try:
        social_heat = pd.read_json(SOCIAL_HEAT)
    except (FileNotFoundError, ValueError):
        social_heat = pd.DataFrame()

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

    if not social_heat.empty and "social_heat_v9" in social_heat.columns:
        social_sorted = social_heat.sort_values("social_heat_v9", ascending=False).reset_index(drop=True)
        top_social = social_sorted.iloc[0].to_dict() if len(social_sorted) else {}
        market_avg = round(float(social_heat["social_heat_v9"].mean()), 2)

        risk_watch = (
            social_heat[social_heat.get("risk_score", 0) >= 40]
            .sort_values("risk_score", ascending=False)
            .head(5)
        ) if "risk_score" in social_heat.columns else pd.DataFrame()
        conversion_groups = (
            social_heat.sort_values("fan_conversion_score", ascending=False).head(5)
            if "fan_conversion_score" in social_heat.columns else pd.DataFrame()
        )
        core_fan_groups = (
            social_heat.sort_values("core_fan_score", ascending=False).head(5)
            if "core_fan_score" in social_heat.columns else pd.DataFrame()
        )
        rising_v9 = (
            social_heat[
                (social_heat["social_heat_v9"] >= social_heat["social_heat_v9"].mean())
                & (social_heat.get("momentum_score", 0) >= 60)
            ]
            .sort_values(["momentum_score", "social_heat_v9"], ascending=False)
            .head(5)
        ) if "momentum_score" in social_heat.columns else pd.DataFrame()

        result.update({
            "social_heat_top_group": top_social.get("entity_name", "—"),
            "social_heat_market_average": market_avg,
            "social_heat_rising": rising_v9[
                [col for col in ["entity_name", "social_heat_v9", "momentum_score"] if col in rising_v9.columns]
            ].to_dict(orient="records") if not rising_v9.empty else [],
            "social_heat_risk_watch": risk_watch[
                [col for col in ["entity_name", "risk_score", "suggested_actions"] if col in risk_watch.columns]
            ].to_dict(orient="records") if not risk_watch.empty else [],
            "top_conversion_groups": conversion_groups[
                [col for col in ["entity_name", "fan_conversion_score", "high_intent_count"] if col in conversion_groups.columns]
            ].to_dict(orient="records") if not conversion_groups.empty else [],
            "top_core_fan_groups": core_fan_groups[
                [col for col in ["entity_name", "core_fan_score", "core_fan_count"] if col in core_fan_groups.columns]
            ].to_dict(orient="records") if not core_fan_groups.empty else [],
            "social_heat_summary": {
                "top_group": top_social.get("entity_name", "—"),
                "top_score": top_social.get("social_heat_v9", 0),
                "market_average": market_avg,
                "risk_watch_count": int(len(risk_watch)),
                "high_conversion_count": int((social_heat["fan_conversion_score"] >= 75).sum())
                if "fan_conversion_score" in social_heat.columns else 0,
            },
        })

    OUT.write_text(json.dumps(result, ensure_ascii=False, indent=2))
    print(f"insights.json generated - rising:{len(rising)} drop:{len(heat_drop)}")


if __name__ == "__main__":
    build()
