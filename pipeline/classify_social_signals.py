"""
Classify raw social signals for Idol Social Heat Platform v9.

Reads public/data/social_signals.json and writes
public/data/social_signals_scored.json. If no raw file exists, a small mock
dataset is created so the pipeline can run end-to-end in a fresh checkout.
"""
from __future__ import annotations

import json
import re
import unicodedata
from pathlib import Path
from typing import Any


ROOT = Path(__file__).parent.parent
DATA_DIR = ROOT / "public" / "data"
RAW = DATA_DIR / "social_signals.json"
OUT = DATA_DIR / "social_signals_scored.json"

KEYWORDS = {
    "support": ["可愛", "かわいい", "好き", "推", "最強", "好棒", "支持", "神", "尊い", "天才", "讚", "感謝", "ありがとう"],
    "attendance_intent": ["想去", "會去", "必去", "現場見", "參戰", "跑場", "下次見", "今天見", "明天見", "一定去"],
    "merch_intent": ["チェキ", "拍立得", "合照", "簽名", "特典", "物販", "周邊", "買爆"],
    "ticket_question": ["票", "預約", "入場", "幾點", "場地", "在哪", "多少錢", "怎麼報名", "費用", "時間"],
    "expedition_intent": ["遠征", "台北", "高雄", "台中", "日本", "交通", "住宿", "機票", "新幹線"],
    "new_fan_signal": ["第一次看", "被圈粉", "入坑", "想認識", "剛追蹤", "新粉"],
    "spread": ["@", "分享", "轉發", "引用", "推給你", "大家看", "看一下"],
    "long_review": ["心得", "repo", "感想", "觀後感"],
    "operation_feedback": ["營運", "動線", "票務", "音響", "場地", "時間安排", "希望改善", "排隊"],
    "negative_risk": ["爛", "失望", "不滿", "炎上", "騙", "黑箱", "退追", "吵架", "噁心", "割韭菜", "太貴", "沒用"],
}

PRIORITY = [
    "negative_risk",
    "operation_feedback",
    "merch_intent",
    "attendance_intent",
    "ticket_question",
    "expedition_intent",
    "new_fan_signal",
    "spread",
    "long_review",
    "support",
]

MOCK_SIGNALS = [
    {
        "id": "sig_001",
        "platform": "threads",
        "source_url": "https://www.threads.net/",
        "entity_type": "group",
        "entity_name": "溟海オシアナス",
        "member_name": "桜野杏理",
        "author_name": "fan_a",
        "author_username": "fan_a",
        "text": "下次現場一定去，想拍チェキ！",
        "created_at": "2026-05-11T20:30:00+08:00",
        "like_count": 12,
        "reply_count": 2,
        "repost_count": 1,
        "quote_count": 0,
        "hashtags": ["溟海オシアナス"],
        "mentions": [],
    },
    {
        "id": "sig_002",
        "platform": "instagram",
        "source_url": "https://www.instagram.com/",
        "entity_type": "group",
        "entity_name": "#FFFFFF",
        "member_name": "",
        "author_name": "new_fan_01",
        "author_username": "new_fan_01",
        "text": "第一次看就被圈粉，想認識大家，今天的表演好棒！",
        "created_at": "2026-05-11T22:10:00+08:00",
        "like_count": 36,
        "reply_count": 4,
        "repost_count": 2,
        "quote_count": 0,
        "hashtags": ["FFFFFF", "地下偶像"],
        "mentions": [],
    },
    {
        "id": "sig_003",
        "platform": "x",
        "source_url": "https://x.com/",
        "entity_type": "group",
        "entity_name": "#FFFFFF",
        "member_name": "",
        "author_name": "fan_b",
        "author_username": "fan_b",
        "text": "票在哪預約？入場時間和場地資訊想確認一下",
        "created_at": "2026-05-12T10:15:00+08:00",
        "like_count": 7,
        "reply_count": 3,
        "repost_count": 0,
        "quote_count": 0,
        "hashtags": ["FFFFFF"],
        "mentions": [],
    },
    {
        "id": "sig_004",
        "platform": "youtube",
        "source_url": "https://www.youtube.com/",
        "entity_type": "group",
        "entity_name": "新增經歷",
        "member_name": "",
        "author_name": "repo_fan",
        "author_username": "repo_fan",
        "text": "昨天現場心得 repo：歌單很順，MC 很有記憶點，最後一首的call也很好跟，會想再帶朋友去看一下。",
        "created_at": "2026-05-12T23:40:00+08:00",
        "like_count": 28,
        "reply_count": 5,
        "repost_count": 4,
        "quote_count": 1,
        "hashtags": ["新增經歷"],
        "mentions": ["friend_a"],
    },
    {
        "id": "sig_005",
        "platform": "facebook",
        "source_url": "https://www.facebook.com/",
        "entity_type": "group",
        "entity_name": "新增經歷",
        "member_name": "",
        "author_name": "fan_c",
        "author_username": "fan_c",
        "text": "希望改善排隊動線，音響今天有點不穩，但成員表演還是很讚。",
        "created_at": "2026-05-13T00:05:00+08:00",
        "like_count": 10,
        "reply_count": 6,
        "repost_count": 0,
        "quote_count": 0,
        "hashtags": [],
        "mentions": [],
    },
    {
        "id": "sig_006",
        "platform": "tiktok",
        "source_url": "https://www.tiktok.com/",
        "entity_type": "group",
        "entity_name": "#0000FF",
        "member_name": "",
        "author_name": "spread_fan",
        "author_username": "spread_fan",
        "text": "@friend 推給你，大家看一下這段，太神了",
        "created_at": "2026-05-13T09:10:00+08:00",
        "like_count": 55,
        "reply_count": 8,
        "repost_count": 12,
        "quote_count": 3,
        "hashtags": ["0000FF", "地下偶像"],
        "mentions": ["friend"],
    },
]


