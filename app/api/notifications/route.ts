import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getUserId } from "@/lib/auth/session";

export async function GET(req:Request){
  const userId = getUserId(req);

  const {data} = await supabaseAdmin
    .from('user_alert_events')
    .select('*')
    .eq('user_id', userId)
    .order('created_at',{ascending:false});

  return NextResponse.json({ok:true,data});
}
