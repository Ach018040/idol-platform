#!/usr/bin/env python3
"""
Best-effort crawler for idolinfohub performer index.

The crawler writes a transparent JSON report. It is allowed to find zero rows;
that means the page likely renders client-side or hides links from static HTML.
"""

from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urljoin

import httpx

REPO_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = REPO_ROOT / "frontend-next" / "public" / "data"
OUT_PATH = DATA_DIR / "idolinfohub_performers.json"
SOURCE_URL = "https://idolinfohub.com/performers"

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/124.0.0.0 Safari/537.36"
)

SOCIAL_HOSTS = ("instagram.com", "x.com", "twitter.com", "facebook.com", "threads.net", "threads.com")


def clean_url(value: str) -> str:
    return value.replace("\\/", "/").split("?utm_", 1)[0].strip()


def platform_for(url: str) -> str:
    lowered = url.lower()
    if "instagram.com" in lowered:
        return "instagram"
    if "threads.net" in lowered or "threads.com" in lowered:
        return "threads"
    if "facebook.com" in lowered:
        return "facebook"
    if "x.com" in lowered or "twitter.com" in lowered:
        return "x"
    return "other"


def main() -> None:
    html = ""
    status_code = 0
    error = ""
    performers: list[dict[str, str]] = []
    social_links: list[dict[str, str]] = []

    try:
        response = httpx.get(SOURCE_URL, headers={"User-Agent": USER_AGENT}, follow_redirects=True, timeout=30)
        status_code = response.status_code
        response.raise_for_status()
        html = response.text
    except Exception as exc:
        error = str(exc)

    if html:
        performer_urls = sorted(set(re.findall(r'href=["\']([^"\']*performers/[^"\']+)["\']', html)))
        for href in performer_urls:
            url = urljoin(SOURCE_URL, clean_url(href))
            slug = url.rstrip("/").split("/")[-1]
            performers.append({"slug": slug, "url": url})

        raw_socials = sorted(
            set(
                match
                for match in re.findall(r'https?:\\?/\\?/[^"\'<>\s]+', html)
                if any(host in match.lower() for host in SOCIAL_HOSTS)
            )
        )
        for raw in raw_socials:
            url = clean_url(raw)
            social_links.append({"platform": platform_for(url), "url": url})

    payload = {
        "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "schema_version": "idolinfohub-performers-v1",
        "source_url": SOURCE_URL,
        "status_code": status_code,
        "error": error,
        "performer_count": len(performers),
        "social_link_count": len(social_links),
        "performers": performers[:500],
        "social_links": social_links[:500],
        "note": "Use as discovery evidence only; review before importing into Supabase.",
    }
    OUT_PATH.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {OUT_PATH} with {len(performers)} performers and {len(social_links)} social links")


if __name__ == "__main__":
    main()
