"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { notFound } from "next/navigation";
import {
  MOCK_FORUMS, MOCK_THREADS, MOCK_POSTS,
  getTrendingTag, formatRelativeTime, type Post, type Thread,
} from "../../../../lib/supabase-forum";
import { useForumAuth } from "../../../../lib/forum-auth";

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
            <span>#{index + 1}</span><span>·</span><span>{formatRelativeTime(post.created_at)}</span>
          </div>
        </div>
        <button className="text-xs text-zinc-600 hover:text-zinc-400 px-2 py-1 rounded hover:bg-white/5 transition-colors">引用</button>
      </div>
      <p className="text-sm text-zinc-300 leading-7">{post.body}</p>
      <div className="mt-4 flex items-center gap-3 pt-3 border-t border-white/5">
        <button onClick={() => setLiked(!liked)}
          className={`flex items-center gap-1.5 text-xs rounded-lg px-3 py-1.5 transition-colors border ${liked ? "text-pink-300 bg-pink-500/20 border-pink-500/30" : "text-zinc-500 hover:text-pink-300 hover:bg-pink-500/10 border-transparent"}`}>
          <span>♥</span><span>{post.likes_count + (liked ? 1 : 0)}</span>
        </button>
      </div>
    </div>
  );
}

export default function ThreadPage({ params }: { params: { slug: string; threadId: string } }) {
  const { user } = useForumAuth();
  const forum = MOCK_FORUMS.find(f => f.slug === params.slug);
  const mockThread = MOCK_THREADS.find(t => t.id === params.threadId);

  const [thread, setThread] = useState<Thread | null>(mockThread || null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [liked, setLiked] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [replyError, setReplyError] = useState("");

  if (!forum) notFound();

  useEffect(() => {
    // 載入回覆
    const loadPosts = async () => {
      try {
        const res = await fetch(`/api/forum/posts?thread_id=${params.threadId}`);
        const data = await res.json();
        if (data.posts?.length > 0) {
          setPosts(data.posts);
        } else {
          setPosts(MOCK_POSTS.filter(p => p.thread_id === params.threadId));
        }
      } catch {
        setPosts(MOCK_POSTS.filter(p => p.thread_id === params.threadId));
      }
    };
    loadPosts();
  }, [params.threadId]);

  const submitReply = async () => {
    if (!replyText.trim()) return;
    if (!user) { setReplyError("請先登入再回覆"); return; }
    setSubmitting(true); setReplyError("");
    try {
      const res = await fetch("/api/forum/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ thread_id: params.threadId, body: replyText.trim(), author_token: user.token }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "回覆失敗");
      // 加入新回覆到列表
      setPosts(prev => [...prev, { ...data.post, author_name: user.display_name }]);
      setReplyText("");
    } catch (e) {
      // Fallback: 樂觀更新（DB 未建立時）
      setPosts(prev => [...prev, {
        id: "local-" + Date.now(),
        thread_id: params.threadId,
        author_id: user.id,
        author_name: user.display_name,
        body: replyText.trim(),
        likes_count: 0,
        edited: false,
        created_at: new Date().toISOString(),
      }]);
      setReplyText("");
    } finally {
      setSubmitting(false);
    }
  };

  const t = thread;
  if (!t) notFound();
  const tag = getTrendingTag(t);

  return (
    <main className="min-h-screen text-white">
      <div className="mx-auto max-w-4xl px-4 py-8 md:px-6">
        {/* Breadcrumb */}
        <div className="mb-6 flex items-center gap-2 text-sm text-zinc-500">
          <Link href="/forum" className="hover:text-zinc-300 transition-colors">論壇首頁</Link>
          <span>›</span>
          <Link href={`/forum/${params.slug}`} className="hover:text-zinc-300 transition-colors">{forum.title}</Link>
          <span>›</span>
          <span className="text-zinc-400 truncate max-w-xs">{t.title}</span>
        </div>

        {/* Thread Header */}
        <header className="mb-6 rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {t.is_pinned && <span className="text-[10px] font-semibold text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded-full px-2 py-0.5">📌 置頂</span>}
            {tag === "hot" && <span className="text-[10px] font-semibold text-rose-300 bg-rose-500/20 border border-rose-500/30 rounded-full px-2 py-0.5">🔥 Hot</span>}
            {tag === "rising" && <span className="text-[10px] font-semibold text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 rounded-full px-2 py-0.5">📈 Rising</span>}
            {t.tags.map(tag2 => <span key={tag2} className="text-[10px] text-zinc-400 bg-white/5 border border-white/10 rounded-full px-2 py-0.5">{tag2}</span>)}
          </div>
          <h1 className="text-xl font-black text-white mb-4">{t.title}</h1>
          <div className="flex items-start gap-3">
            <Avatar name={t.author_name || "?"} size={9} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-semibold text-white">{t.author_name}</span>
                <span className="text-[10px] text-fuchsia-400 bg-fuchsia-400/10 rounded-full px-2 py-0.5">OP</span>
              </div>
              <p className="text-sm text-zinc-300 leading-7">{t.body}</p>
              <div className="mt-4 flex items-center gap-4 pt-3 border-t border-white/5 text-xs text-zinc-500">
                <span>{formatRelativeTime(t.created_at)}</span>
                <button onClick={() => setLiked(!liked)}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-colors border ${liked ? "text-pink-300 bg-pink-500/20 border-pink-500/30" : "text-zinc-500 hover:text-pink-300 hover:bg-pink-500/10 border-transparent"}`}>
                  <span>♥</span><span>{t.likes_count + (liked ? 1 : 0)}</span>
                </button>
                <span className="flex items-center gap-1.5"><span className="text-cyan-400">💬</span><span>{t.replies_count + posts.length} 回覆</span></span>
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
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-zinc-300">✏️ 回覆此串</h3>
            {!user && <Link href="/forum/new" className="text-xs text-fuchsia-400 hover:text-fuchsia-300">登入後回覆</Link>}
          </div>
          <textarea value={replyText} onChange={e => setReplyText(e.target.value)}
            placeholder={user ? "輸入回覆內容...（支援 Markdown）" : "登入後才能回覆..."}
            disabled={!user}
            rows={4}
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-zinc-200 placeholder-zinc-600 resize-none focus:outline-none focus:border-fuchsia-400/50 transition-colors disabled:opacity-50"/>
          {replyError && <p className="mt-2 text-xs text-rose-400">{replyError}</p>}
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-zinc-600">支援 **粗體** *斜體*</span>
            <button onClick={submitReply} disabled={!replyText.trim() || submitting || !user}
              className="rounded-xl border border-fuchsia-400/30 bg-fuchsia-400/10 px-5 py-2 text-sm text-fuchsia-200 hover:bg-fuchsia-400/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              {submitting ? "送出中..." : "送出回覆"}
            </button>
          </div>
        </div>

        {/* Related */}
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-zinc-400 mb-3 px-1">相關討論</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {MOCK_THREADS.filter(t2 => t2.id !== t.id && t2.forum_slug === params.slug).slice(0, 4).map(t2 => (
              <Link key={t2.id} href={`/forum/${t2.forum_slug}/${t2.id}`}>
                <div className="rounded-xl border border-white/10 bg-black/20 p-3 hover:border-fuchsia-400/30 hover:bg-white/5 transition-all cursor-pointer">
                  <p className="text-xs font-medium text-zinc-300 line-clamp-2">{t2.title}</p>
                  <div className="mt-1.5 flex items-center gap-2 text-[10px] text-zinc-600">
                    <span>♥ {t2.likes_count}</span><span>💬 {t2.replies_count}</span>
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
