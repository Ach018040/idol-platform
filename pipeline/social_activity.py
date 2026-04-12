#!/usr/bin/env python3
"""
Best-effort public social activity fetchers.

This module focuses on one pragmatic signal: the latest detectable public post
timestamp from Instagram / Threads profile pages. It is intentionally defensive:
network failures, parsing failures, or blocked pages return null signals instead
of failing the whole ranking pipeline.
"""

from __future__ import annotations

import json
import os
import re
from pathlib import Path
from datetime import datetime, timezone
from typing import Any
from urllib.parse import quote, urlparse

import httpx

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/124.0.0.0 Safari/537.36"
)
INSTAGRAM_APP_ID = "936619743392459"
CACHE_PATH = Path(__file__).with_name("social_activity_cache.json")
EXISTING_MEMBER_DATA_PATH = Path(__file__).resolve().parent.parent / "frontend-next" / "public" / "data" / "member_rankings.json"
SUCCESS_REFRESH_DAYS = int(os.environ.get("SOCIAL_ACTIVITY_SUCCESS_REFRESH_DAYS", "7"))
FAILURE_REFRESH_DAYS = int(os.environ.get("SOCIAL_ACTIVITY_FAILURE_REFRESH_DAYS", "2"))
MAX_FETCHES_PER_RUN = int(os.environ.get("SOCIAL_ACTIVITY_MAX_FETCHES", "40"))

ISO_PATTERNS = [
    r'"uploadDate"\s*:\s*"([^"]+)"',
    r'"datePublished"\s*:\s*"([^"]+)"',
    r'"dateCreated"\s*:\s*"([^"]+)"',
]

UNIX_PATTERNS = [
    r'"taken_at_timestamp"\s*:\s*(\d{10})',
    r'"publish_time"\s*:\s*(\d{10})',
    r'"creation_time"\s*:\s*(\d{10})',
]


def _env_enabled(name: str, default: bool = True) -> bool:
    raw = os.environ.get(name)
    if raw is None:
        return default
    return raw.strip().lower() not in {"0", "false", "no", "off"}


def normalize_instagram_handle(url: str | None) -> str | None:
    if not url:
        return None
    parsed = urlparse(url)
    if "instagram.com" not in parsed.netloc.lower():
        return None
    path = parsed.path.strip("/")
    if not path:
        return None
    handle = path.split("/")[0].strip()
    if not handle or handle.startswith("p/") or handle.startswith("reel/"):
        return None
    return handle.lstrip("@")


def normalize_threads_handle(url: str | None) -> str | None:
    if not url:
        return None
    parsed = urlparse(url)
    host = parsed.netloc.lower()
    if "threads.com" not in host:
        return None
    path = parsed.path.strip("/")
    if not path:
        return None
    handle = path.split("/")[0].strip()
    return handle.lstrip("@") if handle else None


def _parse_iso_candidate(value: str) -> datetime | None:
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00")).astimezone(timezone.utc)
    except Exception:
        return None


def _extract_latest_timestamp(text: str) -> datetime | None:
    candidates: list[datetime] = []

    for pattern in ISO_PATTERNS:
        for match in re.findall(pattern, text):
            parsed = _parse_iso_candidate(match)
            if parsed:
                candidates.append(parsed)

    for pattern in UNIX_PATTERNS:
        for match in re.findall(pattern, text):
            try:
                candidates.append(datetime.fromtimestamp(int(match), tz=timezone.utc))
            except Exception:
                continue

    if not candidates:
        return None
    return max(candidates)


def _datetime_from_unix(value: Any) -> datetime | None:
    try:
        if value in (None, ""):
            return None
        return datetime.fromtimestamp(int(value), tz=timezone.utc)
    except Exception:
        return None


