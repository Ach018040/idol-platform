#!/usr/bin/env python3
"""
Discover public idol event data from configured listing pages.

Scrapling is used when available because its selectors can survive minor page
layout changes. The script keeps an httpx fallback so the daily pipeline can
continue even before Scrapling is installed in CI.
"""

from __future__ import annotations

import json
import os
import pathlib
import re
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from typing import Any
from urllib.parse import urljoin

import httpx

try:
    from scrapling.fetchers import Fetcher
    from scrapling.parser import Selector
except Exception:  # pragma: no cover - optional dependency
    Fetcher = None
    Selector = None

REPO_ROOT = pathlib.Path(__file__).parent.parent
DATA_DIR = REPO_ROOT / "frontend-next" / "public" / "data"
SOURCE_PATH = pathlib.Path(__file__).with_name("event_sources.json")
GROUP_DATA_PATH = DATA_DIR / "v7_rankings.json"
OUT_EVENTS = DATA_DIR / "event_discovery.json"

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/124.0.0.0 Safari/537.36"
)


@dataclass
class EventRecord:
    source_id: str
    source_name: str
    source_url: str
    title: str
    starts_at: str | None
    ends_at: str | None
    timezone: str
    venue_name: str
    venue_address: str
    city: str
    group_names: list[str]
    member_names: list[str]
    ticket_url: str | None
    detail_url: str | None
    image_url: str | None
    raw_text: str
    scraped_at: str
    confidence: float
    extraction_method: str


def _now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _read_json(path: pathlib.Path, fallback: Any) -> Any:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return fallback


def _load_group_names() -> list[str]:
    rows = _read_json(GROUP_DATA_PATH, [])
    names = {
        str(row.get("display_name") or row.get("group") or "").strip()
        for row in rows
        if row.get("display_name") or row.get("group")
    }
    return sorted((name for name in names if name), key=len, reverse=True)


def _clean_text(value: str | None) -> str:
    if not value:
        return ""
    return re.sub(r"\s+", " ", value).strip()


def _selector_text(node: Any, selector: str | None) -> str:
    if not selector:
        return ""
    try:
        found = node.css(selector)
        if not found:
            return ""
        text = found.css("::text").getall()
        return _clean_text(" ".join(text) if text else found[0].text)
    except Exception:
        return ""


def _selector_attr(node: Any, selector: str | None, attr: str) -> str:
    if not selector:
        return ""
    try:
        found = node.css(selector)
        if not found:
            return ""
        return _clean_text(found[0].attrib.get(attr, ""))
    except Exception:
        return ""


def _fetch_page(url: str) -> tuple[Any | None, str]:
    if Fetcher is not None:
        try:
            page = Fetcher.get(url, stealthy_headers=True, follow_redirects=True, timeout=20)
            return page, "scrapling"
        except Exception:
            pass

    try:
        response = httpx.get(
            url,
            headers={"User-Agent": USER_AGENT, "Accept-Language": "zh-TW,zh;q=0.9,en;q=0.7"},
            follow_redirects=True,
            timeout=20,
        )
        response.raise_for_status()
        if Selector is not None:
            return Selector(response.text), "httpx+scrapling-parser"
        return None, "httpx"
    except Exception:
        return None, "failed"


def _parse_datetime(text: str) -> str | None:
    normalized = text.replace("年", "/").replace("月", "/").replace("日", " ")
    date_match = re.search(r"(20\d{2})[/-](\d{1,2})[/-](\d{1,2})", normalized)
    if not date_match:
        date_match = re.search(r"(?<!\d)(\d{1,2})[/-](\d{1,2})(?!\d)", normalized)
    time_match = re.search(r"(?<!\d)([01]?\d|2[0-3]):([0-5]\d)", normalized)

    now = datetime.now()
    if not date_match:
        return None

    if len(date_match.groups()) == 3:
        year, month, day = [int(part) for part in date_match.groups()]
    else:
        year = now.year
        month, day = [int(part) for part in date_match.groups()]

    hour = int(time_match.group(1)) if time_match else 0
    minute = int(time_match.group(2)) if time_match else 0
    try:
        return datetime(year, month, day, hour, minute).strftime("%Y-%m-%dT%H:%M:%S+08:00")
    except ValueError:
        return None


