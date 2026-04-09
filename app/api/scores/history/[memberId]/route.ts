import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ memberId: string }> }
) {
  const { memberId } = await params;
  const { searchParams } = new URL(req.url);
  const limit = Number(searchParams.get("limit") || "30");

  const { data, error } = await supabaseAdmin
    .from("member_social_scores")
    .select("member_id, score_date, social_activity_score, temperature_index, momentum_score, platform_health_score")
    .eq("member_id", memberId)
    .order("score_date", { ascending: true })
    .limit(limit);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const series = (data || []).map((row) => ({
    date: row.score_date,
    social_activity: row.social_activity_score,
    temperature: row.temperature_index,
    momentum: row.momentum_score,
    health: row.platform_health_score,
  }));

  return NextResponse.json({
    ok: true,
    meta: { memberId, limit },
    data: series,
  });
}
