import { NextResponse } from "next/server";

const ICS_URL = "https://calendar.google.com/calendar/ical/mr7kibfjcm3gu52v6t64lreras%40group.calendar.google.com/public/basic.ics";

function readIcsField(block: string, key: string) {
  const match = block.match(new RegExp(`${key}[^:]*:([^\\r\\n]+)`));
  return match ? match[1].trim() : "";
}

function parseIcsDate(value: string) {
  const cleaned = value.replace(/[TZ]/g, "");
  return new Date(
    `${cleaned.slice(0, 4)}-${cleaned.slice(4, 6)}-${cleaned.slice(6, 8)}T${cleaned.slice(8, 10) || "00"}:${cleaned.slice(10, 12) || "00"}:00+08:00`,
  );
}

export async function GET() {
  try {
    const response = await fetch(ICS_URL, { next: { revalidate: 3600 } });
    if (!response.ok) return NextResponse.json({ events: [], error: "fetch failed" });

    const text = await response.text();
    const today = new Date();
    const future = new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000);
    const events: { date: string; time: string; summary: string; location: string; url?: string; dtRaw?: string }[] = [];

    text.split("BEGIN:VEVENT").slice(1).forEach((block) => {
      const dtstart = readIcsField(block, "DTSTART");
      const summary = readIcsField(block, "SUMMARY");
      const location = readIcsField(block, "LOCATION");
      const url = readIcsField(block, "URL");

      if (!dtstart || !summary) return;

      const date = parseIcsDate(dtstart);
      if (Number.isNaN(date.getTime()) || date < today || date > future) return;

      events.push({
        date: date.toLocaleDateString("zh-TW", { month: "numeric", day: "numeric", weekday: "short" }),
        time: dtstart.includes("T")
          ? date.toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit", hour12: false })
          : "全天",
        summary: summary.replace(/\\n/g, "").replace(/\\,/g, ","),
        location: location.replace(/\\,/g, ","),
        url: url || undefined,
        dtRaw: date.toISOString(),
      });
    });

    events.sort((a, b) => (a.dtRaw || a.date).localeCompare(b.dtRaw || b.date));
    const payload = events.map(({ dtRaw: _, ...event }) => event);

    return NextResponse.json(
      { events: payload },
      { headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400" } },
    );
  } catch (error) {
    return NextResponse.json({ events: [], error: String(error) });
  }
}
