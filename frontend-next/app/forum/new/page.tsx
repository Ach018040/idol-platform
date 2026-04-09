"use client";
import { useState } from "react";
import Link from "next/link";
import { MOCK_FORUMS } from "../../../lib/supabase-forum";
import { useForumAuth } from "../../../lib/forum-auth";
import { useRouter } from "next/navigation";

const TAG_SUGGESTIONS = ["時空Astria","TUKUYOMI","soda shower!","幻獣","悪戯ピエロ","活動心得","物販","拍立得","公演","新成員","排行","解散"];

function SignInModal({ onClose }: { onClose: () => void }) {
  const { joinAsGuest } = useForumAuth();
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const submit = () => {
    if (!name.trim()) { setError("請輸入暱稱"); return; }
    const res = joinAsGuest(name.trim());
    if (res.error) { setError(res.error); return; }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#0f1624] p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">💬 加入討論</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white text-xl leading-none">×</button>
        </div>
        <div className="text-center space-y-2 py-2">
          <div className="text-4xl">🎭</div>
          <p className="text-sm font-semibold text-white">選擇你的暱稱</p>
          <p className="text-xs text-zinc-400">無需帳號或 email，輸入暱稱即可開始討論</p>
        </div>
        <div className="space-y-3">
          <input value={name} onChange={e => { setName(e.target.value); setError(""); }}
            onKeyDown={e => e.key === "Enter" && submit()}
            placeholder="輸入暱稱（2–20 字元）" maxLength={20} autoFocus
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-fuchsia-400/50 transition-colors"/>
          {error && <p className="text-xs text-rose-400 bg-rose-400/10 rounded-lg px-3 py-2">{error}</p>}
          <button onClick={submit} disabled={!name.trim()}
            className="w-full rounded-xl border border-fuchsia-400/30 bg-fuchsia-400/10 py-2.5 text-sm font-semibold text-fuchsia-200 hover:bg-fuchsia-400/20 disabled:opacity-40 transition-colors">
            開始討論 →
          </button>
        </div>
        <p className="text-xs text-zinc-600 text-center leading-5">
          暱稱儲存於你的瀏覽器，不需要 email 或帳號
        </p>
      </div>
    </div>
  );
}