def load_json(path: Path, default: Any) -> Any:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (FileNotFoundError, json.JSONDecodeError):
        return default


def contains_any(text: str, words: list[str]) -> bool:
    lower = text.lower()
    return any(word.lower() in lower for word in words)


def is_invalid(text: str) -> bool:
    stripped = text.strip()
    if not stripped or len(stripped) < 2:
        return True
    meaningful = [
        char
        for char in stripped
        if not unicodedata.category(char).startswith(("S", "P", "Z"))
    ]
    if not meaningful:
        return True
    collapsed = re.sub(r"\s+", "", stripped)
    return len(collapsed) >= 6 and len(set(collapsed)) <= 2


def classify_signal(text: str) -> str:
    """Return the primary category for a social signal."""
    text = text or ""
    if is_invalid(text):
        return "invalid"
    if len(text) > 80 or contains_any(text, KEYWORDS["long_review"]):
        long_review = True
    else:
        long_review = False
    for category in PRIORITY:
        if category == "long_review" and long_review:
            return category
        if contains_any(text, KEYWORDS[category]):
            return category
    return "general"


def collect_tags(text: str, category: str) -> list[str]:
    tags = [] if category in {"invalid", "general"} else [category]
    for name, words in KEYWORDS.items():
        if name != category and contains_any(text, words):
            tags.append(name)
    if len(text or "") > 80 and "long_review" not in tags:
        tags.append("long_review")
    return sorted(set(tags))


def sentiment_for(category: str) -> str:
    if category in {"support", "attendance_intent", "merch_intent", "new_fan_signal", "spread"}:
        return "positive"
    if category == "ticket_question":
        return "question"
    if category == "negative_risk":
        return "negative"
    return "neutral"


def conversion_stage_for(text: str, category: str) -> str:
    if contains_any(text, ["已買票", "已預約", "已報名", "已付款", "已加入"]):
        return "converted"
    if category in {"support", "general"}:
        return "awareness"
    if category == "new_fan_signal":
        return "interest"
    if category in {"ticket_question", "operation_feedback"}:
        return "inquiry"
    if category in {"attendance_intent", "expedition_intent"}:
        return "attendance_intent"
    if category == "merch_intent":
        return "purchase_intent"
    if category in {"spread", "long_review"}:
        return "advocate"
    return "awareness"


def bounded(value: float) -> float:
    return round(max(0, min(100, value)), 1)


def score_quality(signal: dict[str, Any], category: str) -> float:
    base = {
        "invalid": 0,
        "general": 40,
        "support": 60,
        "ticket_question": 70,
        "attendance_intent": 82,
        "merch_intent": 88,
        "long_review": 90,
        "spread": 76,
        "negative_risk": 30,
        "operation_feedback": 58,
        "expedition_intent": 78,
        "new_fan_signal": 72,
    }.get(category, 40)
    if category == "invalid":
        return 0
    text = signal.get("text") or ""
    add = min(6, float(signal.get("like_count") or 0) * 0.08)
    add += min(5, float(signal.get("reply_count") or 0) * 0.6)
    add += min(4, len(text) / 80)
    return bounded(base + add)


def score_conversion(text: str, category: str) -> float:
    if contains_any(text, ["已買票", "已預約", "已報名", "已付款", "已加入"]):
        return 100
    return {
        "invalid": 0,
        "support": 25,
        "new_fan_signal": 55,
        "ticket_question": 72,
        "attendance_intent": 82,
        "expedition_intent": 78,
        "merch_intent": 90,
        "negative_risk": 10,
    }.get(category, 20)


def score_risk(text: str, category: str) -> float:
    if contains_any(text, ["營運", "黑箱", "炎上", "退追"]) and contains_any(text, KEYWORDS["negative_risk"]):
        return 85
    if category == "negative_risk":
        return 70
    if category == "operation_feedback":
        return 30
    if category == "ticket_question":
        return 15
    if category == "invalid":
        return 20
    return 5 if category in {"support", "attendance_intent", "merch_intent", "new_fan_signal", "spread"} else 10


def score_signal(signal: dict[str, Any]) -> dict[str, Any]:
    text = signal.get("text") or ""
    category = classify_signal(text)
    scored = dict(signal)
    scored["category"] = category
    scored["sentiment"] = sentiment_for(category)
    scored["conversion_stage"] = conversion_stage_for(text, category)
    scored["tags"] = collect_tags(text, category)
    scored["quality_score"] = score_quality(signal, category)
    scored["conversion_score"] = score_conversion(text, category)
    scored["risk_score"] = score_risk(text, category)
    return scored


def ensure_raw_signals() -> list[dict[str, Any]]:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    signals = load_json(RAW, None)
    if not isinstance(signals, list):
        signals = MOCK_SIGNALS
        RAW.write_text(json.dumps(signals, ensure_ascii=False, indent=2), encoding="utf-8")
    return signals


def build() -> None:
    signals = ensure_raw_signals()
    scored = [score_signal(signal) for signal in signals if isinstance(signal, dict)]
    OUT.write_text(json.dumps(scored, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"social_signals_scored.json generated: {len(scored)} signals")


if __name__ == "__main__":
    build()
