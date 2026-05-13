"""
Build entity-level Social Heat v9 scores.
"""
from __future__ import annotations

import json
from collections import Counter, defaultdict
from datetime import datetime
from pathlib import Path
from typing import Any


ROOT = Path(__file__).parent.parent
DATA_DIR = ROOT / "public" / "data"
V7 = DATA_DIR / "v7_rankings.json"
SCORED = DATA_DIR / "social_signals_scored.json"
SNAP = DATA_DIR / "trend_snapshots.json"
OUT = DATA_DIR / "social_heat_v9.json"


def load_json(path: Path, default: Any) -> Any:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (FileNotFoundError, json.JSONDecodeError):
        return default


def num(value: Any, default: float = 0) -> float:
    try:
        if value is None:
            return default
        return float(value)
    except (TypeError, ValueError):
        return default


def clamp(value: float) -> float:
    return round(max(0, min(100, value)), 1)


def average(values: list[float]) -> float:
    return sum(values) / len(values) if values else 0


def normalize(value: float, max_value: float) -> float:
    if max_value <= 0:
        return 0
    return clamp((value / max_value) * 100)


def risk_adjustment(avg_risk: float) -> int:
    if avg_risk <= 20:
        return 100
    if avg_risk <= 40:
        return 75
    if avg_risk <= 60:
        return 50
    if avg_risk <= 80:
        return 25
    return 0


def trend_change_scores(snapshots: list[dict[str, Any]]) -> dict[str, float]:
    by_entity: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for row in snapshots:
        name = row.get("entity_name")
        if name:
            by_entity[str(name)].append(row)

    changes: dict[str, float] = {}
    for name, rows in by_entity.items():
        rows = sorted(rows, key=lambda item: str(item.get("date") or ""))
        last_seven = rows[-7:]
        if len(last_seven) < 2:
            continue
        start = num(last_seven[0].get("v7_index"))
        end = num(last_seven[-1].get("v7_index"))
        if start > 0:
            changes[name] = ((end - start) / start) * 100
    return changes


def build_reasons(row: dict[str, Any]) -> list[str]:
    reasons = []
    if row["fan_conversion_score"] >= 75:
        reasons.append("現場 / 物販 / 票務轉換訊號明確")
    if row["engagement_quality_score"] >= 75:
        reasons.append("高品質留言比例高")
    if row["momentum_score"] >= 70:
        reasons.append("近期成長動能明顯")
    if row["core_fan_score"] >= 70:
        reasons.append("核心粉絲重複互動穩定")
    if row["content_spread_score"] >= 70:
        reasons.append("轉發、引用與提及擴散佳")
    if row["risk_score"] >= 50:
        reasons.append("存在負面或營運風險，需要關注")
    return reasons or ["社群訊號穩定，可持續觀察"]


def build_actions(category_counts: Counter[str]) -> list[str]:
    actions = []
    if category_counts["ticket_question"]:
        actions.append("補強票務、時間、場地資訊")
    if category_counts["merch_intent"]:
        actions.append("強化チェキ、物販、特典資訊")
    if category_counts["attendance_intent"]:
        actions.append("發布現場提醒與預約連結")
    if category_counts["new_fan_signal"]:
        actions.append("製作新粉入坑懶人包")
    if category_counts["negative_risk"]:
        actions.append("優先處理爭議與負面留言")
    if category_counts["spread"]:
        actions.append("設計可轉發素材與 Hashtag 活動")
    return actions or ["維持內容發布節奏並累積可追蹤互動"]


