import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { buildOshiAnalysis } from "@/lib/oshi/analysis";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ memberId: string }> }
) {
  const { memberId } = await params;

  const { data } = await supabaseAdmin
    .from("v_member_latest_scores")
    .select("*")
    .eq("member_id", memberId)
    .single();

  if (!data) {
    return NextResponse.json({ ok: false });
  }

  const analysis = buildOshiAnalysis(data);

  return NextResponse.json({ ok: true, data: { score: data, analysis } });
}
