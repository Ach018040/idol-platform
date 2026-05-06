#!/usr/bin/env python3
"""
Discover candidate social profile links for members with missing IG / X / Facebook / Threads.

The script is intentionally conservative: it writes a reviewable JSON report and
does not mutate Supabase. Candidates can later be approved by an admin workflow.
"""

from __future__ import annotations

import json
import os
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.parse import quote_plus, unquote, urlparse

import httpx

REPO_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = REPO_ROOT / "frontend-next" / "public" / "data"
MEMBER_RANKINGS_PATH = DATA_DIR / "member_rankings.json"
OUT_PATH = DATA_DIR / "social_link_discovery.json"

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/124.0.0.0 Safari/537.36"
)

PLATFORMS = {
    "instagram": ["instagram.com"],
    "x": ["x.com", "twitter.com"],
    "facebook": ["facebook.com", "fb.com"],
    "threads": ["threads.net", "threads.com"],
}
MAX_MEMBERS = int(os.environ.get("SOCIAL_LINK_DISCOVERY_MAX_MEMBERS", "80"))
MAX_QUERIES = int(os.environ.get("SOCIAL_LINK_DISCOVERY_MAX_QUERIES", "240"))


def has_url(value: str | None) -> bool:
    return bool(value and str(value).startswith("http"))


def normalize_candidate_url(url: str) -> str | None:
    url = unquote(url)
    if url.startswith("/url?q="):
        url = url.split("/url?q=", 1)[1].split("&", 1)[0]
    if not url.startswith("http"):
        return None
    parsed = urlparse(url)
    host = parsed.netloc.lower().replace("www.", "")
    if not any(domain in host for domains in PLATFORMS.values() for domain in domains):
        return None
    path = parsed.path.split("?")[0].strip("/")
    if not path:
        return None
    if path.split("/")[0] in {"p", "reel", "explore", "share", "hashtag", "search"}:
        return None
    return f"{parsed.scheme}://{parsed.netloc}/{path}"


def platform_for_url(url: str) -> str | None:
    host = urlparse(url).netloc.lower()
    for platform, domains in PLATFORMS.items():
        if any(domain in host for domain in domains):
            return platform
    return None


def query_duckduckgo(query: str, client: httpx.Client) -> list[str]:
    response = client.get(
        "https://duckduckgo.com/html/",
        params={"q": query},
        headers={"User-Agent": USER_AGENT},
        timeout=20,
    )
    response.raise_for_status()
    urls: list[str] = []
    for match in re.findall(r'href="([^"]+)"', response.text):
        normalized = normalize_candidate_url(match)
        if normalized and normalized not in urls:
            urls.append(normalized)
    return urls


def query_member_profile(member: dict[str, Any], client: httpx.Client) -> list[str]:
    member_url = member.get("member_url")
    if not has_url(member_url):
        return []
    try:
        response = client.get(str(member_url), timeout=20)
        response.raise_for_status()
    except Exception:
        return []

    urls: list[str] = []
    for match in re.findall(r'https?://[^"\'>\s]+', response.text):
        normalized = normalize_candidate_url(match)
        if normalized and normalized not in urls:
            urls.append(normalized)
    return urls


def build_queries(member: dict[str, Any], platform: str) -> list[str]:
    name = str(member.get("name") or "").strip()
    roman = str(member.get("name_roman") or "").strip()
    nickname = str(member.get("nickname") or "").strip()
    group = str(member.get("group") or "").strip()
    domain = {
        "instagram": "instagram.com",
        "x": "x.com",
        "facebook": "facebook.com",
        "threads": "threads.net",
    }[platform]

    terms = [value for value in (name, roman, nickname) if value]
    queries: list[str] = []
    for term in terms[:3]:
        base = f'site:{domain} "{term}"'
        queries.append(f"{base} idol")
        if group:
            queries.append(f'{base} "{group}"')
    return queries[:4]


def confidence_for(member: dict[str, Any], url: str) -> float:
    lowered = url.lower()
    signals = 0
    for key in ("name", "name_roman", "nickname", "group"):
        value = str(member.get(key) or "").strip().lower()
        if value and quote_plus(value).lower().replace("+", "") in lowered.replace("-", "").replace("_", ""):
            signals += 1
    return round(min(0.85, 0.35 + signals * 0.15), 2)


def main() -> None:
    members = json.loads(MEMBER_RANKINGS_PATH.read_text(encoding="utf-8"))
    findings: list[dict[str, Any]] = []
    searched = 0

    with httpx.Client(follow_redirects=True, timeout=20, headers={"User-Agent": USER_AGENT}) as client:
        for member in members[:MAX_MEMBERS]:
            missing = [
                platform
                for platform, field in {
                    "instagram": "instagram",
                    "x": "twitter",
                    "facebook": "facebook",
                    "threads": "threads",
                }.items()
                if not has_url(member.get(field))
            ]
            if not missing:
                continue

            platform_candidates: dict[str, list[dict[str, Any]]] = {}
            profile_urls = query_member_profile(member, client)
            for platform in missing:
                candidates: list[dict[str, Any]] = []
                for url in profile_urls:
                    if platform_for_url(url) != platform:
                        continue
                    candidates.append(
                        {
                            "url": url,
                            "source_query": str(member.get("member_url") or "idolmaps profile"),
                            "confidence": max(0.7, confidence_for(member, url)),
                        }
                    )
                for query in build_queries(member, platform):
                    if candidates:
                        break
                    if searched >= MAX_QUERIES:
                        break
                    searched += 1
                    try:
                        for url in query_duckduckgo(query, client):
                            url_platform = platform_for_url(url)
                            if url_platform != platform:
                                continue
                            if any(item["url"] == url for item in candidates):
                                continue
                            candidates.append(
                                {
                                    "url": url,
                                    "source_query": query,
                                    "confidence": confidence_for(member, url),
                                }
                            )
                    except Exception:
                        continue
                    if len(candidates) >= 3:
                        break
                if candidates:
                    platform_candidates[platform] = sorted(
                        candidates,
                        key=lambda item: item["confidence"],
                        reverse=True,
                    )[:3]

            if platform_candidates:
                findings.append(
                    {
                        "member_id": member.get("id"),
                        "member_name": member.get("name"),
                        "group": member.get("group"),
                        "missing_platforms": missing,
                        "candidates": platform_candidates,
                    }
                )

            if searched >= MAX_QUERIES:
                break

    payload = {
        "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "schema_version": "social-link-discovery-v1",
        "searched_queries": searched,
        "members_with_candidates": len(findings),
        "note": "Review candidates before writing back to Supabase.",
        "findings": findings,
    }
    OUT_PATH.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {OUT_PATH} with {len(findings)} member candidate groups")


if __name__ == "__main__":
    main()
