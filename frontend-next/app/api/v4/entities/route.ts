import { NextResponse } from "next/server";

import membersRaw from "@/public/data/member_rankings.json";
import groupsRaw from "@/public/data/v7_rankings.json";
import { buildGroupEntities, buildMemberEntities } from "@/lib/v4-entities";

export async function GET() {
  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    schemaVersion: "v4-entity-preview",
    members: buildMemberEntities(membersRaw, 80),
    groups: buildGroupEntities(groupsRaw, 40),
    suggestedAlerts: [
      {
        id: "score-drop",
        label: "溫度下降提醒",
        condition: "temperature_index_v2 較觀察值下降 5 分以上",
      },
      {
        id: "freshness-stale",
        label: "更新停滯提醒",
        condition: "freshnessDays 超過 14 天且仍在追蹤清單",
      },
      {
        id: "rank-opportunity",
        label: "上升機會提醒",
        condition: "分數高於 85 且資料可信度高於 80%",
      },
    ],
  });
}