def build() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    v7_rows = load_json(V7, [])
    scored = load_json(SCORED, [])
    snapshots = load_json(SNAP, [])

    if not isinstance(v7_rows, list):
        v7_rows = []
    if not isinstance(scored, list):
        scored = []
    if not isinstance(snapshots, list):
        snapshots = []

    v7_by_name = {str(row.get("entity_name")): row for row in v7_rows if row.get("entity_name")}
    signals_by_entity: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for signal in scored:
        name = signal.get("entity_name")
        if name:
            signals_by_entity[str(name)].append(signal)

    entity_names = sorted(signals_by_entity)
    trend_changes = trend_change_scores(snapshots)

    raw_volume: dict[str, float] = {}
    raw_core: dict[str, float] = {}
    raw_spread: dict[str, float] = {}
    pre_rows: dict[str, dict[str, Any]] = {}

    for name in entity_names:
        signals = signals_by_entity.get(name, [])
        v7 = v7_by_name.get(name, {})
        category_counts = Counter(str(s.get("category") or "general") for s in signals)
        authors = [str(s.get("author_username") or s.get("author_name") or "") for s in signals]
        author_counts = Counter(author for author in authors if author)
        hashtags = [tag for s in signals for tag in (s.get("hashtags") or [])]
        mentions = [tag for s in signals for tag in (s.get("mentions") or [])]

        signal_count = len(signals)
        valid_count = sum(1 for s in signals if s.get("category") != "invalid")
        quality_values = [num(s.get("quality_score")) for s in signals]
        conversion_values = [num(s.get("conversion_score")) for s in signals]
        risk_values = [num(s.get("risk_score")) for s in signals]
        high_value_count = sum(1 for s in signals if num(s.get("quality_score")) >= 75)
        high_intent_count = sum(1 for s in signals if num(s.get("conversion_score")) >= 75)
        long_review_count = category_counts["long_review"] + sum(1 for s in signals if "long_review" in (s.get("tags") or []))
        invalid_count = category_counts["invalid"]

        volume_raw = (
            signal_count * 10
            + sum(num(s.get("like_count")) for s in signals) * 0.45
            + sum(num(s.get("reply_count")) for s in signals) * 1.4
            + sum(num(s.get("repost_count")) for s in signals) * 2.2
            + sum(num(s.get("quote_count")) for s in signals) * 2.6
            + len(hashtags) * 1.3
            + len(mentions) * 1.6
        )
        if not signals:
            volume_raw = num(v7.get("social_reach"))

        valid_rate = valid_count / signal_count if signal_count else 0
        high_value_rate = high_value_count / signal_count if signal_count else 0
        long_review_rate = min(1, long_review_count / signal_count) if signal_count else 0
        invalid_penalty = invalid_count / signal_count if signal_count else 0
        engagement_quality_score = clamp(
            valid_rate * 30
            + average(quality_values) * 0.45
            + high_value_rate * 20
            + long_review_rate * 10
            - invalid_penalty * 25
        )

        fan_conversion_score = clamp(
            average(conversion_values) * 0.55
            + min(18, category_counts["attendance_intent"] * 7)
            + min(14, category_counts["ticket_question"] * 6)
            + min(18, category_counts["merch_intent"] * 8)
            + min(12, category_counts["expedition_intent"] * 6)
            + min(20, sum(1 for s in signals if s.get("conversion_stage") == "converted") * 10)
        )

        momentum_base = clamp(
            num(v7.get("growth_momentum")) * 320
            + num(v7.get("momentum_acceleration")) * 520
            + 45
        )
        if name in trend_changes:
            trend_component = clamp(50 + trend_changes[name] * 8)
            momentum_score = clamp(momentum_base * 0.65 + trend_component * 0.35)
        else:
            momentum_score = momentum_base

        repeat_touch = sum(max(0, count - 1) for count in author_counts.values())
        long_review_authors = {str(s.get("author_username") or "") for s in signals if s.get("category") == "long_review" or "long_review" in (s.get("tags") or [])}
        spread_authors = {str(s.get("author_username") or "") for s in signals if s.get("category") == "spread"}
        attendance_authors = {str(s.get("author_username") or "") for s in signals if s.get("category") == "attendance_intent"}
        merch_authors = {str(s.get("author_username") or "") for s in signals if s.get("category") == "merch_intent"}
        core_raw = repeat_touch * 9 + len(long_review_authors) * 12 + len(spread_authors) * 9 + len(attendance_authors) * 10 + len(merch_authors) * 12

        spread_raw = (
            sum(num(s.get("repost_count")) for s in signals) * 2.4
            + sum(num(s.get("quote_count")) for s in signals) * 3
            + len(mentions) * 2
            + len(hashtags) * 1.5
            + (category_counts["spread"] / signal_count * 25 if signal_count else 0)
        )

        risk_score = clamp(average(risk_values))
        raw_volume[name] = volume_raw
        raw_core[name] = core_raw
        raw_spread[name] = spread_raw
        pre_rows[name] = {
            "entity_name": name,
            "entity_type": signals[0].get("entity_type") if signals else "group",
            "engagement_quality_score": engagement_quality_score,
            "fan_conversion_score": fan_conversion_score,
            "momentum_score": momentum_score,
            "risk_adjustment_score": risk_adjustment(risk_score),
            "risk_score": risk_score,
            "signal_count": signal_count,
            "high_intent_count": high_intent_count,
            "core_fan_count": sum(1 for count in author_counts.values() if count >= 2) + len(long_review_authors | spread_authors | attendance_authors | merch_authors),
            "top_categories": dict(category_counts.most_common(6)),
            "top_hashtags": [tag for tag, _ in Counter(hashtags).most_common(8)],
            "top_authors": [author for author, _ in author_counts.most_common(8)],
            "_category_counts": category_counts,
        }

    max_volume = max(raw_volume.values(), default=0)
    max_core = max(raw_core.values(), default=0)
    max_spread = max(raw_spread.values(), default=0)
    rows = []
    for name, row in pre_rows.items():
        row["social_volume_score"] = normalize(raw_volume[name], max_volume)
        row["core_fan_score"] = normalize(raw_core[name], max_core)
        row["content_spread_score"] = normalize(raw_spread[name], max_spread)
        row["social_heat_v9"] = clamp(
            row["social_volume_score"] * 0.18
            + row["engagement_quality_score"] * 0.18
            + row["fan_conversion_score"] * 0.22
            + row["momentum_score"] * 0.14
            + row["core_fan_score"] * 0.12
            + row["content_spread_score"] * 0.10
            + row["risk_adjustment_score"] * 0.06
        )
        row["top_reasons"] = build_reasons(row)
        row["suggested_actions"] = build_actions(row["_category_counts"])
        row.pop("_category_counts", None)
        rows.append(row)

    rows.sort(key=lambda item: item["social_heat_v9"], reverse=True)
    for index, row in enumerate(rows, start=1):
        row["rank_v9"] = index

    OUT.write_text(json.dumps(rows, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"social_heat_v9.json generated: {len(rows)} entities")


if __name__ == "__main__":
    build()
