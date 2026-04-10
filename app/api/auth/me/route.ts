import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/supabaseAuth";

export async function GET(){
  const user = getAuthUser();
  return NextResponse.json({ ok:true, data:user });
}
