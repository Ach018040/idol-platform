"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MOCK_FORUMS } from "../../../lib/supabase-forum";

export default function NewThreadPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [forumSlug, setForumSlug] = useState("general");
  const [tags, setTags] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [preview, setPreview] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || !body.trim()) return;
    setSubmitting(true);
    // TODO: 連接真實 Supabase auth + insert
    await new Promise(r => setTimeout(r, 800));
    alert("發文功能需要登入（Supabase Auth 尚未連接）。\n\n未來版本將支援 Google / Email 登入。");
    setSubmitting(false);
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.18),_transparent_30%),linear-gradient(180deg,_#070b14_0%,_#111827_100%)] text-white">
      <div className="mx-auto max-w-3xl px-4 py-8 md:px-6">

        {/* Breadcrumb */}
        <div className="mb-6 flex items-center gap-2 text-sm text-zinc-500">
          <Link href="/forum" className="hover:text-zinc-300 transition-colors">論壇首頁</Link>
          <span>›</span>
          <span className="text-zinc-300">新發文</span>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 md:p-8 space-y-6">
          <h1 className="text-2xl font-black text-white">✏️ 發起新討論</h1>

          {/* Forum 選擇 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">選擇版區</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {MOCK_FORUMS.map(f => (
                <button
                  key={f.slug}
                  onClick={() => setForumSlug(f.slug)}
                  className={`rounded-xl border px-3 py-2 text-xs transition-colors ${
                    forumSlug === f.slug
                      ? "border-fuchsia-400/50 bg-fuchsia-400/15 text-fuchsia-200"
                      : "border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10"
                  }`}
                >
                  <span className="mr-1">{f.icon}</span>{f.title}
                </button>
              ))}
            </div>
          </div>

          {/* 標題 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">標題 <span className="text-rose-400">*</span></label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="請輸入討論標題..."
              maxLength={100}
              className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-fuchsia-400/50 transition-colors"
            />
            <div className="text-right text-xs text-zinc-600">{title.length}/100</div>
          </div>

          {/* 標籤 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">標籤 <span className="text-zinc-600 font-normal">（以逗號分隔，選填）</span></label>
            <input
              type="text"
              value={tags}
              onChange={e => setTags(e.target.value)}
              placeholder="例：時空Astria, 新專輯, 活動心得"
              className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-fuchsia-400/50 transition-colors"
            />
            {tags && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {tags.split(",").map(t => t.trim()).filter(Boolean).map(t => (
                  <span key={t} className="text-xs bg-white/5 border border-white/10 rounded-full px-2.5 py-1 text-zinc-400">{t}</span>
                ))}
              </div>
            )}
          </div>

          {/* 內文 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-zinc-300">內文 <span className="text-rose-400">*</span></label>
              <button
                onClick={() => setPreview(!preview)}
                className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors border border-white/10 rounded-lg px-3 py-1"
              >
                {preview ? "✏️ 編輯" : "👁 預覽"}
              </button>
            </div>
            {preview ? (
              <div className="min-h-40 rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-zinc-300 leading-7 whitespace-pre-wrap">
                {body || <span className="text-zinc-600">（空白）</span>}
              </div>
            ) : (
              <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                placeholder="分享你的想法...（支援 Markdown：**粗體** *斜體* `代碼`）"
                rows={8}
                className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-zinc-200 placeholder-zinc-600 resize-none focus:outline-none focus:border-fuchsia-400/50 transition-colors"
              />
            )}
            <div className="text-right text-xs text-zinc-600">{body.length} 字</div>
          </div>

          {/* 規範提醒 */}
          <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 p-4 text-xs text-amber-200/80 space-y-1">
            <p className="font-semibold text-amber-200">📌 發文規範</p>
            <p>· 請尊重偶像與其他用戶，禁止人身攻擊</p>
            <p>· 未經許可不得分享偶像的私人照片或個人資料</p>
            <p>· 拍照規則請依照各團體官方規定</p>
          </div>

          {/* 按鈕 */}
          <div className="flex items-center justify-between pt-2">
            <Link href="/forum" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
              ← 取消
            </Link>
            <button
              onClick={handleSubmit}
              disabled={!title.trim() || !body.trim() || submitting}
              className="rounded-xl border border-fuchsia-400/30 bg-fuchsia-400/10 px-6 py-2.5 text-sm font-semibold text-fuchsia-200 hover:bg-fuchsia-400/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? "發送中..." : "🚀 發表討論"}
            </button>
          </div>
        </div>

        {/* 登入提示 */}
        <div className="mt-4 rounded-2xl border border-cyan-400/20 bg-cyan-500/10 p-4 flex items-center justify-between">
          <div className="text-sm text-cyan-200">
            <span className="font-semibold">🔐 需要登入才能發文</span>
            <p className="text-xs text-cyan-300/70 mt-0.5">Supabase Auth 整合中，即將支援 Google / Email 登入</p>
          </div>
          <button className="rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-xs text-cyan-200 hover:bg-cyan-400/20 transition-colors">
            登入 / 註冊
          </button>
        </div>
      </div>
    </main>
  );
}
