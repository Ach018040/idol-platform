"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForumAuth } from "../../../lib/forum-auth";
import { MOCK_FORUMS } from "../../../lib/supabase-forum";

const TAG_SUGGESTIONS = [
  "Astria",
  "TUKUYOMI",
  "soda shower!",
  "活動情報",
  "新歌",
  "舞台心得",
  "應援",
  "見面會",
  "票務",
  "周邊",
];

function SignInModal({ onClose }: { onClose: () => void }) {
  const { joinAsGuest } = useForumAuth();
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!name.trim()) {
      setError("請先輸入顯示名稱");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      await joinAsGuest(name.trim());
      onClose();
    } catch {
      setError("登入失敗，請稍後再試");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
      <div className="w-full max-w-sm space-y-5 rounded-3xl border border-white/10 bg-[#0f1624] p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">登入論壇</h2>
          <button onClick={onClose} className="text-xl leading-none text-zinc-500 hover:text-white">
            ×
          </button>
        </div>
        <div className="space-y-2 py-2 text-center">
          <div className="text-4xl">👤</div>
          <p className="text-sm font-semibold text-white">先用訪客名稱加入討論</p>
          <p className="text-xs text-zinc-400">
            目前論壇採暱稱制，不需要 Email，輸入名稱後就能立即發文與回覆。
          </p>
        </div>
        <div className="space-y-3">
          <input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError("");
            }}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="請輸入你的顯示名稱（1-20 字）"
            maxLength={20}
            autoFocus
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder-zinc-600 transition-colors focus:border-fuchsia-400/50 focus:outline-none"
          />
          {error ? (
            <p className="rounded-lg bg-rose-400/10 px-3 py-2 text-xs text-rose-400">{error}</p>
          ) : null}
          <button
            onClick={submit}
            disabled={!name.trim() || submitting}
            className="w-full rounded-xl border border-fuchsia-400/30 bg-fuchsia-400/10 py-2.5 text-sm font-semibold text-fuchsia-200 transition-colors hover:bg-fuchsia-400/20 disabled:opacity-40"
          >
            {submitting ? "登入中..." : "以訪客身分登入"}
          </button>
        </div>
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

  const selectedForum = MOCK_FORUMS.find((item) => item.slug === forum);
  const canSubmit = title.trim().length >= 1 && body.trim().length >= 1;

  const addTag = (tag: string) => {
    const next = tag.trim();
    if (next && !tags.includes(next) && tags.length < 5) {
      setTags([...tags, next]);
      setTagInput("");
    }
  };

  const submit = async () => {
    if (!user) {
      setShowAuth(true);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/forum/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          forum_slug: forum,
          title: title.trim(),
          body: body.trim(),
          tags,
          author_token: user.token,
          author_name: user.display_name,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "發文失敗");
      router.push(`/forum/${forum}`);
    } catch (err) {
      setError(String(err));
      setLoading(false);
    }
  };

  return (
    <>
      {showAuth ? <SignInModal onClose={() => setShowAuth(false)} /> : null}
      <main className="min-h-screen text-white">
        <div className="mx-auto max-w-3xl px-4 py-8 md:px-6">
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/forum" className="text-sm text-zinc-500 hover:text-zinc-300">
                返回論壇
              </Link>
              <span className="text-zinc-700">/</span>
              <h1 className="text-xl font-black text-white">發表新主題</h1>
            </div>
            {user ? (
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-500 to-violet-500 text-[10px] font-bold text-white">
                  {[...user.display_name][0]}
                </div>
                <span>{user.display_name}</span>
              </div>
            ) : (
              <button
                onClick={() => setShowAuth(true)}
                className="rounded-lg border border-fuchsia-400/30 px-3 py-1.5 text-xs text-fuchsia-400 transition-colors hover:text-fuchsia-300"
              >
                先登入再發文
              </button>
            )}
          </div>

          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-zinc-400">
                選擇看板
              </label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {MOCK_FORUMS.map((item) => (
                  <button
                    key={item.slug}
                    onClick={() => setForum(item.slug)}
                    className={`rounded-xl border px-3 py-2.5 text-left text-xs font-medium transition-all ${
                      forum === item.slug
                        ? "border-fuchsia-400/50 bg-fuchsia-400/15 text-fuchsia-200"
                        : "border-white/10 bg-black/20 text-zinc-400 hover:border-white/20 hover:text-zinc-200"
                    }`}
                  >
                    <span className="mr-1.5">{item.icon}</span>
                    {item.title}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-zinc-400">
                標題 <span className="font-normal normal-case text-zinc-600">({title.length}/100)</span>
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value.slice(0, 100))}
                placeholder="請輸入文章標題"
                className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder-zinc-600 transition-colors focus:border-fuchsia-400/50 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-zinc-400">
                標籤 <span className="font-normal normal-case text-zinc-600">({tags.length}/5)</span>
              </label>
              <div className="mb-2 flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="flex items-center gap-1.5 rounded-full border border-fuchsia-400/30 bg-fuchsia-400/15 px-3 py-1 text-xs text-fuchsia-200"
                  >
                    {tag}
                    <button onClick={() => setTags(tags.filter((item) => item !== tag))}>×</button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault();
                      addTag(tagInput);
                    }
                  }}
                  placeholder="輸入標籤後按 Enter"
                  className="flex-1 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-white placeholder-zinc-600 focus:border-fuchsia-400/50 focus:outline-none"
                />
                <button
                  onClick={() => addTag(tagInput)}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-zinc-300 transition-colors hover:bg-white/10"
                >
                  加入
                </button>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {TAG_SUGGESTIONS.filter((tag) => !tags.includes(tag))
                  .slice(0, 9)
                  .map((tag) => (
                    <button
                      key={tag}
                      onClick={() => addTag(tag)}
                      className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-zinc-500 transition-colors hover:border-white/20 hover:text-zinc-200"
                    >
                      + {tag}
                    </button>
                  ))}
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
                  內容 <span className="font-normal normal-case text-zinc-600">({body.length} 字)</span>
                </label>
                <button
                  onClick={() => setPreview(!preview)}
                  className="text-xs text-zinc-500 transition-colors hover:text-zinc-300"
                >
                  {preview ? "返回編輯" : "預覽內容"}
                </button>
              </div>
              {preview ? (
                <div className="min-h-48 whitespace-pre-wrap rounded-xl border border-white/10 bg-black/20 p-4 text-sm leading-7 text-zinc-300">
                  {body || <span className="italic text-zinc-600">尚未輸入內容</span>}
                </div>
              ) : (
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder={`分享你在 ${selectedForum?.title} 看板想聊的主題...\n\n支援基本 Markdown，例如 **粗體**、*斜體*。`}
                  rows={10}
                  className="w-full resize-none rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-zinc-200 placeholder-zinc-600 transition-colors focus:border-fuchsia-400/50 focus:outline-none"
                />
              )}
            </div>

            <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 p-4 text-xs leading-6 text-amber-300/80">
              <strong className="text-amber-200">發文提醒：</strong>
              請避免張貼人身攻擊、未經證實的爆料、購票詐騙資訊與違規內容，管理員會視情況調整或移除貼文。
            </div>

            {error ? (
              <p className="rounded-lg bg-rose-400/10 px-3 py-2 text-xs text-rose-400">{error}</p>
            ) : null}

            <div className="flex gap-3 pt-2">
              <button
                onClick={submit}
                disabled={!canSubmit || loading}
                className="flex-1 rounded-xl border border-fuchsia-400/30 bg-fuchsia-400/10 py-3 text-sm font-semibold text-fuchsia-200 transition-colors hover:bg-fuchsia-400/20 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {loading ? "送出中..." : user ? "送出文章" : "登入後送出"}
              </button>
              <Link
                href="/forum"
                className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
              >
                取消
              </Link>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
