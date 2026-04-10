import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { generateInsight } from "@/lib/ai/insightEngine";

export async function GET(_req:Request,{params}:{params:Promise<{memberId:string}>}){
  const {memberId} = await params;

  const {data} = await supabaseAdmin
    .from('v_member_latest_scores')
    .select('*')
    .eq('member_id',memberId)
    .single();

  const insight = generateInsight(data);

  return NextResponse.json({ok:true,data:insight});
}
