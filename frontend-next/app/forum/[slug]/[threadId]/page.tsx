"use client";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { MOCK_FORUMS, formatRelativeTime, type Thread, type Post, type Forum } from "../../../../lib/supabase-forum";
import { useForumAuth } from "../../../../lib/forum-auth";

function PostCard({ post }: { post: Post }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-bold text-xs">
          {[...(post.author_name||"?")][0]}
        </div>
        <span className="text-sm font-medium text-zinc-300">{post.author_name||"匿名"}</span>
        <span className="text-zinc-600">·</span>
        <span className="text-xs text-zinc-500">{formatRelativeTime(post.created_at)}</span>
        {post.edited&&<span className="text-[10px] text-zinc-600 border border-zinc-700 rounded px-1">已編輯</span>}
      </div>
      <div className="text-sm text-zinc-300 leading-7 whitespace-pre-wrap">{post.body}</div>
      <div className="mt-3 flex items-center gap-3 text-xs text-zinc-500">
        <button className="flex items-center gap-1 hover:text-pink-400 transition-colors"><span className="text-pink-400/70">♥</span> {post.likes_count||0}</button>
      </div>
    </div>
  );
}

export default function ThreadPage({ params }: { params: { slug: string; threadId: string } }) {
  const { user } = useForumAuth();
  const [thread, setThread] = useState<Thread|null>(null);
  const [forum, setForum] = useState<Forum|null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyBody, setReplyBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [replyError, setReplyError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(()=>{
    const load=async()=>{
      setLoading(true);
      try { const res=await fetch(`/api/forum/thread?id=${params.threadId}`); const data=await res.json(); setThread(data.thread||null); } catch { setThread(null); }
      try {
        const fRes=await fetch("/api/forum/forums");
        const fData=await fRes.json();
        setForum((fData.forums||MOCK_FORUMS).find((f:Forum)=>f.slug===params.slug)||MOCK_FORUMS.find(f=>f.slug===params.slug)||null);
      } catch { setForum(MOCK_FORUMS.find(f=>f.slug===params.slug)||null); }
      try {
        const pRes=await fetch(`/api/forum/replies?thread_id=${params.threadId}&limit=100`);
        const pData=await pRes.json();
        setPosts(Array.isArray(pData.posts)?pData.posts:[]);
      } catch { setPosts([]); }
      setLoading(false);
    };
    load();
  },[params.slug,params.threadId]);

  const submitReply=async()=>{
    if(!user||!replyBody.trim()){setReplyError("請輸入回覆內容");return;}
    setSubmitting(true); setReplyError("");
    try {
      const res=await fetch("/api/forum/replies",{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({thread_id:params.threadId,body:replyBody.trim(),author_token:user.token,author_name:user.display_name})});
      const data=await res.json();
      if(!res.ok) throw new Error(data.error||"回覆失敗");
      setPosts(prev=>[...prev,data.post]);
      setReplyBody("");
      setTimeout(()=>bottomRef.current?.scrollIntoView({behavior:"smooth"}),100);
    } catch(e){ setReplyError(String(e)); }
    finally{ setSubmitting(false); }
  };

  if(loading) return <main className="min-h-screen text-white"><div className="mx-auto max-w-3xl px-4 py-8"><div className="space-y-4 animate-pulse"><div className="h-6 bg-white/5 rounded w-1/3"/><div className="h-32 bg-white/5 rounded-2xl"/><div className="h-20 bg-white/5 rounded-2xl"/></div></div></main>;
  if(!thread) return <main className="min-h-screen text-white flex items-center justify-center"><div className="text-center"><div className="text-4xl mb-4">🔍</div><p className="text-zinc-400">找不到這篇討論</p><Link href={`/forum/${params.slug}`} className="mt-4 inline-block text-fuchsia-400 hover:text-fuchsia-300">← 返回版區</Link></div></main>;

  return (
    <main className="min-h-screen text-white">
      <div className="mx-auto max-w-3xl px-4 py-8 md:px-6">
        <div className="mb-6 flex items-center gap-2 text-sm text-zinc-500 flex-wrap">
          <Link href="/forum" className="hover:text-zinc-300">論壇</Link><span>›</span>
          <Link href={`/forum/${params.slug}`} className="hover:text-zinc-300">{forum?.title||params.slug}</Link><span>›</span>
          <span className="text-zinc-300 line-clamp-1">{thread.title}</span>
        </div>
        <div className="rounded-3xl border border-white/10 bg-black/30 p-6 mb-6">
          {thread.is_pinned&&<span className="text-[10px] text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded-full px-2 py-0.5 mb-3 inline-block">📌 置頂</span>}
          <h1 className="text-xl font-black text-white mb-4">{thread.title}</h1>
          <div className="flex items-center gap-2 mb-4 text-xs text-zinc-500 flex-wrap">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-fuchsia-500 to-violet-500 flex items-center justify-center text-white font-bold text-[10px]">{[...(thread.author_name||"?")][0]}</div>
            <span className="text-zinc-300">{thread.author_name||"匿名"}</span><span>·</span>
            <span>{formatRelativeTime(thread.created_at)}</span>
            {(thread.tags||[]).map(tag=>(<span key={tag} className="rounded-full bg-white/5 border border-white/10 px-2 py-0.5">{tag}</span>))}
          </div>
          <div className="text-sm text-zinc-300 leading-7 whitespace-pre-wrap">{thread.body}</div>
          <div className="mt-4 flex items-center gap-4 text-xs text-zinc-500 border-t border-white/5 pt-4">
            <span><span className="text-pink-400">♥</span> {thread.likes_count||0}</span>
            <span><span className="text-cyan-400">💬</span> {posts.length} 則回覆</span>
          </div>
        </div>
        {posts.length>0&&(
          <div className="space-y-3 mb-6">
            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest">回覆 ({posts.length})</h2>
            {posts.map(p=><PostCard key={p.id} post={p}/>)}
          </div>
        )}
        <div ref={bottomRef}/>
        {thread.is_locked?(
          <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4 text-sm text-amber-300 text-center">🔒 此討論串已鎖定</div>
        ):(
          <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
            <h2 className="text-sm font-semibold text-zinc-300 mb-3">💬 發表回覆</h2>
            {!user?(
              <div className="text-center py-4">
                <p className="text-sm text-zinc-500 mb-3">加入討論後才能回覆</p>
                <Link href="/forum/new" className="rounded-xl border border-fuchsia-400/30 bg-fuchsia-400/10 px-4 py-2 text-sm text-fuchsia-200 hover:bg-fuchsia-400/20 transition-colors">🎭 加入討論</Link>
              </div>
            ):(
              <>
                <div className="flex items-center gap-2 mb-3 text-xs text-zinc-400">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-fuchsia-500 to-violet-500 flex items-center justify-center text-white font-bold text-[10px]">{[...user.display_name][0]}</div>
                  <span>{user.display_name}</span>
                </div>
                <textarea value={replyBody} onChange={e=>setReplyBody(e.target.value)} placeholder="輸入你的回覆..." rows={4}
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-zinc-200 placeholder-zinc-600 resize-none focus:outline-none focus:border-fuchsia-400/50 transition-colors mb-3"/>
                {replyError&&<p className="text-xs text-rose-400 bg-rose-400/10 rounded-lg px-3 py-2 mb-3">{replyError}</p>}
                <button onClick={submitReply} disabled={!replyBody.trim()||submitting}
                  className="rounded-xl border border-fuchsia-400/30 bg-fuchsia-400/10 px-5 py-2.5 text-sm font-semibold text-fuchsia-200 hover:bg-fuchsia-400/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  {submitting?"發送中...":"🚀 送出回覆"}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
