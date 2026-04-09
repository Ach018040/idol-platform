"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { MOCK_FORUMS, getTrendingTag, formatRelativeTime, type Thread, type Forum } from "../../../lib/supabase-forum";

export default function ForumSlugPage({ params }: { params: { slug: string } }) {
  const [forum, setForum] = useState<Forum | null>(null);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      // 取版區資訊
      try {
        const fRes = await fetch("/api/forum/forums");
        const fData = await fRes.json();
        const found = (fData.forums || MOCK_FORUMS).find((f: Forum) => f.slug === params.slug);
        setForum(found || MOCK_FORUMS.find(f => f.slug === params.slug) || null);
      } catch {
        setForum(MOCK_FORUMS.find(f => f.slug === params.slug) || null);
      }
      // 取討論串
      try {
        const tRes = await fetch(`/api/forum/threads?forum_slug=${params.slug}&limit=30&sort=trending_score`);
        const tData = await tRes.json();
        setThreads(Array.isArray(tData.threads) ? tData.threads : []);
      } catch {
        setThreads([]);
      }
      setLoading(false);
    };
    load();
  }, [params.slug]);

  if (!loading && !forum) {
    return (
      <main className="min-h-screen text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🔍</div>
          <p className="text-zinc-400">找不到這個版區</p>
          <Link href="/forum" className="mt-4 inline-block text-fuchsia-400 hover:text-fuchsia-300">← 返回論壇</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen text-white">
      <div className="mx-auto max-w-4xl px-4 py-8 md:px-6">
        {/* Breadcrumb */}
        <div className="mb-6 flex items-center gap-2 text-sm text-zinc-500">
          <Link href="/forum" className="hover:text-zinc-300 transition-colors">論壇首頁</Link>
          <span>›</span>
          <span className="text-zinc-300">{forum?.title || params.slug}</span>
        </div>

        {/* Forum Header */}
        <header className="mb-8 rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-center gap-4">
            <div className="text-4xl">{forum?.icon || "💬"}</div>
            <div>
              <h1 className="text-2xl font-black text-white">{forum?.title}</h1>
              {forum?.description && <p className="mt-1 text-sm text-zinc-400">{forum.description}</p>}
            </div>
            <div className="ml-auto">
              <Link href={`/forum/new?forum=${params.slug}`}
                className="rounded-xl border border-fuchsia-400/30 bg-fuchsia-400/10 px-4 py-2 text-sm text-fuchsia-200 hover:bg-fuchsia-400/20 transition-colors">
                ✏️ 新發文
              </Link>
            </div>
          </div>
          <div className="mt-4 flex gap-4 text-xs text-zinc-500">
            <span>💬 {threads.length} 討論串</span>
          </div>
        </header>

        {/* Thread List */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_,i) => (
              <div key={i} className="rounded-2xl border border-white/10 bg-black/20 p-5 animate-pulse">
                <div className="h-4 bg-white/5 rounded w-3/4 mb-2"/>
                <div className="h-3 bg-white/5 rounded w-1/2"/>
              </div>
            ))}
          </div>
        ) : threads.length === 0 ? (
          <div className="text-center py-16 text-zinc-500">
            <div className="text-4xl mb-4">💬</div>
            <p>這個版區還沒有討論串</p>
            <Link href={`/forum/new?forum=${params.slug}`}
              className="mt-4 inline-block rounded-xl border border-fuchsia-400/30 bg-fuchsia-400/10 px-4 py-2 text-sm text-fuchsia-200 hover:bg-fuchsia-400/20 transition-colors">
              ✏️ 成為第一個發文的人
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {threads.map(thread => {
              const tag = getTrendingTag(thread);
              return (
                <Link key={thread.id} href={`/forum/${params.slug}/${thread.id}`}>
                  <div className="group rounded-2xl border border-white/10 bg-black/20 p-5 hover:border-fuchsia-400/30 hover:bg-white/5 transition-all cursor-pointer">
                    <div className="flex items-start gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          {thread.is_pinned && <span className="text-[10px] font-semibold text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded-full px-2 py-0.5">📌 置頂</span>}
                          {tag === "hot" && <span className="text-[10px] font-semibold text-rose-300 bg-rose-500/20 border border-rose-500/30 rounded-full px-2 py-0.5">🔥 Hot</span>}
                          {tag === "new" && <span className="text-[10px] font-semibold text-cyan-300 bg-cyan-500/20 border border-cyan-500/30 rounded-full px-2 py-0.5">🆕 New</span>}
                          {tag === "rising" && <span className="text-[10px] font-semibold text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 rounded-full px-2 py-0.5">📈 Rising</span>}
                          {(thread.tags||[]).map(t => (
                            <span key={t} className="text-[10px] text-zinc-500 bg-white/5 border border-white/10 rounded-full px-2 py-0.5">{t}</span>
                          ))}
                        </div>
                        <h3 className="text-base font-semibold text-white group-hover:text-fuchsia-200 transition-colors">{thread.title}</h3>
                        <p className="mt-1.5 text-xs text-zinc-500 line-clamp-2">{thread.body}</p>
                      </div>
                      <div className="flex-shrink-0 text-right text-xs text-zinc-500 space-y-1">
                        <div className="flex items-center gap-1.5"><span className="text-pink-400">♥</span><span>{thread.likes_count||0}</span></div>
                        <div className="flex items-center gap-1.5"><span className="text-cyan-400">💬</span><span>{thread.replies_count||0}</span></div>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="h-1.5 flex-1 mr-4 rounded-full bg-white/5 overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-pink-500 via-fuchsia-400 to-violet-400"
                          style={{ width: Math.min(100, (thread.trending_score||0) * 6) + "%" }} />
                      </div>
                      <div className="text-xs text-zinc-600 flex items-center gap-2">
                        <span>{thread.author_name}</span>
                        <span>·</span>
                        <span>{formatRelativeTime(thread.last_reply_at||thread.created_at)}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
