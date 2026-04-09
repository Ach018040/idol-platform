import { NextResponse } from "next/server";

const SB_URL = process.env.NEXT_PUBLIC_FORUM_SB_URL || "https://vxmebuygrnynxkepyunh.supabase.co";
const SB_ANON = process.env.NEXT_PUBLIC_FORUM_SB_ANON || "";

export async function GET() {
  if (!SB_ANON) return NextResponse.json({ forums: [] });
  try {
    const res = await fetch(
      `${SB_URL}/rest/v1/forums?select=slug,title,icon,sort_order&slug=not.like.member-*&order=sort_order.asc&limit=20`,
      { headers: { apikey: SB_ANON, Accept: "application/json" }, cache: "no-store" }
    );
    if (!res.ok) return NextResponse.json({ forums: [] });
    const data = await res.json();
    const forums = Array.isArray(data)
      ? data.map((f: { slug:string; title:string; icon:string; sort_order:number }) => ({...f, thread_count:0}))
      : [];
    return NextResponse.json({ forums });
  } catch {
    return NextResponse.json({ forums: [] });
  }
}
