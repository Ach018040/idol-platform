"use client";
import Link from "next/link";
import { useState } from "react";
import { notFound } from "next/navigation";
import {
  MOCK_FORUMS, MOCK_THREADS, MOCK_POSTS,
  getTrendingTag, formatRelativeTime, type Post,
} from "../../../../lib/supabase-forum";

function Avatar({ name, size = 8 }: { name: string; size?: number }) {
  const colors = ["from-pink-500 to-violet-500","from-cyan-500 to-blue-500","from-amber-500 to-orange-500","from-emerald-500 to-teal-500","from-fuchsia-500 to-purple-500"];
  const idx = name.charCodeAt(0) % colors.length;
  return (
    <div className={`flex-shrink-0 w-${size} h-${size} rounded-full bg-gradient-to-br ${colors[idx]} flex items-center justify-center text-white font-bold text-xs`}>
      {[...name][0]}
    </div>
  );
}

function PostCard({ post, index }: { post: Post; index: number }) {
  const [liked, setLiked] = useState(false);
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
      <div className="flex items-start gap-3 mb-4">
        <Avatar name={post.author_name || "?"} size={8} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white">{post.author_name}</span>
            {post.edited && <span className="text-[10px] text-zinc-600 border border-zinc-700 rounded px-1">已編輯</span>}
          </div>
          <div className="text-xs text-zinc-500 mt-0.5 flex items-center gap-2">
            <span>#{index + 1}</span>
            <span>·</span>
            <span>{formatRelativeTime(post.created_at)}</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button className="text-xs text-zinc-600 hover:text-zinc-400 px-2 py-1 rounded hover:bg-white/5 transition-colors">引用</button>
          <button className="text-xs text-zinc-600 hover:text-zinc-400 px-2 py-1 rounded hover:bg-white/5 transition-colors">⚑</button>
        </div>
      </div>
      <p className="text-sm text-zinc-300 leading-7">{post.body}</p>
      <div className="mt-4 flex items-center gap-3 pt-3 border-t border-white/5">
        <button
          onClick={() => setLiked(!liked)}
          className={`flex items-center gap-1.5 text-xs rounded-lg px-3 py-1.5 transition-colors ${
            liked ? "text-pink-300 bg-pink-500/20 border border-pink-500/30" : "text-zinc-500 hover:text-pink-300 hover:bg-pink-500/10 border border-transparent"
          }`}
        >
          <span>♥</span>
          <span>{post.likes_count + (liked ? 1 : 0)}</span>
        </button>
      </div>
    </div>
  );
}

export default function ThreadPage({ params }: { params: { slug: string; threadId: string } }) {
  const forum = MOCK_FORUMS.find(f => f.slug === params.slug);
  const thread = MOCK_THREADS.find(t => t.id === params.threadId);
  if (!forum || !thread) notFound();

  const posts = MOCK_POSTS.filter(p => p.thread_id === params.threadId);
  const [liked, setLiked] = useState(false);
  const [replyText, setReplyText] = useState("");
  const tag = getTrendingTag(thread);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.18),_transparent_30%),linear-gradient(180deg,_#070b14_0%,_#111827_100%)] text-white">
      <div className="mx-auto max-w-4xl px-4 py-8 md:px-6">

        {/* Breadcrumb */}
        <div className="mb-6 flex items-center gap-2 text-sm text-zinc-500">
          <Link href="/forum" className="hover:text-zinc-300 transition-colors">論壇首頁</Link>
          <span>›</span>
          <Link href={`/forum/${params.slug}`} className="hover:text-zinc-300 transition-colors">{forum.title}</Link>
          <span>›</span>
          <span className="text-zinc-400 truncate max-w-xs">{thread.title}</span>
        </div>

        {/* Thread Header */}
        <header className="mb-6 rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {thread.is_pinned && <span className="text-[10px] font-semibold text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded-full px-2 py-0.5">📌 置頂</span>}
            {tag === "hot" && <span className="text-[10px] font-semibold text-rose-300 bg-rose-500/20 border border-rose-500/30 rounded-full px-2 py-0.5">🔥 Hot</span>}
            {tag === "rising" && <span className="text-[10px] font-semibold text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 rounded-full px-2 py-0.5">📈 Rising</span>}
            {thread.tags.map(t => (
              <span key={t} className="text-[10px] text-zinc-400 bg-white/5 border border-white/10 rounded-full px-2 py-0.5">{t}</span>
            ))}
          </div>
          <h1 className="text-xl font-black text-white mb-4">{thread.title}</h1>
          <div className="flex items-start gap-3">
            <Avatar name={thread.author_name || "?"} size={9} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-semibold text-white">{thread.author_name}</span>
                <span className="text-[10px] text-fuchsia-400 bg-fuchsia-400/10 rounded-full px-2 py-0.5">OP</span>
              </div>
              <p className="text-sm text-zinc-300 leading-7">{thread.body}</p>
              <div className="mt-4 flex items-center gap-4 pt-3 border-t border-white/5 text-xs text-zinc-500">
                <span>{formatRelativeTime(thread.created_at)}</span>
                <button
                  onClick={() => setLiked(!liked)}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-colors ${
                    liked ? "text-pink-300 bg-pink-500/20 border border-pink-500/30" : "text-zinc-500 hover:text-pink-300 hover:bg-pink-500/10 border border-transparent"
                  }`}
                >
                  <span>♥</span>
                  <span>{thread.likes_count + (liked ? 1 : 0)}</span>
                </button>
                <span className="flex items-center gap-1.5">
                  <span className="text-cyan-400">💬</span>
                  <span>{thread.replies_count} 回覆</span>
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Replies */}
        {posts.length > 0 && (
          <div className="mb-6 space-y-3">
            <h2 className="text-sm font-semibold text-zinc-400 px-1">回覆 ({posts.length})</h2>
            {posts.map((post, i) => <PostCard key={post.id} post={post} index={i} />)}
          </div>
        )}

        {/* Reply Box */}
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <h3 className="text-sm font-semibold text-zinc-300 mb-3">✏️ 回覆此串</h3>
          <textarea
            value={replyText}
            onChange={e => setReplyText(e.target.value)}
            placeholder="輸入回覆內容...（支援 Markdown）"
            rows={4}
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-zinc-200 placeholder-zinc-600 resize-none focus:outline-none focus:border-fuchsia-400/50 transition-colors"
          />
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-zinc-600">支援 **粗體** *斜體* `代碼`</span>
            <button
              disabled={!replyText.trim()}
              className="rounded-xl border border-fuchsia-400/30 bg-fuchsia-400/10 px-5 py-2 text-sm text-fuchsia-200 hover:bg-fuchsia-400/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              送出回覆
            </button>
          </div>
        </div>

        {/* Related threads */}
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-zinc-400 mb-3 px-1">相關討論</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {MOCK_THREADS.filter(t => t.id !== thread.id && t.forum_slug === params.slug).slice(0, 4).map(t => (
              <Link key={t.id} href={`/forum/${t.forum_slug}/${t.id}`}>
                <div className="rounded-xl border border-white/10 bg-black/20 p-3 hover:border-fuchsia-400/30 hover:bg-white/5 transition-all cursor-pointer">
                  <p className="text-xs font-medium text-zinc-300 line-clamp-2">{t.title}</p>
                  <div className="mt-1.5 flex items-center gap-2 text-[10px] text-zinc-600">
                    <span>♥ {t.likes_count}</span>
                    <span>💬 {t.replies_count}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
