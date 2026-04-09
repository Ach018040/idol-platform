import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  const { data: latest } = await supabaseAdmin
    .from("member_social_scores")
    .select("member_id, social_activity_score, score_date")
    .order("score_date", { ascending: false })
    .limit(200);

  if (!latest) return NextResponse.json({ ok: true, data: [] });

  const grouped: Record<string, any[]> = {};
  for (const row of latest) {
    if (!grouped[row.member_id]) grouped[row.member_id] = [];
    grouped[row.member_id].push(row);
  }

  const changes = Object.entries(grouped).map(([member_id, rows]) => {
    const [today, prev] = rows;
    return {
      member_id,
      change: prev ? today.social_activity_score - prev.social_activity_score : 0,
    };
  });

  return NextResponse.json({ ok: true, data: changes });
}
