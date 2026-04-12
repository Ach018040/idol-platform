#!/usr/bin/env python3
"""
Fetch idolmaps data from Supabase and generate the structured ranking JSON files
used by the frontend. The schema keeps legacy fields for compatibility while
adding v2-ready analytics fields for future formula upgrades.
"""

from __future__ import annotations

import json
import math
import os
import pathlib
from datetime import datetime, timezone
from typing import Any

import httpx

SUPABASE_URL = "https://ziiagdrrytyrmzoeegjk.supabase.co"
ANON_KEY = os.environ.get("IDOLMAPS_ANON_KEY", "") or "sb_publishable_PtKb4LIJeJN3cECUJllW7w_UFRVTbTv"

REPO_ROOT = pathlib.Path(__file__).parent.parent
DATA_DIR = REPO_ROOT / "frontend-next" / "public" / "data"
OUT_MEMBERS = DATA_DIR / "member_rankings.json"
OUT_GROUPS = DATA_DIR / "v7_rankings.json"
OUT_INSIGHTS = DATA_DIR / "insights.json"
FORMULA_VERSION = "v2-mixed-freshness"


def sb(path: str, params: dict[str, Any]) -> list[dict[str, Any]]:
    headers = {
        "apikey": ANON_KEY,
        "Authorization": f"Bearer {ANON_KEY}",
        "Accept": "application/json",
        "Accept-Profile": "public",
    }
    response = httpx.get(
        f"{SUPABASE_URL}/rest/v1/{path}",
        headers=headers,
        params=params,
        timeout=30,
    )
    response.raise_for_status()
    return response.json()


def clamp_score(value: float) -> float:
    return round(max(0.0, min(100.0, value)), 1)


