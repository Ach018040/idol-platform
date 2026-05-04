"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type CalEvent = {
  date: string;
  time: string;
  summary: string;
  location?: string;
  url?: string;
};

type EventDiscovery = {
  generated_at: string;
  coverage: {
    events: number;
    with_start_time: number;
    with_venue: number;
    with_group_match: number;
  };
};

function groupByDate(events: CalEvent[]) {
  const grouped: Record<string, CalEvent[]> = {};
  events.forEach((event) => {
    if (!grouped[event.date]) grouped[event.date] = [];
    grouped[event.date].push(event);
  });
  return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));
}

export default function EventsPage() {
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [discovery, setDiscovery] = useState<EventDiscovery | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/ical").then((response) => response.json()).catch(() => ({ events: [] })),
      fetch("/data/event_discovery.json").then((response) => response.json()).catch(() => null),
    ])
      .then(([ical, discoveryData]) => {
        setEvents(ical.events || []);
        setDiscovery(discoveryData);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return events;
    return events.filter((event) =>
      `${event.summary} ${event.location ?? ""}`.toLowerCase().includes(keyword),
    );
  }, [events, search]);

  const grouped = groupByDate(filtered);

  return (
    <main className="min-h-screen bg-[#10131a] px-4 py-8 text-white">
      <div className="mx-auto max-w-5xl space-y-8">
        <header className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.22em] text-amber-200">Event Intelligence</div>
              <h1 className="mt-3 text-4xl font-black">近期活動</h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
                整合公開 Google Calendar 與活動 discovery pipeline。現階段 Calendar 是主要來源，crawler discovery 仍在補強來源與 selector。
              </p>
            </div>
            <nav className="flex flex-wrap gap-2 text-sm font-bold">
              <Link href="/" className="rounded-md border border-white/15 px-4 py-2 text-slate-200 hover:bg-white/10">返回首頁</Link>
              <Link href="/feed" className="rounded-md border border-white/15 px-4 py-2 text-slate-200 hover:bg-white/10">Feed</Link>
              <Link href="/validation" className="rounded-md bg-amber-300 px-4 py-2 text-slate-950 hover:bg-amber-200">資料完整度</Link>
            </nav>
          </div>

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="搜尋活動名稱或場地..."
            className="mt-5 w-full rounded-md border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-amber-300 focus:outline-none"
          />
        </header>

        {!loading && (
          <section className="grid gap-3 md:grid-cols-4">
            {[
              ["Calendar 活動", events.length],
              ["搜尋結果", filtered.length],
              ["Discovery 命中", discovery?.coverage.events ?? 0],
              ["含場地資訊", events.filter((event) => event.location).length],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                <div className="text-2xl font-black text-amber-200">{value}</div>
                <div className="mt-1 text-xs text-slate-400">{label}</div>
              </div>
            ))}
          </section>
        )}

        {loading ? (
          <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-10 text-center text-slate-400">
            載入活動資料中...
          </section>
        ) : grouped.length === 0 ? (
          <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-10 text-center text-slate-400">
            目前沒有符合條件的活動。若 Calendar 沒資料，請優先補來源或調整 crawler selector。
          </section>
        ) : (
          <section className="space-y-6">
            {grouped.map(([date, dayEvents]) => (
              <div key={date} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <h2 className="text-lg font-black text-amber-200">{date}</h2>
                  <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-400">{dayEvents.length} 筆</span>
                </div>
                <div className="space-y-3">
                  {dayEvents.map((event, index) => (
                    <article key={`${event.summary}-${index}`} className="rounded-xl border border-white/10 bg-slate-950 p-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start">
                        <span className="w-16 flex-shrink-0 font-mono text-sm font-black text-amber-200">{event.time}</span>
                        <div className="min-w-0 flex-1">
                          {event.url ? (
                            <a href={event.url} target="_blank" rel="noopener noreferrer" className="font-bold text-white hover:text-amber-200">
                              {event.summary}
                            </a>
                          ) : (
                            <h3 className="font-bold text-white">{event.summary}</h3>
                          )}
                          {event.location ? <p className="mt-1 text-sm text-slate-400">{event.location}</p> : null}
                        </div>
                        {event.url ? (
                          <a href={event.url} target="_blank" rel="noopener noreferrer" className="rounded-md border border-amber-300/30 px-3 py-2 text-xs font-black text-amber-200 hover:bg-amber-300/10">
                            查看來源
                          </a>
                        ) : null}
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </section>
        )}

        <footer className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-sm leading-7 text-slate-400">
          活動資料目前仍以公開 Calendar 為主。若要讓平台更接近真實社群狀態，下一步要補官方 schedule、票務頁、場地方節目表與 SNS bio link 的 source registry。
        </footer>
      </div>
    </main>
  );
}