def _iso_or_none(value: datetime | None) -> str | None:
    if not value:
        return None
    return value.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _parse_iso_datetime(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00")).astimezone(timezone.utc)
    except Exception:
        return None


def _load_cache() -> dict[str, dict[str, Any]]:
    cache: dict[str, dict[str, Any]] = {}
    if CACHE_PATH.exists():
        try:
            raw = json.loads(CACHE_PATH.read_text(encoding="utf-8"))
            if isinstance(raw, dict):
                cache = raw
        except Exception:
            cache = {}

    try:
        if EXISTING_MEMBER_DATA_PATH.exists():
            existing = json.loads(EXISTING_MEMBER_DATA_PATH.read_text(encoding="utf-8"))
            for item in existing:
                member_id = item.get("id")
                if not member_id:
                    continue
                if member_id not in cache:
                    cache[member_id] = {}
                seeded = cache[member_id]
                for key in (
                    "last_post_at_instagram",
                    "last_post_at_threads",
                    "last_social_signal_at",
                ):
                    if not seeded.get(key) and item.get(key):
                        seeded[key] = item.get(key)
                if not seeded.get("instagram_handle"):
                    seeded["instagram_handle"] = normalize_instagram_handle(item.get("instagram"))
                if not seeded.get("threads_handle"):
                    seeded["threads_handle"] = normalize_threads_handle(item.get("threads"))
    except Exception:
        pass
    return cache


def _save_cache(cache: dict[str, dict[str, Any]]) -> None:
    CACHE_PATH.write_text(json.dumps(cache, ensure_ascii=False, indent=2), encoding="utf-8")


def _member_updated_at(member: dict[str, Any]) -> datetime | None:
    for key in ("updated_at", "last_social_snapshot_at", "last_data_refresh_at"):
        parsed = _parse_iso_datetime(member.get(key))
        if parsed:
            return parsed
    return None


def _days_since(value: datetime | None, now: datetime) -> float | None:
    if not value:
        return None
    return max(0.0, (now - value).total_seconds() / 86400)


def _build_cached_signal(cached: dict[str, Any] | None, ig_handle: str | None, threads_handle: str | None) -> dict[str, Any]:
    cached = cached or {}
    signal = {
        "instagram_handle": ig_handle,
        "threads_handle": threads_handle,
        "last_post_at_instagram": None,
        "last_post_at_threads": None,
        "last_social_signal_at": None,
    }
    if cached.get("instagram_handle") == ig_handle:
        signal["last_post_at_instagram"] = cached.get("last_post_at_instagram")
    if cached.get("threads_handle") == threads_handle:
        signal["last_post_at_threads"] = cached.get("last_post_at_threads")

    candidates = [
        _parse_iso_datetime(signal["last_post_at_instagram"]),
        _parse_iso_datetime(signal["last_post_at_threads"]),
    ]
    latest = max((dt for dt in candidates if dt), default=None)
    signal["last_social_signal_at"] = _iso_or_none(latest)
    return signal


def _should_refresh(
    member: dict[str, Any],
    cached: dict[str, Any] | None,
    ig_handle: str | None,
    threads_handle: str | None,
    now: datetime,
) -> tuple[bool, tuple[int, float, float]]:
    if not ig_handle and not threads_handle:
        return False, (9, 9999.0, 9999.0)

    cached = cached or {}
    handles_changed = (
        cached.get("instagram_handle") != ig_handle or
        cached.get("threads_handle") != threads_handle
    )
    last_checked = _parse_iso_datetime(cached.get("last_checked_at"))
    last_signal = _parse_iso_datetime(cached.get("last_social_signal_at"))
    member_updated = _member_updated_at(member)

    days_since_checked = _days_since(last_checked, now)
    days_since_signal = _days_since(last_signal, now)
    days_since_member_update = _days_since(member_updated, now)

    if handles_changed or not cached:
        return True, (0, days_since_member_update or 9999.0, days_since_checked or 9999.0)

    if last_signal:
        if days_since_checked is not None and days_since_checked < SUCCESS_REFRESH_DAYS:
            return False, (3, days_since_signal or 9999.0, days_since_checked)
        return True, (1, days_since_signal or 9999.0, days_since_checked or 9999.0)

    if days_since_checked is not None and days_since_checked < FAILURE_REFRESH_DAYS:
        return False, (4, days_since_member_update or 9999.0, days_since_checked)
    return True, (2, days_since_member_update or 9999.0, days_since_checked or 9999.0)


def _best_effort_fetch(url: str, client: httpx.Client) -> str | None:
    try:
        response = client.get(url)
        response.raise_for_status()
        return response.text
    except Exception:
        return None


def _best_effort_fetch_json(
    url: str,
    client: httpx.Client,
    extra_headers: dict[str, str] | None = None,
) -> dict[str, Any] | None:
    try:
        response = client.get(url, headers=extra_headers)
        response.raise_for_status()
        return response.json()
    except Exception:
        return None


def _extract_instagram_timestamp_from_payload(payload: dict[str, Any] | None) -> datetime | None:
    if not payload:
        return None

    user = payload.get("data", {}).get("user", {})
    timeline = user.get("edge_owner_to_timeline_media", {})
    edges = timeline.get("edges") or []

    candidates: list[datetime] = []
    for edge in edges[:6]:
        node = edge.get("node", {})
        for value in (
            node.get("taken_at_timestamp"),
            node.get("video_upload_time"),
            node.get("published_at"),
        ):
            parsed = _datetime_from_unix(value)
            if parsed:
                candidates.append(parsed)

    if not candidates:
        return None
    return max(candidates)


def _fetch_instagram_last_post(handle: str, client: httpx.Client) -> datetime | None:
    payload = _best_effort_fetch_json(
        f"https://www.instagram.com/api/v1/users/web_profile_info/?username={quote(handle)}",
        client,
        extra_headers={
            "X-IG-App-ID": INSTAGRAM_APP_ID,
            "X-Requested-With": "XMLHttpRequest",
            "Referer": f"https://www.instagram.com/{handle}/",
        },
    )
    parsed_from_payload = _extract_instagram_timestamp_from_payload(payload)
    if parsed_from_payload:
        return parsed_from_payload

    html = _best_effort_fetch(f"https://www.instagram.com/{handle}/", client)
    if not html:
        return None
    return _extract_latest_timestamp(html)


def _fetch_threads_last_post(handle: str, client: httpx.Client) -> datetime | None:
    html = _best_effort_fetch(f"https://www.threads.com/@{handle}", client)
    if not html:
        return None
    return _extract_latest_timestamp(html)


def fetch_social_signals(members: list[dict[str, Any]]) -> dict[str, dict[str, Any]]:
    """
    Return per-member best-effort social activity timestamps.

    The output intentionally mirrors fields consumed by fetch_members.py so the
    pipeline can blend them into mixed freshness scoring immediately.
    """
    if not _env_enabled("FETCH_SOCIAL_ACTIVITY", default=True):
        return {}

    timeout = httpx.Timeout(8.0, connect=5.0)
    now = datetime.now(timezone.utc)
    cache = _load_cache()
    signals: dict[str, dict[str, Any]] = {}
    members_to_refresh: list[tuple[tuple[int, float, float], dict[str, Any]]] = []

    ig_handles = {
        member.get("id", ""): normalize_instagram_handle(member.get("instagram"))
        for member in members
        if member.get("id")
    }
    threads_handles = {
        member.get("id", ""): normalize_threads_handle(member.get("threads"))
        for member in members
        if member.get("id")
    }

    for member in members:
        member_id = member.get("id", "")
        if not member_id:
            continue
        ig_handle = ig_handles.get(member_id)
        threads_handle = threads_handles.get(member_id)
        cached = cache.get(member_id)
        signals[member_id] = _build_cached_signal(cached, ig_handle, threads_handle)
        should_refresh, priority = _should_refresh(member, cached, ig_handle, threads_handle, now)
        if should_refresh:
            members_to_refresh.append((priority, member))

    members_to_refresh.sort(key=lambda item: item[0])
    if MAX_FETCHES_PER_RUN > 0:
        members_to_refresh = members_to_refresh[:MAX_FETCHES_PER_RUN]

    with httpx.Client(
        headers={"User-Agent": USER_AGENT, "Accept-Language": "en-US,en;q=0.9"},
        follow_redirects=True,
        timeout=timeout,
    ) as client:
        for _, member in members_to_refresh:
            member_id = member.get("id", "")
            if not member_id:
                continue

            ig_handle = ig_handles.get(member_id)
            threads_handle = threads_handles.get(member_id)
            cached = cache.get(member_id, {})
            ig_dt = _fetch_instagram_last_post(ig_handle, client) if ig_handle else None
            threads_dt = _fetch_threads_last_post(threads_handle, client) if threads_handle else None
            refreshed_signal = {
                "instagram_handle": ig_handle,
                "threads_handle": threads_handle,
                "last_post_at_instagram": _iso_or_none(ig_dt),
                "last_post_at_threads": _iso_or_none(threads_dt),
            }
            merged_signal = _build_cached_signal(cached, ig_handle, threads_handle)
            if refreshed_signal["last_post_at_instagram"] is not None:
                merged_signal["last_post_at_instagram"] = refreshed_signal["last_post_at_instagram"]
            elif cached.get("instagram_handle") != ig_handle:
                merged_signal["last_post_at_instagram"] = None

            if refreshed_signal["last_post_at_threads"] is not None:
                merged_signal["last_post_at_threads"] = refreshed_signal["last_post_at_threads"]
            elif cached.get("threads_handle") != threads_handle:
                merged_signal["last_post_at_threads"] = None

            latest_signal_dt = max(
                (
                    dt for dt in (
                        _parse_iso_datetime(merged_signal.get("last_post_at_instagram")),
                        _parse_iso_datetime(merged_signal.get("last_post_at_threads")),
                    )
                    if dt
                ),
                default=None,
            )
            merged_signal["last_social_signal_at"] = _iso_or_none(latest_signal_dt)
            signals[member_id] = merged_signal
            cache[member_id] = {
                **merged_signal,
                "last_checked_at": _iso_or_none(now),
            }

    _save_cache(cache)
    return signals


def dump_signals(path: str, signals: dict[str, dict[str, Any]]) -> None:
    with open(path, "w", encoding="utf-8") as fp:
        json.dump(signals, fp, ensure_ascii=False, indent=2)
