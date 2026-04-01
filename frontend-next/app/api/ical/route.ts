import { NextResponse } from "next/server";

const ICS_URL =
  "https://calendar.google.com/calendar/ical/mr7kibfjcm3gu52v6t64lreras%40group.calendar.google.com/public/basic.ics";

export async function GET() {
  try {
    const res = await fetch(ICS_URL, { next: { revalidate: 3600 } });
    if (!res.ok) return NextResponse.json({ events: [], error: "fetch failed" });
    const text = await res.text();
    const today = new Date();
    const future = new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000);
    const events: { date: string; time: string; summary: string; location: string }[] = [];
    text.split("BEGIN:VEVENT").slice(1).forEach((block) => {
      const get = (k: string) => {
        const m = block.match(new RegExp(k + "[^:]*:([^\r\n]+)"));
        return m ? m[1].trim() : "";
      };
      const dtstart = get("DTSTART");
      const summary = get("SUMMARY");
      const loc = get("LOCATION");
      if (!dtstart || !summary) return;
      const d = dtstart.replace(/[TZ]/g, "");
      const dt = new Date(
        `${d.substr(0,4)}-${d.substr(4,2)}-${d.substr(6,2)}T${d.substr(8,2)||"00"}:${d.substr(10,2)||"00"}:00+08:00`
      );
      if (isNaN(dt.getTime()) || dt < today || dt > future) return;
      events.push({
        date: dt.toLocaleDateString("zh-TW", { month: "numeric", day: "numeric", weekday: "short" }),
        time: dtstart.includes("T")
          ? dt.toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit", hour12: false })
          : "全天",
        summary: summary.replace(/\\n/g, "").replace(/\\,/g, ","),
        location: loc.replace(/\\,/g, ","),
      });
    });
    events.sort((a, b) => a.date.localeCompare(b.date));
    return NextResponse.json({ events }, {
      headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400" },
    });
  } catch (e) {
    return NextResponse.json({ events: [], error: String(e) });
  }
}
