"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  formatRelativeTime,
  getTrendingTag,
  type Forum,
  type Thread,
} from "../../lib/supabase-forum";

function TrendingBadge({ tag }: { tag: ReturnType<typeof getTrendingTag> }) {
  if (!tag) return null;
  const cfg = {
    hot: { label: "Hot", cls: "bg-rose-500/20 text-rose-300 border-rose-500/30" },
    new: { label: "New", cls: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30" },
    rising: { label: "Rising", cls: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
  }[tag];
  return <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${cfg.cls}`}>{cfg.label}</span>;
}

function ThreadCard({ thread }: { thread: Thread }) {
  const tag = getTrendingTag(thread);
  return (
    <Link href={`/forum/${thread.forum_slug}/${thread.id}`}>
      <div className="surface-card group cursor-pointer p-4 transition-all hover:border-fuchsia-400/30 hover:bg-white/5">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          {thread.is_pinned ? <span className="text-[10px] text-amber-400">置頂</span> : null}
          <TrendingBadge tag={tag} />
          {(thread.tags || []).slice(0, 2).map((tagItem) => (
            <span key={tagItem} className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-zinc-400">
              {tagItem}
            </span>
          ))}
        </div>
        <h3 className="line-clamp-2 text-sm font-semibold text-white transition-colors group-hover:text-fuchsia-200">{thread.title}</h3>
        <p className="mt-1 line-clamp-1 text-xs text-zinc-500">{thread.body}</p>
        <div className="mt-3 flex items-center justify-between text-xs text-zinc-500">
          <div className="flex items-center gap-3">
            <span><span className="text-pink-400">讚</span> {thread.likes_count || 0}</span>
            <span><span className="text-cyan-400">回覆</span> {thread.replies_count || 0}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-zinc-600">{thread.author_name}</span>
            <span>·</span>
            <span>{formatRelativeTime(thread.last_reply_at || thread.created_at)}</span>
          </div>
        </div>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-pink-500 via-fuchsia-400 to-violet-400"
            style={{ width: `${Math.min(100, (thread.trending_score || 0) * 6)}%` }}
          />
        </div>
      </div>
    </Link>
  );
}

const FALLBACK_FORUMS: Forum[] = [
  { slug: "general", title: "💬 綜合討論", icon: "💬", thread_count: 0, sort_order: 1 },
  { slug: "groups", title: "🎤 團體討論", icon: "🎤", thread_count: 0, sort_order: 2 },
  { slug: "members", title: "🌟 成員討論", icon: "🌟", thread_count: 0, sort_order: 3 },
  { slug: "events", title: "📅 活動討論", icon: "📅", thread_count: 0, sort_order: 4 },
  { slug: "photo", title: "🖼 圖片分享", icon: "🖼", thread_count: 0, sort_order: 5 },
  { slug: "news", title: "📰 新聞情報", icon: "📰", thread_count: 0, sort_order: 6 },
  { slug: "misc", title: "🧩 其他話題", icon: "🧩", thread_count: 0, sort_order: 7 },
];

export default function ForumPage() {
  const [activeTab, setActiveTab] = useState<"trending" | "latest">("trending");
  const [threads, setThreads] = useState<Thread[]>([]);
  const [forums, setForums] = useState<Forum[]>(FALLBACK_FORUMS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/forum/threads?sort=${activeTab === "trending" ? "trending_score" : "created_at"}&limit=20`);
        const data = await res.json();
        setThreads(Array.isArray(data.threads) ? data.threads : []);
      } catch {
        setThreads([]);
      }
      try {
        const forumRes = await fetch("/api/forum/forums");
        const forumData = await forumRes.json();
        if (Array.isArray(forumData.forums) && forumData.forums.length > 0) {
          setForums(forumData.forums.filter((forum: Forum) => !forum.slug.startsWith("member-")).slice(0, 7));
        }
      } catch {
        setForums(FALLBACK_FORUMS);
      }
      setLoading(false);
    };
    fetchData();
  }, [activeTab]);

  return (
    <main className="page-shell min-h-screen text-white">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 lg:px-8">
        <header className="hero-surface mb-8 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="eyebrow-chip mb-2 inline-flex items-center gap-2 px-3 py-1 text-xs">
                <span>💬</span> 台灣地下偶像討論區
              </div>
              <h1 className="text-3xl font-black text-white md:text-4xl">
                Idol <span className="bg-gradient-to-r from-pink-400 via-fuchsia-300 to-violet-300 bg-clip-text text-transparent">Forum</span>
              </h1>
              <p className="mt-1 text-sm text-zinc-400">討論成員、團體、活動與市場觀察的社群入口</p>
            </div>
            <div className="flex gap-2">
              <Link href="/forum/forums" className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-300 transition-colors hover:bg-white/10">查看全部版區</Link>
              <Link href="/forum/new" className="rounded-xl border border-fuchsia-400/30 bg-fuchsia-400/10 px-4 py-2 text-sm text-fuchsia-200 transition-colors hover:bg-fuchsia-400/20">發表文章</Link>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <div className="flex w-fit gap-2 rounded-2xl border border-white/10 bg-white/5 p-1">
              {(["trending", "latest"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === tab ? "bg-fuchsia-500/20 text-fuchsia-200" : "text-zinc-400 hover:text-white"
                  }`}
                >
                  {tab === "trending" ? "熱門討論" : "最新發文"}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="surface-card animate-pulse p-4">
                    <div className="mb-2 h-4 w-3/4 rounded bg-white/5" />
                    <div className="h-3 w-1/2 rounded bg-white/5" />
                  </div>
                ))}
              </div>
            ) : threads.length === 0 ? (
              <div className="surface-panel p-8 text-center">
                <div className="mb-3 text-3xl">💬</div>
                <p className="text-sm text-zinc-400">目前還沒有可顯示的討論串。</p>
                <Link href="/forum/new" className="mt-4 inline-block rounded-xl border border-fuchsia-400/30 bg-fuchsia-400/10 px-4 py-2 text-sm text-fuchsia-200 transition-colors hover:bg-fuchsia-400/20">發表第一篇文章</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {threads.map((thread) => (
                  <ThreadCard key={thread.id} thread={thread} />
                ))}
              </div>
            )}
          </div>

          <div className="space-y-5">
            <div className="surface-panel p-5">
              <h2 className="mb-4 text-base font-bold text-white">論壇版區</h2>
              <div className="space-y-1">
                {forums.map((forum) => (
                  <Link key={forum.slug} href={`/forum/${forum.slug}`}>
                    <div className="cursor-pointer rounded-xl p-2.5 transition-colors hover:bg-white/5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="text-base">{forum.icon}</span>
                          <span className="text-sm text-zinc-300">{forum.title}</span>
                        </div>
                        {(forum.thread_count || 0) > 0 ? <span className="text-xs text-zinc-500">{forum.thread_count}</span> : null}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <Link href="/">
              <div className="surface-card flex cursor-pointer items-center justify-between p-4 transition-colors hover:bg-white/10">
                <div>
                  <div className="text-sm font-medium text-white">返回排行榜首頁</div>
                  <div className="mt-0.5 text-xs text-zinc-500">回到 idol-platform 的市場情報入口</div>
                </div>
                <span className="text-zinc-600">→</span>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
