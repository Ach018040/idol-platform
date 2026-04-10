import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getUserId } from "@/lib/auth/session";

export async function GET(req: Request) {
  const userId = getUserId(req);

  const { data } = await supabaseAdmin
    .from("user_watchlists")
    .select("*")
    .eq("user_id", userId);

  return NextResponse.json({ ok: true, data });
}

export async function POST(req: Request) {
  const userId = getUserId(req);
  const body = await req.json();

  await supabaseAdmin.from("user_watchlists").insert({
    user_id: userId,
    member_id: body.member_id,
  });

  return NextResponse.json({ ok: true });
}
