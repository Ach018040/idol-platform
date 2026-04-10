import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { recommendMembers } from "@/lib/recommendation/recommend";
import { getUserId } from "@/lib/auth/session";

export async function GET(req: Request){
  const userId = getUserId(req);

  const {data: watch} = await supabaseAdmin.from('user_watchlists').select('member_id').eq('user_id', userId);
  const watchIds = (watch||[]).map((w:any)=>w.member_id);

  const {data: all} = await supabaseAdmin.from('v_social_leaderboard').select('*');

  const rec = recommendMembers(all||[], watchIds);

  return NextResponse.json({ok:true, data: rec});
}
