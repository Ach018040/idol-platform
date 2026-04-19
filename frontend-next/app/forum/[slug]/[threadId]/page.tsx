"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { useForumAuth } from "../../../../lib/forum-auth";
import { MOCK_FORUMS, formatRelativeTime, type Forum, type Post, type Thread } from "../../../../lib/supabase-forum";

function PostCard({ post }: { post: Post }) {
  return (
    <div className="surface-card p-4">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-xs font-bold text-white">
          {[...(post.author_name || "?")][0]}
        </div>
        <span className="text-sm font-medium text-zinc-300">{post.author_name || "匿名"}</span>
        <span className="text-zinc-600">·</span>
        <span className="text-xs text-zinc-500">{formatRelativeTime(post.created_at)}</span>
        {post.edited ? <span className="rounded border border-zinc-700 px-1 text-[10px] text-zinc-600">已編輯</span> : null}
      </div>
      <div className="whitespace-pre-wrap text-sm leading-7 text-zinc-300">{post.body}</div>
      <div className="mt-3 text-xs text-zinc-500">讚 {post.likes_count || 0}</div>
    </div>
  );
}

export default function ThreadPage({ params }: { params: { slug: string; threadId: string } }) {
  const { user } = useForumAuth();
  const [thread, setThread] = useState<Thread | null>(null);
  const [forum, setForum] = useState<Forum | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyBody, setReplyBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [replyError, setReplyError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const threadRes = await fetch(`/api/forum/thread?id=${params.threadId}`);
        const threadData = await threadRes.json();
        setThread(threadData.thread || null);
      } catch {
        setThread(null);
      }
      try {
        const forumRes = await fetch("/api/forum/forums");
        const forumData = await forumRes.json();
        setForum((forumData.forums || MOCK_FORUMS).find((item: Forum) => item.slug === params.slug) || MOCK_FORUMS.find((item) => item.slug === params.slug) || null);
      } catch {
        setForum(MOCK_FORUMS.find((item) => item.slug === params.slug) || null);
      }
      try {
        const postRes = await fetch(`/api/forum/replies?thread_id=${params.threadId}&limit=100`);
        const postData = await postRes.json();
        setPosts(Array.isArray(postData.posts) ? postData.posts : []);
      } catch {
        setPosts([]);
      }
      setLoading(false);
    };
    load();
  }, [params.slug, params.threadId]);

  const submitReply = async () => {
    if (!user || !replyBody.trim()) {
      setReplyError("請先登入並輸入回覆內容。");
      return;
    }

    setSubmitting(true);
    setReplyError("");
    try {
      const res = await fetch("/api/forum/replies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          thread_id: params.threadId,
          body: replyBody.trim(),
          author_token: user.token,
          author_name: user.display_name,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "回覆失敗");
      setPosts((prev) => [...prev, data.post]);
      setReplyBody("");
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (error) {
      setReplyError(String(error));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <main className="page-shell min-h-screen text-white"><div className="mx-auto max-w-3xl px-4 py-8"><div className="animate-pulse space-y-4"><div className="h-6 w-1/3 rounded bg-white/5" /><div className="h-32 rounded-2xl bg-white/5" /><div className="h-20 rounded-2xl bg-white/5" /></div></div></main>;
  }

  if (!thread) {
    return <main className="page-shell flex min-h-screen items-center justify-center text-white"><div className="text-center"><div className="mb-4 text-4xl">💬</div><p className="text-zinc-400">找不到這篇討論串。</p><Link href={`/forum/${params.slug}`} className="mt-4 inline-block text-fuchsia-400 transition hover:text-fuchsia-300">返回版區</Link></div></main>;
  }

  return (
    <main className="page-shell min-h-screen text-white">
      <div className="mx-auto max-w-3xl px-4 py-8 md:px-6">
        <div className="mb-6 flex flex-wrap items-center gap-2 text-sm text-zinc-500">
          <Link href="/forum" className="transition hover:text-zinc-300">論壇</Link>
          <span>·</span>
          <Link href={`/forum/${params.slug}`} className="transition hover:text-zinc-300">{forum?.title || params.slug}</Link>
          <span>·</span>
          <span className="line-clamp-1 text-zinc-300">{thread.title}</span>
        </div>

        <div className="hero-surface mb-6 p-6">
          {thread.is_pinned ? <span className="mb-3 inline-block rounded-full border border-amber-400/20 bg-amber-400/10 px-2 py-0.5 text-[10px] text-amber-400">置頂主題</span> : null}
          <h1 className="mb-4 text-xl font-black text-white">{thread.title}</h1>
          <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-500 to-violet-500 text-[10px] font-bold text-white">{[...(thread.author_name || "?")][0]}</div>
            <span className="text-zinc-300">{thread.author_name || "匿名"}</span>
            <span>·</span>
            <span>{formatRelativeTime(thread.created_at)}</span>
            {(thread.tags || []).map((tag) => <span key={tag} className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5">{tag}</span>)}
          </div>
          <div className="whitespace-pre-wrap text-sm leading-7 text-zinc-300">{thread.body}</div>
          <div className="mt-4 flex items-center gap-4 border-t border-white/5 pt-4 text-xs text-zinc-500">
            <span>讚 {thread.likes_count || 0}</span>
            <span>回覆 {posts.length} 則</span>
          </div>
        </div>

        {posts.length > 0 ? (
          <div className="mb-6 space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-400">回覆 ({posts.length})</h2>
            {posts.map((post) => <PostCard key={post.id} post={post} />)}
          </div>
        ) : null}

        <div ref={bottomRef} />

        {thread.is_locked ? (
          <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4 text-center text-sm text-amber-300">這篇主題已鎖定，暫時無法新增回覆。</div>
        ) : (
          <div className="surface-panel p-5">
            <h2 className="mb-3 text-sm font-semibold text-zinc-300">新增回覆</h2>
            {!user ? (
              <div className="py-4 text-center">
                <p className="mb-3 text-sm text-zinc-500">登入論壇帳號後才能回覆。</p>
                <Link href="/forum/new" className="rounded-xl border border-fuchsia-400/30 bg-fuchsia-400/10 px-4 py-2 text-sm text-fuchsia-200 transition-colors hover:bg-fuchsia-400/20">前往登入 / 發文頁</Link>
              </div>
            ) : (
              <>
                <div className="mb-3 flex items-center gap-2 text-xs text-zinc-400">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-500 to-violet-500 text-[10px] font-bold text-white">{[...user.display_name][0]}</div>
                  <span>{user.display_name}</span>
                </div>
                <textarea
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                  placeholder="輸入你的回覆內容..."
                  rows={4}
                  className="mb-3 w-full resize-none rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-zinc-200 placeholder-zinc-600 transition-colors focus:border-fuchsia-400/50 focus:outline-none"
                />
                {replyError ? <p className="mb-3 rounded-lg bg-rose-400/10 px-3 py-2 text-xs text-rose-400">{replyError}</p> : null}
                <button onClick={submitReply} disabled={!replyBody.trim() || submitting} className="rounded-xl border border-fuchsia-400/30 bg-fuchsia-400/10 px-5 py-2.5 text-sm font-semibold text-fuchsia-200 transition-colors hover:bg-fuchsia-400/20 disabled:cursor-not-allowed disabled:opacity-40">
                  {submitting ? "送出中..." : "送出回覆"}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
