import { NextResponse } from "next/server";

const ICS_URL =
  "https://calendar.google.com/calendar/ical/mr7kibfjcm3gu52v6t64lreras%40group.calendar.google.com/public/basic.ics";

export async function GET() {
  try {
    const res = await fetch(ICS_URL, {
      next: { revalidate: 3600 }, // cache 1 hour
    });
    if (!res.ok) return NextResponse.json({ error: "fetch failed" }, { status: 502 });
    const text = await res.text();
    return new NextResponse(text, {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      },
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
