"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

type CalEvent = {
  date: string;
  time: string;
  summary: string;
  location?: string;
  url?: string;
};

// 按日期分組
function groupByDate(events: CalEvent[]) {
  const map: Record<string, CalEvent[]> = {};
  events.forEach(ev => {
    if (!map[ev.date]) map[ev.date] = [];
    map[ev.date].push(ev);
  });
  return Object.entries(map).sort(([a],[b])=>a.localeCompare(b));
}

export default function EventsPage() {
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(()=>{
    fetch("/api/ical").then(r=>r.json()).then(d=>{
      setEvents(d.events||[]);
    }).finally(()=>setLoading(false));
  },[]);

  const filtered = search.trim()
    ? events.filter(e=>e.summary.toLowerCase().includes(search.toLowerCase())||e.location?.toLowerCase().includes(search.toLowerCase()))
    : events;

  const grouped = groupByDate(filtered);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.15),_transparent_30%),linear-gradient(180deg,_#070b14_0%,_#111827_100%)] text-white px-4 py-10">
      <div className="mx-auto max-w-3xl space-y-8">

        {/* Header */}
        <header className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <Link href="/" className="hover:text-zinc-300 transition-colors">排行榜</Link>
            <span>›</span>
            <span className="text-zinc-300">近期活動</span>
          </div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black text-white">📅 近期活動</h1>
              <p className="text-sm text-zinc-400 mt-1">未來 60 天的台灣地下偶像活動</p>
            </div>
            <a href="https://idolinfohub.com/events" target="_blank" rel="noopener noreferrer"
              className="flex-shrink-0 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-xs text-amber-200 hover:bg-amber-400/20 transition-colors">
              完整資訊 idolinfohub ↗
            </a>
          </div>
          {/* 搜尋 */}
          <input
            value={search}
            onChange={e=>setSearch(e.target.value)}
            placeholder="搜尋活動或場地..."
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-fuchsia-400/50 transition-colors"
          />
        </header>

        {/* 統計 */}
        {!loading && (
          <div className="grid grid-cols-3 gap-3">
            {[
              {label:'活動總數', value:events.length, color:'amber'},
              {label:'有連結活動', value:events.filter(e=>e.url).length, color:'cyan'},
              {label:'搜尋結果', value:filtered.length, color:'fuchsia'},
            ].map(({label,value,color})=>(
              <div key={label} className={`rounded-2xl border border-${color}-400/20 bg-${color}-500/10 p-4 text-center`}>
                <div className={`text-2xl font-black text-${color}-300`}>{value}</div>
                <div className={`text-xs text-${color}-300/60 mt-1`}>{label}</div>
              </div>
            ))}
          </div>
        )}

        {/* 活動列表 */}
        {loading ? (
          <div className="text-center py-16 text-zinc-500">
            <div className="text-4xl animate-spin mb-4">⚙️</div>
            <p>載入活動中...</p>
          </div>
        ) : grouped.length === 0 ? (
          <div className="text-center py-12 text-zinc-500">
            <p>沒有找到符合的活動</p>
          </div>
        ) : (
          <div className="space-y-6">
            {grouped.map(([date, dayEvents])=>(
              <section key={date}>
                <div className="flex items-center gap-3 mb-3">
                  <h2 className="text-sm font-bold text-amber-300">{date}</h2>
                  <div className="flex-1 h-px bg-amber-400/20"/>
                  <span className="text-xs text-zinc-600">{dayEvents.length} 場</span>
                </div>
                <div className="space-y-2">
                  {dayEvents.map((ev,i)=>(
                    <div key={i} className="rounded-2xl border border-white/10 bg-black/20 p-4 hover:border-amber-400/20 hover:bg-white/5 transition-all">
                      <div className="flex items-start gap-3">
                        <span className="flex-shrink-0 text-xs text-amber-300 font-mono font-bold w-12 pt-0.5">{ev.time}</span>
                        <div className="min-w-0 flex-1">
                          {ev.url ? (
                            <a href={ev.url} target="_blank" rel="noopener noreferrer"
                              className="text-sm font-semibold text-white hover:text-amber-300 transition-colors flex items-center gap-1">
                              {ev.summary}
                              <span className="text-amber-400 text-xs">↗</span>
                            </a>
                          ) : (
                            <p className="text-sm font-semibold text-white">{ev.summary}</p>
                          )}
                          {ev.location && (
                            <p className="text-xs text-zinc-500 mt-1 truncate">📍 {ev.location}</p>
                          )}
                        </div>
                        {ev.url && (
                          <a href={ev.url} target="_blank" rel="noopener noreferrer"
                            className="flex-shrink-0 text-xs text-amber-400/60 hover:text-amber-300 border border-amber-400/20 rounded-lg px-2 py-1 hover:bg-amber-400/10 transition-colors">
                            詳情
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        {/* 資料來源 */}
        <footer className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center space-y-2">
          <p className="text-xs text-zinc-500">活動資料來自 Google Calendar 公開行事曆，有連結的活動可前往 idolinfohub.com 查看詳情</p>
          <div className="flex items-center justify-center gap-3">
            <a href="https://idolinfohub.com" target="_blank" rel="noopener noreferrer"
              className="text-xs text-amber-400 hover:text-amber-300 transition-colors">
              idolinfohub.com ↗
            </a>
            <span className="text-zinc-700">·</span>
            <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">← 返回排行榜</Link>
          </div>
        </footer>

      </div>
    </main>
  );
}
