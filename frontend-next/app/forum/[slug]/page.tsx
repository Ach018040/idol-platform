"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { MOCK_FORUMS, formatRelativeTime, getTrendingTag, type Forum, type Thread } from "../../../lib/supabase-forum";

function TagPill({ label, tone = "default" }: { label: string; tone?: "default" | "hot" | "new" | "rising" | "pinned" }) {
  const toneMap = {
    default: "border-white/10 bg-white/5 text-zinc-400",
    hot: "border-rose-500/30 bg-rose-500/20 text-rose-300",
    new: "border-cyan-500/30 bg-cyan-500/20 text-cyan-300",
    rising: "border-emerald-500/30 bg-emerald-500/20 text-emerald-300",
    pinned: "border-amber-400/20 bg-amber-400/10 text-amber-400",
  } as const;

  return <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${toneMap[tone]}`}>{label}</span>;
}

export default function ForumSlugPage({ params }: { params: { slug: string } }) {
  const [forum, setForum] = useState<Forum | null>(null);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const forumRes = await fetch("/api/forum/forums");
        const forumData = await forumRes.json();
        const found = (forumData.forums || MOCK_FORUMS).find((item: Forum) => item.slug === params.slug);
        setForum(found || MOCK_FORUMS.find((item) => item.slug === params.slug) || null);
      } catch {
        setForum(MOCK_FORUMS.find((item) => item.slug === params.slug) || null);
      }
      try {
        const threadRes = await fetch(`/api/forum/threads?forum_slug=${params.slug}&limit=30&sort=trending_score`);
        const threadData = await threadRes.json();
        setThreads(Array.isArray(threadData.threads) ? threadData.threads : []);
      } catch {
        setThreads([]);
      }
      setLoading(false);
    };
    load();
  }, [params.slug]);

  if (!loading && !forum) {
    return (
      <main className="page-shell flex min-h-screen items-center justify-center text-white">
        <div className="space-y-4 text-center">
          <div className="text-4xl">💬</div>
          <p className="text-zinc-400">找不到這個版區。</p>
          <Link href="/forum" className="inline-block text-fuchsia-400 transition hover:text-fuchsia-300">返回論壇首頁</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="page-shell min-h-screen text-white">
      <div className="mx-auto max-w-4xl px-4 py-8 md:px-6">
        <div className="mb-6 flex flex-wrap items-center gap-2 text-sm text-zinc-500">
          <Link href="/forum" className="transition hover:text-zinc-300">論壇首頁</Link>
          <span>·</span>
          <span className="text-zinc-300">{forum?.title || params.slug}</span>
        </div>

        <header className="hero-surface mb-8 p-6">
          <div className="flex items-center gap-4">
            <div className="text-4xl">{forum?.icon || "💬"}</div>
            <div>
              <h1 className="text-2xl font-black text-white">{forum?.title}</h1>
              {forum?.description ? <p className="mt-1 text-sm text-zinc-400">{forum.description}</p> : null}
            </div>
            <div className="ml-auto">
              <Link href={`/forum/new?forum=${params.slug}`} className="rounded-xl border border-fuchsia-400/30 bg-fuchsia-400/10 px-4 py-2 text-sm text-fuchsia-200 transition-colors hover:bg-fuchsia-400/20">
                發表文章
              </Link>
            </div>
          </div>
          <div className="mt-4 text-xs text-zinc-500">主題數：{threads.length}</div>
        </header>

        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="surface-card animate-pulse p-5">
                <div className="mb-2 h-4 w-3/4 rounded bg-white/5" />
                <div className="h-3 w-1/2 rounded bg-white/5" />
              </div>
            ))}
          </div>
        ) : threads.length === 0 ? (
          <div className="surface-panel py-16 text-center text-zinc-500">
            <div className="mb-4 text-4xl">💬</div>
            <p>這個版區目前還沒有討論串。</p>
            <Link href={`/forum/new?forum=${params.slug}`} className="mt-4 inline-block rounded-xl border border-fuchsia-400/30 bg-fuchsia-400/10 px-4 py-2 text-sm text-fuchsia-200 transition-colors hover:bg-fuchsia-400/20">
              發表第一篇文章
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {threads.map((thread) => {
              const tag = getTrendingTag(thread);
              return (
                <Link key={thread.id} href={`/forum/${params.slug}/${thread.id}`}>
                  <div className="surface-card group cursor-pointer p-5 transition-all hover:border-fuchsia-400/30 hover:bg-white/5">
                    <div className="flex items-start gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          {thread.is_pinned ? <TagPill label="置頂" tone="pinned" /> : null}
                          {tag === "hot" ? <TagPill label="Hot" tone="hot" /> : null}
                          {tag === "new" ? <TagPill label="New" tone="new" /> : null}
                          {tag === "rising" ? <TagPill label="Rising" tone="rising" /> : null}
                          {(thread.tags || []).map((tagItem) => <TagPill key={tagItem} label={tagItem} />)}
                        </div>
                        <h3 className="text-base font-semibold text-white transition-colors group-hover:text-fuchsia-200">{thread.title}</h3>
                        <p className="mt-1.5 line-clamp-2 text-xs text-zinc-500">{thread.body}</p>
                      </div>
                      <div className="space-y-1 text-right text-xs text-zinc-500">
                        <div>讚 {thread.likes_count || 0}</div>
                        <div>回覆 {thread.replies_count || 0}</div>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="mr-4 h-1.5 flex-1 overflow-hidden rounded-full bg-white/5">
                        <div className="h-full rounded-full bg-gradient-to-r from-pink-500 via-fuchsia-400 to-violet-400" style={{ width: `${Math.min(100, (thread.trending_score || 0) * 6)}%` }} />
                      </div>
                      <div className="flex items-center gap-2 text-xs text-zinc-600">
                        <span>{thread.author_name}</span>
                        <span>·</span>
                        <span>{formatRelativeTime(thread.last_reply_at || thread.created_at)}</span>
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