def _infer_city(text: str) -> str:
    for city in ("台北", "新北", "桃園", "台中", "台南", "高雄", "新竹", "嘉義", "基隆"):
        if city in text:
            return city
    return ""


def _match_groups(text: str, group_names: list[str]) -> list[str]:
    lowered = text.lower()
    matched: list[str] = []
    for name in group_names:
        if name and name.lower() in lowered:
            matched.append(name)
        if len(matched) >= 8:
            break
    return matched


def _confidence(title: str, starts_at: str | None, venue: str, groups: list[str]) -> float:
    score = 0.15
    score += 0.25 if title else 0
    score += 0.25 if starts_at else 0
    score += 0.15 if venue else 0
    score += 0.2 if groups else 0
    return round(min(score, 1.0), 2)


def _extract_source(source: dict[str, Any], group_names: list[str]) -> list[EventRecord]:
    if not source.get("enabled", True):
        return []

    page, method = _fetch_page(str(source.get("url", "")))
    if page is None:
        return []

    field_selectors = source.get("field_selectors", {})
    scraped_at = _now_iso()
    records: list[EventRecord] = []

    try:
        nodes = page.css(source.get("event_selector") or "article, li")
    except Exception:
        nodes = []

    for node in nodes[:80]:
        raw_text = _clean_text(" ".join(node.css("::text").getall()))
        if len(raw_text) < 8:
            continue

        title = _selector_text(node, field_selectors.get("title")) or raw_text[:80]
        datetime_text = _selector_text(node, field_selectors.get("datetime")) or raw_text
        venue = _selector_text(node, field_selectors.get("venue"))
        href = _selector_attr(node, field_selectors.get("url"), "href")
        detail_url = urljoin(source["url"], href) if href else None
        groups = _match_groups(raw_text, group_names)
        starts_at = _parse_datetime(datetime_text)
        confidence = _confidence(title, starts_at, venue, groups)

        if confidence < 0.35:
            continue

        records.append(
            EventRecord(
                source_id=source.get("id", "unknown"),
                source_name=source.get("name", source.get("id", "unknown")),
                source_url=source["url"],
                title=title,
                starts_at=starts_at,
                ends_at=None,
                timezone="Asia/Taipei",
                venue_name=venue,
                venue_address=venue,
                city=_infer_city(venue or raw_text),
                group_names=groups,
                member_names=[],
                ticket_url=detail_url,
                detail_url=detail_url,
                image_url=None,
                raw_text=raw_text[:500],
                scraped_at=scraped_at,
                confidence=confidence,
                extraction_method=method,
            )
        )

    return records


def discover_events() -> list[dict[str, Any]]:
    if os.environ.get("EVENT_CRAWLER_ENABLED", "1").lower() in {"0", "false", "no"}:
        return []

    sources = _read_json(SOURCE_PATH, [])
    group_names = _load_group_names()
    records: list[EventRecord] = []
    for source in sources:
        records.extend(_extract_source(source, group_names))

    unique: dict[str, EventRecord] = {}
    for record in records:
        key = "|".join(
            [
                record.source_id,
                record.starts_at or "",
                record.title.lower(),
                record.venue_name.lower(),
            ]
        )
        if key not in unique or record.confidence > unique[key].confidence:
            unique[key] = record

    return [asdict(record) for record in sorted(unique.values(), key=lambda item: item.starts_at or "9999")]


def main() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    events = discover_events()
    payload = {
        "generated_at": _now_iso(),
        "schema_version": "event-discovery-v1",
        "events": events,
        "coverage": {
            "events": len(events),
            "with_start_time": sum(1 for event in events if event.get("starts_at")),
            "with_venue": sum(1 for event in events if event.get("venue_name")),
            "with_group_match": sum(1 for event in events if event.get("group_names")),
        },
    }
    OUT_EVENTS.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Updated {OUT_EVENTS.name}: {len(events)} discovered events")


if __name__ == "__main__":
    main()