export default function NewThreadPage() {
  const router = useRouter();
  const { user } = useForumAuth();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [forum, setForum] = useState("general");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [preview, setPreview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showAuth, setShowAuth] = useState(false);
  // 頁面載入時如果是 magic link callback，auth 已在 forum-auth.tsx 處理

  const addTag = (tag: string) => {
    const t = tag.trim();
    if (t && !tags.includes(t) && tags.length < 5) { setTags([...tags, t]); setTagInput(""); }
  };

  const selectedForum = MOCK_FORUMS.find(f => f.slug === forum);
  const canSubmit = title.trim().length >= 1 && body.trim().length >= 1;

  const submit = async () => {
    if (!user) { setShowAuth(true); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/forum/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ forum_slug: forum, title: title.trim(), body: body.trim(), tags, author_token: user.token,
            author_name: user.display_name, }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "發文失敗");
      router.push(`/forum/${forum}`);
    } catch (e) {
      setError(String(e));
      setLoading(false);
    }
  };

  return (
    <>
      {showAuth && <SignInModal onClose={() => setShowAuth(false)} />}
      <main className="min-h-screen text-white">
        <div className="mx-auto max-w-3xl px-4 py-8 md:px-6">
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/forum" className="text-zinc-500 hover:text-zinc-300 text-sm">← 返回論壇</Link>
              <span className="text-zinc-700">/</span>
              <h1 className="text-xl font-black text-white">發表新討論</h1>
            </div>
            {user ? (
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-fuchsia-500 to-violet-500 flex items-center justify-center text-white font-bold text-[10px]">
                  {[...user.display_name][0]}
                </div>
                <span>{user.display_name}</span>
              </div>
            ) : (
              <button onClick={() => setShowAuth(true)} className="text-xs text-fuchsia-400 hover:text-fuchsia-300 border border-fuchsia-400/30 rounded-lg px-3 py-1.5 transition-colors">
                登入發文
              </button>
            )}
          </div>

          <div className="space-y-5">
            {/* 版區 */}
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-2 uppercase tracking-widest">選擇版區</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {MOCK_FORUMS.map(f => (
                  <button key={f.slug} onClick={() => setForum(f.slug)}
                    className={`rounded-xl border px-3 py-2.5 text-xs font-medium transition-all text-left ${forum === f.slug ? "border-fuchsia-400/50 bg-fuchsia-400/15 text-fuchsia-200" : "border-white/10 bg-black/20 text-zinc-400 hover:border-white/20 hover:text-zinc-200"}`}>
                    <span className="mr-1.5">{f.icon}</span>{f.title}
                  </button>
                ))}
              </div>
            </div>

            {/* 標題 */}
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-2 uppercase tracking-widest">標題 <span className="text-zinc-600 normal-case font-normal">（{title.length}/100）</span></label>
              <input value={title} onChange={e => setTitle(e.target.value.slice(0,100))}
                placeholder="輸入討論串標題..." className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-fuchsia-400/50 transition-colors"/>
            </div>

            {/* 標籤 */}
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-2 uppercase tracking-widest">標籤 <span className="text-zinc-600 normal-case font-normal">（{tags.length}/5）</span></label>
              <div className="flex flex-wrap gap-2 mb-2">
                {tags.map(t => (
                  <span key={t} className="flex items-center gap-1.5 rounded-full bg-fuchsia-400/15 border border-fuchsia-400/30 px-3 py-1 text-xs text-fuchsia-200">
                    {t}<button onClick={() => setTags(tags.filter(x=>x!==t))} className="text-fuchsia-400 hover:text-white">×</button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input value={tagInput} onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => { if(e.key==='Enter'||e.key===','){e.preventDefault();addTag(tagInput);}}}
                  placeholder="輸入後按 Enter..." className="flex-1 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-fuchsia-400/50"/>
                <button onClick={() => addTag(tagInput)} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-zinc-300 hover:bg-white/10 transition-colors">加入</button>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {TAG_SUGGESTIONS.filter(t => !tags.includes(t)).slice(0, 9).map(t => (
                  <button key={t} onClick={() => addTag(t)} className="rounded-full bg-white/5 border border-white/10 px-2.5 py-1 text-[11px] text-zinc-500 hover:text-zinc-200 hover:border-white/20 transition-colors">+ {t}</button>
                ))}
              </div>
            </div>

            {/* 內容 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">內容 <span className="text-zinc-600 normal-case font-normal">（{body.length} 字）</span></label>
                <button onClick={() => setPreview(!preview)} className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">{preview ? "✏️ 編輯" : "👁 預覽"}</button>
              </div>
              {preview ? (
                <div className="min-h-48 rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-300 leading-7 whitespace-pre-wrap">
                  {body || <span className="text-zinc-600 italic">空白</span>}
                </div>
              ) : (
                <textarea value={body} onChange={e => setBody(e.target.value)}
                  placeholder={`在「${selectedForum?.title}」板發表你的想法...\n\n支援 Markdown：**粗體** *斜體*`}
                  rows={10} className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-zinc-200 placeholder-zinc-600 resize-none focus:outline-none focus:border-fuchsia-400/50 transition-colors"/>
              )}
            </div>

            <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 p-4 text-xs text-amber-300/80 leading-6">
              <strong className="text-amber-200">📢 發文提醒：</strong>請遵守各版區規範。拍照與物販討論請遵循各團體官方規定。
            </div>

            {error && <p className="text-xs text-rose-400 bg-rose-400/10 rounded-lg px-3 py-2">{error}</p>}

            <div className="flex gap-3 pt-2">
              <button onClick={submit} disabled={!canSubmit || loading}
                className="flex-1 rounded-xl border border-fuchsia-400/30 bg-fuchsia-400/10 py-3 text-sm font-semibold text-fuchsia-200 hover:bg-fuchsia-400/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                {loading ? "發布中..." : user ? "🚀 發布討論串" : "🔐 登入後發布"}
              </button>
              <Link href="/forum" className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-zinc-400 hover:text-white hover:bg-white/10 transition-colors">取消</Link>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
