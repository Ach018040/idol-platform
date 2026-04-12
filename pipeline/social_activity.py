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
from datetime import datetime, timezone
from typing import Any
from urllib.parse import urlparse

import httpx

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/124.0.0.0 Safari/537.36"
)

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


def _iso_or_none(value: datetime | None) -> str | None:
    if not value:
        return None
    return value.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _best_effort_fetch(url: str, client: httpx.Client) -> str | None:
    try:
        response = client.get(url)
        response.raise_for_status()
        return response.text
    except Exception:
        return None


def _fetch_instagram_last_post(handle: str, client: httpx.Client) -> datetime | None:
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
    signals: dict[str, dict[str, Any]] = {}

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

    with httpx.Client(
        headers={"User-Agent": USER_AGENT, "Accept-Language": "en-US,en;q=0.9"},
        follow_redirects=True,
        timeout=timeout,
    ) as client:
        for member in members:
            member_id = member.get("id", "")
            if not member_id:
                continue

            ig_handle = ig_handles.get(member_id)
            threads_handle = threads_handles.get(member_id)
            ig_dt = _fetch_instagram_last_post(ig_handle, client) if ig_handle else None
            threads_dt = _fetch_threads_last_post(threads_handle, client) if threads_handle else None
            social_signal_dt = max((dt for dt in (ig_dt, threads_dt) if dt), default=None)

            signals[member_id] = {
                "instagram_handle": ig_handle,
                "threads_handle": threads_handle,
                "last_post_at_instagram": _iso_or_none(ig_dt),
                "last_post_at_threads": _iso_or_none(threads_dt),
                "last_social_signal_at": _iso_or_none(social_signal_dt),
            }

    return signals


def dump_signals(path: str, signals: dict[str, dict[str, Any]]) -> None:
    with open(path, "w", encoding="utf-8") as fp:
        json.dump(signals, fp, ensure_ascii=False, indent=2)
