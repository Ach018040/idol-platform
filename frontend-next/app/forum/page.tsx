"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import {
  getTrendingTag,
  formatRelativeTime,
  type Thread,
  type Forum,
} from "../../lib/supabase-forum";

function TrendingBadge({ tag }: { tag: ReturnType<typeof getTrendingTag> }) {
  if (!tag) return null;
  const cfg = {
    hot:    { label: "🔥 Hot",    cls: "bg-rose-500/20 text-rose-300 border-rose-500/30" },
    new:    { label: "🆕 New",    cls: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30" },
    rising: { label: "📈 Rising", cls: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
  }[tag];
  return <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${cfg.cls}`}>{cfg.label}</span>;
}

function ThreadCard({ thread }: { thread: Thread }) {
  const tag = getTrendingTag(thread);
  return (
    <Link href={`/forum/${thread.forum_slug}/${thread.id}`}>
      <div className="group rounded-2xl border border-white/10 bg-black/20 p-4 hover:border-fuchsia-400/30 hover:bg-white/5 transition-all cursor-pointer">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          {thread.is_pinned && <span className="text-[10px] text-amber-400">📌</span>}
          <TrendingBadge tag={tag} />
          {(thread.tags||[]).slice(0,2).map(t => (
            <span key={t} className="rounded-full bg-white/5 border border-white/10 px-2 py-0.5 text-[10px] text-zinc-400">{t}</span>
          ))}
        </div>
        <h3 className="text-sm font-semibold text-white group-hover:text-fuchsia-200 transition-colors line-clamp-2">{thread.title}</h3>
        <p className="mt-1 text-xs text-zinc-500 line-clamp-1">{thread.body}</p>
        <div className="mt-3 flex items-center justify-between text-xs text-zinc-500">
          <div className="flex items-center gap-3">
            <span><span className="text-pink-400">♥</span> {thread.likes_count||0}</span>
            <span><span className="text-cyan-400">💬</span> {thread.replies_count||0}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-zinc-600">{thread.author_name}</span>
            <span>·</span>
            <span>{formatRelativeTime(thread.last_reply_at||thread.created_at)}</span>
          </div>
        </div>
        <div className="mt-2 h-1 rounded-full bg-white/5 overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-pink-500 via-fuchsia-400 to-violet-400"
            style={{ width: `${Math.min(100, (thread.trending_score||0) * 6)}%` }} />
        </div>
      </div>
    </Link>
  );
}

const FALLBACK_FORUMS: Forum[] = [
  { slug:"general", title:"💬 綜合討論", icon:"💬", thread_count:0, sort_order:1 },
  { slug:"groups",  title:"🎤 團體討論", icon:"🎤", thread_count:0, sort_order:2 },
  { slug:"members", title:"⭐ 成員討論", icon:"⭐", thread_count:0, sort_order:3 },
  { slug:"events",  title:"🎵 活動心得", icon:"🎵", thread_count:0, sort_order:4 },
  { slug:"photo",   title:"📸 拍照物販", icon:"📸", thread_count:0, sort_order:5 },
  { slug:"news",    title:"📢 新聞公告", icon:"📢", thread_count:0, sort_order:6 },
  { slug:"misc",    title:"🌸 雜談",     icon:"🌸", thread_count:0, sort_order:7 },
];

export default function ForumPage() {
  const [activeTab, setActiveTab] = useState<"trending"|"latest">("trending");
  const [threads, setThreads] = useState<Thread[]>([]);
  const [forums, setForums] = useState<Forum[]>(FALLBACK_FORUMS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // 讀取真實討論串
        const res = await fetch(`/api/forum/threads?sort=${activeTab === "trending" ? "trending_score" : "created_at"}&limit=20`);
        const data = await res.json();
        setThreads(Array.isArray(data.threads) ? data.threads : []);
      } catch {
        setThreads([]);
      }
      try {
        // 讀取真實版區列表
        const fRes = await fetch("/api/forum/forums");
        const fData = await fRes.json();
        if (Array.isArray(fData.forums) && fData.forums.length > 0) {
          setForums(fData.forums.filter((f:Forum)=>!f.slug.startsWith("member-")).slice(0,7));
        }
      } catch {
        setForums(FALLBACK_FORUMS);
      }
      setLoading(false);
    };
    fetchData();
  }, [activeTab]);

  return (
    <main className="min-h-screen text-white">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 lg:px-8">
        {/* Header */}
        <header className="mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-fuchsia-400/30 bg-fuchsia-400/10 px-3 py-1 text-xs text-fuchsia-200">
                <span>💬</span> 地下偶像討論區
              </div>
              <h1 className="text-3xl font-black text-white md:text-4xl">
                Idol <span className="bg-gradient-to-r from-pink-400 via-fuchsia-300 to-violet-300 bg-clip-text text-transparent">Forum</span>
              </h1>
              <p className="mt-1 text-sm text-zinc-400">台灣地下偶像專屬討論社群</p>
            </div>
            <div className="flex gap-2">
              <Link href="/forum/forums" className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-300 hover:bg-white/10 transition-colors">所有版區</Link>
              <Link href="/forum/new" className="rounded-xl border border-fuchsia-400/30 bg-fuchsia-400/10 px-4 py-2 text-sm text-fuchsia-200 hover:bg-fuchsia-400/20 transition-colors">✏️ 發文</Link>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Thread list */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex gap-2 rounded-2xl border border-white/10 bg-white/5 p-1 w-fit">
              {(["trending","latest"] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${activeTab === tab ? "bg-fuchsia-500/20 text-fuchsia-200" : "text-zinc-400 hover:text-white"}`}>
                  {tab === "trending" ? "🔥 熱門" : "🆕 最新"}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_,i) => (
                  <div key={i} className="rounded-2xl border border-white/10 bg-black/20 p-4 animate-pulse">
                    <div className="h-4 bg-white/5 rounded w-3/4 mb-2"/>
                    <div className="h-3 bg-white/5 rounded w-1/2"/>
                  </div>
                ))}
              </div>
            ) : threads.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-black/20 p-8 text-center">
                <div className="text-3xl mb-3">💬</div>
                <p className="text-zinc-400 text-sm">還沒有討論串</p>
                <Link href="/forum/new" className="mt-4 inline-block rounded-xl border border-fuchsia-400/30 bg-fuchsia-400/10 px-4 py-2 text-sm text-fuchsia-200 hover:bg-fuchsia-400/20 transition-colors">✏️ 成為第一個發文的人</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {threads.map(t => <ThreadCard key={t.id} thread={t} />)}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* 版區 */}
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <h2 className="mb-4 text-base font-bold text-white">討論版區</h2>
              <div className="space-y-1">
                {forums.map(f => (
                  <Link key={f.slug} href={`/forum/${f.slug}`}>
                    <div className="flex items-center justify-between rounded-xl p-2.5 hover:bg-white/5 transition-colors cursor-pointer">
                      <div className="flex items-center gap-2.5">
                        <span className="text-base">{f.icon}</span>
                        <span className="text-sm text-zinc-300">{f.title}</span>
                      </div>
                      {(f.thread_count||0) > 0 && <span className="text-xs text-zinc-500">{f.thread_count}</span>}
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* 返回排行榜 */}
            <Link href="/">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 flex items-center justify-between hover:bg-white/10 transition-colors cursor-pointer">
                <div>
                  <div className="text-sm font-medium text-white">← 返回排行榜</div>
                  <div className="text-xs text-zinc-500 mt-0.5">idol-platform 市場儀表板</div>
                </div>
                <span className="text-zinc-600">🏠</span>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