def safe_iso_to_datetime(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    except Exception:
        return None


def iso_or_none(value: datetime | None) -> str | None:
    if not value:
        return None
    return value.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def days_since(value: datetime | None, fallback: float = 365.0) -> float:
    if not value:
        return fallback
    return max(0.0, (datetime.now(timezone.utc) - value).total_seconds() / 86400)


def infer_content_type_mix(member: dict[str, Any]) -> list[str]:
    content_types = ["idol_updates"]
    if (member.get("photo_url") or "").startswith("http"):
        content_types.append("photo")
    if (member.get("instagram") or "").startswith("http") and (member.get("x") or "").startswith("http"):
        content_types.append("multi_platform")
    return content_types


def score_member(member: dict[str, Any], has_group: bool) -> dict[str, Any]:
    has_ig = bool((member.get("instagram") or "").startswith("http"))
    has_fb = bool((member.get("facebook") or "").startswith("http"))
    has_tw = bool((member.get("x") or "").startswith("http"))
    has_photo = bool((member.get("photo_url") or "").startswith("http"))
    has_profile = bool(member.get("id"))
    platform_count = int(has_ig) + int(has_fb) + int(has_tw)

    social_presence = clamp_score(
        has_ig * 14 + has_tw * 12 + has_fb * 8 + max(0, platform_count - 1) * 3
    )
    profile_completeness = clamp_score(has_photo * 14 + has_profile * 6)

    updated_dt = safe_iso_to_datetime(member.get("updated_at"))
    # Reserved for future ingestion from real Instagram / Threads / Facebook post metadata.
    ig_post_dt = safe_iso_to_datetime(member.get("last_post_at_instagram"))
    threads_post_dt = safe_iso_to_datetime(member.get("last_post_at_threads"))
    facebook_post_dt = safe_iso_to_datetime(member.get("last_post_at_facebook"))
    social_signal_dt = max(
        (dt for dt in (ig_post_dt, threads_post_dt, facebook_post_dt) if dt),
        default=None,
    )

    days_since_update = days_since(updated_dt)
    days_since_social_signal = days_since(social_signal_dt, fallback=days_since_update)

    data_refresh_score = clamp_score(8 * math.exp(-days_since_update / 45))
    social_post_score_raw = 12 * math.exp(-days_since_social_signal / 21)
    social_post_score = clamp_score(
        social_post_score_raw if social_signal_dt else social_post_score_raw * 0.55
    )
    freshness_score = clamp_score(data_refresh_score + social_post_score)
    group_affinity_score = 6.0 if has_group else 0.0
    raw_total = social_presence + profile_completeness + freshness_score + group_affinity_score
    temperature_index = clamp_score(raw_total * (100 / 86))
    content_consistency_score = clamp_score(freshness_score * 0.7 + profile_completeness * 0.3)
    data_confidence = round(
        min(
            0.85,
            0.2 + platform_count * 0.12 + (0.15 if has_photo else 0.0) + (0.1 if updated_dt else 0.0),
        ),
        2,
    )
    conversion_score = clamp_score(temperature_index * 0.6)

    return {
        "updated_at": member.get("updated_at") or "",
        "last_data_refresh_at": iso_or_none(updated_dt),
        "last_social_snapshot_at": iso_or_none(updated_dt),
        "days_since_update": round(days_since_update, 1),
        "last_post_at_instagram": iso_or_none(ig_post_dt),
        "last_post_at_threads": iso_or_none(threads_post_dt),
        "last_post_at_facebook": iso_or_none(facebook_post_dt),
        "last_social_signal_at": iso_or_none(social_signal_dt),
        "days_since_social_signal": round(days_since_social_signal, 1),
        "followers_instagram": None,
        "followers_threads": None,
        "avg_likes_instagram": None,
        "avg_comments_instagram": None,
        "avg_views_instagram": None,
        "avg_likes_threads": None,
        "avg_replies_threads": None,
        "avg_views_threads": None,
        "avg_engagement_instagram": None,
        "avg_engagement_threads": None,
        "engagement_rate_instagram": None,
        "engagement_rate_threads": None,
        "view_rate_instagram": None,
        "view_rate_threads": None,
        "content_type_primary": "idol_updates",
        "content_type_mix": infer_content_type_mix(member),
        "brand_collab_ratio": None,
        "brand_collab_engagement_rate": None,
        "organic_engagement_rate": None,
        "audience_geo_top": None,
        "audience_age_top": None,
        "audience_gender_split": None,
        "similar_creators": [],
        "data_confidence": data_confidence,
        "metrics_available": {
            "instagram_public": has_ig,
            "facebook_public": has_fb,
            "threads_public": has_tw,
            "social_post_dates": bool(social_signal_dt),
            "views_available": False,
            "audience_available": False,
            "commercial_available": False,
        },
        "reach_score": social_presence,
        "engagement_score": None,
        "view_quality_score": None,
        "content_consistency_score": content_consistency_score,
        "commercial_health_score": None,
        "audience_fit_score": None,
        "social_activity": social_presence,
        "profile_completeness": profile_completeness,
        "data_refresh_score": data_refresh_score,
        "social_post_score": social_post_score,
        "freshness_score": freshness_score,
        "group_affinity_score": group_affinity_score,
        "temperature_index": temperature_index,
        "conversion_score": conversion_score,
        "temperature_index_v2": temperature_index,
        "conversion_score_v2": conversion_score,
        "formula_version": FORMULA_VERSION,
    }


def score_group(group: dict[str, Any], members: list[dict[str, Any]]) -> dict[str, Any]:
    count = len(members)
    member_average = sum(member["temperature_index_v2"] for member in members) / count if count else 0.0
    top_member = max((member["temperature_index_v2"] for member in members), default=0.0)
    member_depth = min(9.0, 3.0 * math.log2(count + 1)) if count else 0.0
    social_coverage = clamp_score(
        ((group.get("instagram") or "").startswith("http")) * 6
        + ((group.get("x") or "").startswith("http")) * 5
        + ((group.get("facebook") or "").startswith("http")) * 3
        + ((group.get("youtube") or "").startswith("http")) * 4
    )
    temperature_index = clamp_score(
        member_average * 0.45 + top_member * 0.25 + member_depth + social_coverage
    )
    social_activity = (
        round(sum(member["social_activity"] for member in members) / count, 1) if count else 0.0
    )
    content_type_pool = {
        content_type
        for member in members
        for content_type in member.get("content_type_mix", [])
    }
    group_content_diversity_score = clamp_score(min(15.0, len(content_type_pool) * 4.0))
    latest_snapshot = max(
        (safe_iso_to_datetime(member.get("last_social_snapshot_at")) for member in members),
        default=None,
        key=lambda dt: dt or datetime.min.replace(tzinfo=timezone.utc),
    )
    conversion_score = clamp_score(temperature_index * 0.6)

    return {
        "member_average_temperature_v2": round(member_average, 1),
        "member_top_temperature_v2": round(top_member, 1),
        "group_social_coverage_score": social_coverage,
        "group_content_diversity_score": group_content_diversity_score,
        "group_temperature_index_v2": temperature_index,
        "group_conversion_score_v2": conversion_score,
        "active_member_count": count,
        "last_group_snapshot_at": iso_or_none(latest_snapshot),
        "social_activity": social_activity,
        "temperature_index": temperature_index,
        "conversion_score": conversion_score,
        "formula_version": FORMULA_VERSION,
    }


def main() -> None:
    print("Fetching idolmaps data...")
    members = sb(
        "members",
        {
            "select": "id,name,name_roman,nickname,color,color_name,birthdate,instagram,facebook,x,photo_url,updated_at",
            "order": "updated_at.desc",
            "limit": 500,
        },
    )
    groups = sb(
        "groups",
        {
            "select": "id,name,color,instagram,facebook,x,youtube",
            "order": "name.asc",
            "limit": 300,
        },
    )
    history = sb(
        "history",
        {
            "select": "member_id,group_id,joined_at",
            "order": "joined_at.desc",
            "limit": 2000,
        },
    )

    group_map = {group["id"]: group for group in groups}
    member_group_map: dict[str, dict[str, Any]] = {}
    for row in history:
        member_id = row.get("member_id")
        group_id = row.get("group_id")
        if member_id and group_id and member_id not in member_group_map:
            member_group_map[member_id] = group_map.get(group_id, {})

    member_data: list[dict[str, Any]] = []
    for member in members:
        group_obj = member_group_map.get(member.get("id", ""), {})
        scores = score_member(member, bool(group_obj.get("name")))
        instagram = member.get("instagram") or ""
        facebook = member.get("facebook") or ""
        twitter = member.get("x") or ""
        photo_url = member.get("photo_url") or ""

        member_data.append(
            {
                "rank": 0,
                "id": member.get("id", ""),
                "name": member.get("name", ""),
                "name_roman": member.get("name_roman") or "",
                "nickname": member.get("nickname") or "",
                "group": group_obj.get("name", ""),
                "color": member.get("color") or "",
                "color_name": member.get("color_name") or "",
                "birthday": member.get("birthdate") or "",
                "instagram": instagram if instagram.startswith("http") else "",
                "facebook": facebook if facebook.startswith("http") else "",
                "twitter": twitter if twitter.startswith("http") else "",
                "threads": twitter if twitter.startswith("http") else "",
                "photo_url": photo_url if photo_url.startswith("http") else "",
                "member_url": f"https://idolmaps.com/member/{member.get('id', '')}",
                **scores,
            }
        )

    member_data.sort(key=lambda item: item["temperature_index_v2"], reverse=True)
    for index, member in enumerate(member_data):
        member["rank"] = index + 1

    grouped_members: dict[str, list[dict[str, Any]]] = {}
    for member in member_data:
        if member["group"]:
            grouped_members.setdefault(member["group"], []).append(member)

    group_data: list[dict[str, Any]] = []
    for group in groups:
        group_name = group.get("name", "")
        if not group_name:
            continue
        linked_members = grouped_members.get(group_name, [])
        scores = score_group(group, linked_members)
        group_data.append(
            {
                "group": group_name,
                "display_name": group_name,
                "color": group.get("color", "#888888"),
                "member_count": len(linked_members),
                "member_names": " / ".join(member["name"] for member in linked_members[:6]),
                "instagram": group.get("instagram") or "",
                "facebook": group.get("facebook") or "",
                "twitter": group.get("x") or "",
                "threads": "",
                "youtube": group.get("youtube") or "",
                **scores,
            }
        )

    group_data = [group for group in group_data if group["member_count"] > 0]
    group_data.sort(key=lambda item: item["group_temperature_index_v2"], reverse=True)
    for index, group in enumerate(group_data):
        group["rank"] = index + 1

    scored_members = [member for member in member_data if member["temperature_index_v2"] > 0]
    market_temperature = (
        round(sum(member["temperature_index_v2"] for member in scored_members) / len(scored_members), 1)
        if scored_members
        else 0.0
    )

    insights = {
        "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "market_temperature": market_temperature,
        "market_temperature_v2": market_temperature,
        "active_groups": len(group_data),
        "formula_version": FORMULA_VERSION,
        "data_coverage": {
            "instagram": round(sum(1 for member in member_data if member["instagram"]) / len(member_data), 2) if member_data else 0,
            "threads": round(sum(1 for member in member_data if member["threads"]) / len(member_data), 2) if member_data else 0,
            "social_post_dates": round(
                sum(1 for member in member_data if member["last_social_signal_at"]) / len(member_data), 2
            ) if member_data else 0,
            "audience_insights": 0.0,
            "commercial_insights": 0.0,
            "views": 0.0,
        },
        "weekly_highlights": {
            "top_group": group_data[0]["display_name"] if group_data else "N/A",
            "social_king": max(member_data, key=lambda item: item["social_activity"])["name"] if member_data else "N/A",
            "social_focus": max(member_data, key=lambda item: item["social_activity"])["name"] if member_data else "N/A",
            "market_temperature": market_temperature,
        },
        "rising_stars": [
            member["name"]
            for member in member_data
            if member["instagram"] and member["photo_url"] and member["rank"] > 50
        ][:5],
        "heat_drop": [
            member["name"] for member in member_data if not member["instagram"] and member["rank"] <= 100
        ][:3],
        "top_members": [member["name"] for member in member_data[:10]],
    }

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    OUT_MEMBERS.write_text(json.dumps(member_data, ensure_ascii=False, indent=2), "utf-8")
    OUT_GROUPS.write_text(json.dumps(group_data, ensure_ascii=False, indent=2), "utf-8")
    OUT_INSIGHTS.write_text(json.dumps(insights, ensure_ascii=False, indent=2), "utf-8")
    print("Updated member_rankings.json, v7_rankings.json, insights.json")


if __name__ == "__main__":
    main()
