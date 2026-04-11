#!/usr/bin/env python3
"""
同步 idolmaps Supabase 的成員、團體與歷史資料，輸出前端用 JSON。
"""

from __future__ import annotations

import json
import math
import os
import pathlib
from datetime import datetime, timezone

import httpx

SUPABASE_URL = "https://ziiagdrrytyrmzoeegjk.supabase.co"
ANON_KEY = os.environ.get("IDOLMAPS_ANON_KEY", "") or "sb_publishable_PtKb4LIJeJN3cECUJllW7w_UFRVTbTv"

REPO_ROOT = pathlib.Path(__file__).parent.parent
DATA_DIR = REPO_ROOT / "frontend-next" / "public" / "data"
OUT_MEMBERS = DATA_DIR / "member_rankings.json"
OUT_GROUPS = DATA_DIR / "v7_rankings.json"
OUT_INSIGHTS = DATA_DIR / "insights.json"


def sb(path: str, params: dict):
    headers = {
        "apikey": ANON_KEY,
        "Authorization": f"Bearer {ANON_KEY}",
        "Accept": "application/json",
        "Accept-Profile": "public",
    }
    response = httpx.get(f"{SUPABASE_URL}/rest/v1/{path}", headers=headers, params=params, timeout=30)
    response.raise_for_status()
    return response.json()


def clamp_score(value: float) -> float:
    return round(max(0.0, min(100.0, value)), 1)


def score_member(member: dict, has_group: bool) -> dict:
    has_ig = bool((member.get("instagram") or "").startswith("http"))
    has_fb = bool((member.get("facebook") or "").startswith("http"))
    has_tw = bool((member.get("x") or "").startswith("http"))
    has_photo = bool((member.get("photo_url") or "").startswith("http"))
    has_profile = bool(member.get("id"))

    social_presence = clamp_score(has_ig * 16 + has_tw * 14 + has_fb * 10)
    profile_completeness = clamp_score(has_photo * 16 + has_profile * 6)

    updated_at = member.get("updated_at")
    days_since_update = 365.0
    if updated_at:
        try:
            dt = datetime.fromisoformat(str(updated_at).replace("Z", "+00:00"))
            days_since_update = max(0.0, (datetime.now(timezone.utc) - dt).total_seconds() / 86400)
        except Exception:
            days_since_update = 365.0

    freshness_score = clamp_score(28 * math.exp(-days_since_update / 45))
    group_affinity_score = 10.0 if has_group else 0.0
    temperature_index = clamp_score(
        social_presence + profile_completeness + freshness_score + group_affinity_score
    )

    return {
        "social_activity": social_presence,
        "profile_completeness": profile_completeness,
        "freshness_score": freshness_score,
        "group_affinity_score": group_affinity_score,
        "temperature_index": temperature_index,
        "conversion_score": clamp_score(temperature_index * 0.6),
    }


def score_group(group: dict, members: list[dict]) -> dict:
    count = len(members)
    member_average = (
        sum(member["temperature_index"] for member in members) / count if count else 0.0
    )
    member_depth = min(18.0, 6.0 * math.log2(count + 1)) if count else 0.0
    social_coverage = clamp_score(
        ((group.get("instagram") or "").startswith("http")) * 8
        + ((group.get("x") or "").startswith("http")) * 8
        + ((group.get("facebook") or "").startswith("http")) * 5
        + ((group.get("youtube") or "").startswith("http")) * 7
    )
    temperature_index = clamp_score(member_average * 0.72 + member_depth + social_coverage)
    social_activity = round(
        sum(member["social_activity"] for member in members) / count, 1
    ) if count else 0.0

    return {
        "social_activity": social_activity,
        "temperature_index": temperature_index,
        "conversion_score": clamp_score(temperature_index * 0.6),
    }


def main():
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
    member_group_map: dict[str, dict] = {}
    for row in history:
        member_id = row.get("member_id")
        group_id = row.get("group_id")
        if member_id and group_id and member_id not in member_group_map:
            member_group_map[member_id] = group_map.get(group_id, {})

    member_data = []
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
                "photo_url": photo_url if photo_url.startswith("http") else "",
                "member_url": f"https://idolmaps.com/member/{member.get('id', '')}",
                **scores,
            }
        )

    member_data.sort(key=lambda item: item["temperature_index"], reverse=True)
    for index, member in enumerate(member_data):
        member["rank"] = index + 1

    grouped_members: dict[str, list[dict]] = {}
    for member in member_data:
        if member["group"]:
            grouped_members.setdefault(member["group"], []).append(member)

    group_data = []
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
                "youtube": group.get("youtube") or "",
                **scores,
            }
        )

    group_data = [group for group in group_data if group["member_count"] > 0]
    group_data.sort(key=lambda item: item["temperature_index"], reverse=True)
    for index, group in enumerate(group_data):
        group["rank"] = index + 1

    scored_members = [member for member in member_data if member["temperature_index"] > 0]
    market_temperature = (
        round(sum(member["temperature_index"] for member in scored_members) / len(scored_members), 1)
        if scored_members
        else 0.0
    )

    insights = {
        "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "market_temperature": market_temperature,
        "active_groups": len(group_data),
        "weekly_highlights": {
            "top_group": group_data[0]["display_name"] if group_data else "暫無資料",
            "social_king": max(member_data, key=lambda item: item["social_activity"])["name"] if member_data else "暫無資料",
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
