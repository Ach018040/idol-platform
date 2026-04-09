import { NextRequest, NextResponse } from "next/server";
const SB_URL = process.env.NEXT_PUBLIC_FORUM_SB_URL || "https://vxmebuygrnynxkepyunh.supabase.co";
const SB_ANON = process.env.NEXT_PUBLIC_FORUM_SB_ANON || "";
export async function GET(req: NextRequest) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id || !SB_ANON) return NextResponse.json({ thread: null });
  try {
    const res = await fetch(`${SB_URL}/rest/v1/threads?id=eq.${id}&select=*&limit=1`,
      { headers: { apikey: SB_ANON, Accept: "application/json" }, cache: "no-store" });
    if (!res.ok) return NextResponse.json({ thread: null });
    const data = await res.json();
    return NextResponse.json({ thread: Array.isArray(data)&&data[0]?data[0]:null });
  } catch { return NextResponse.json({ thread: null }); }
}
