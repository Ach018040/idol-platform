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
  "幻獸",
  "月海",
  "活動心得",
  "票務",
  "新手提問",
  "成員推薦",
  "舞台觀察",
];

function SignInModal({ onClose }: { onClose: () => void }) {
  const { joinAsGuest } = useForumAuth();
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!name.trim()) {
      setError("請先輸入顯示名稱。");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      await joinAsGuest(name.trim());
      onClose();
    } catch {
      setError("登入論壇失敗，請稍後再試。");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
      <div className="surface-panel w-full max-w-sm space-y-5 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">登入論壇</h2>
          <button onClick={onClose} className="text-xl leading-none text-zinc-500 hover:text-white">
            ×
          </button>
        </div>
        <div className="space-y-2 py-2 text-center">
          <div className="text-4xl">Forum</div>
          <p className="text-sm font-semibold text-white">先用顯示名稱加入論壇，再開始發文</p>
          <p className="text-xs leading-6 text-zinc-400">
            目前論壇支援快速匿名登入。登入後可發文、回覆與管理個人操作狀態，後續再接正式帳號系統。
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
            placeholder="輸入顯示名稱，建議 1-20 字"
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
            {submitting ? "登入中..." : "登入並繼續"}
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
  const canSubmit = title.trim().length >= 2 && body.trim().length >= 10;

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
      if (!res.ok) throw new Error(data.error || "發文失敗，請稍後再試。");
      router.push(`/forum/${forum}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "發文失敗，請稍後再試。");
      setLoading(false);
    }
  };

  return (
    <>
      {showAuth ? <SignInModal onClose={() => setShowAuth(false)} /> : null}
      <main className="page-shell min-h-screen text-white">
        <div className="mx-auto max-w-3xl px-4 py-8 md:px-6">
          <header className="hero-surface mb-8 p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="mb-2 flex items-center gap-2 text-sm text-zinc-400">
                  <Link href="/forum" className="transition-colors hover:text-zinc-200">
                    論壇
                  </Link>
                  <span>/</span>
                  <span>發表文章</span>
                </div>
                <h1 className="text-3xl font-black text-white">發表新文章</h1>
                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  選擇版區、整理標題與內容，讓成員、團體或活動討論更容易被看見。
                </p>
              </div>
              {user ? (
                <div className="surface-card flex items-center gap-2 px-3 py-2 text-xs text-zinc-300">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-500 to-violet-500 text-[11px] font-bold text-white">
                    {[...user.display_name][0]}
                  </div>
                  <div>
                    <div className="font-semibold text-white">{user.display_name}</div>
                    <div className="text-zinc-500">已登入論壇</div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowAuth(true)}
                  className="rounded-xl border border-fuchsia-400/30 bg-fuchsia-400/10 px-4 py-2 text-sm text-fuchsia-200 transition-colors hover:bg-fuchsia-400/20"
                >
                  先登入再發文
                </button>
              )}
            </div>
          </header>

          <div className="space-y-5">
            <section className="surface-panel p-5">
              <label className="mb-3 block text-xs font-semibold uppercase tracking-widest text-zinc-400">
                選擇版區
              </label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {MOCK_FORUMS.map((item) => (
                  <button
                    key={item.slug}
                    onClick={() => setForum(item.slug)}
                    className={`rounded-xl border px-3 py-3 text-left text-xs font-medium transition-all ${
                      forum === item.slug
                        ? "border-fuchsia-400/50 bg-fuchsia-400/15 text-fuchsia-200"
                        : "border-white/10 bg-black/20 text-zinc-400 hover:border-white/20 hover:text-zinc-200"
                    }`}
                  >
                    <div className="mb-1 text-sm">{item.icon}</div>
                    <div>{item.title}</div>
                    {item.description ? <div className="mt-1 text-[11px] text-zinc-500">{item.description}</div> : null}
                  </button>
                ))}
              </div>
            </section>

            <section className="surface-panel p-5">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-zinc-400">
                標題 <span className="font-normal normal-case text-zinc-600">({title.length}/100)</span>
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value.slice(0, 100))}
                placeholder="用一句話說清楚你想討論的重點"
                className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder-zinc-600 transition-colors focus:border-fuchsia-400/50 focus:outline-none"
              />
            </section>

            <section className="surface-panel p-5">
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
                    <button type="button" onClick={() => setTags(tags.filter((item) => item !== tag))}>
                      ×
                    </button>
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
                  type="button"
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
                      type="button"
                      onClick={() => addTag(tag)}
                      className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-zinc-500 transition-colors hover:border-white/20 hover:text-zinc-200"
                    >
                      + {tag}
                    </button>
                  ))}
              </div>
            </section>

            <section className="surface-panel p-5">
              <div className="mb-2 flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
                  內容 <span className="font-normal normal-case text-zinc-600">({body.length} 字)</span>
                </label>
                <button
                  type="button"
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
                  placeholder={`分享你想在 ${selectedForum?.title ?? "這個版區"} 討論的內容。\n\n可以整理演出心得、成員觀察、活動資訊或提出具體問題。`}
                  rows={10}
                  className="w-full resize-none rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-zinc-200 placeholder-zinc-600 transition-colors focus:border-fuchsia-400/50 focus:outline-none"
                />
              )}
            </section>

            <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 p-4 text-xs leading-6 text-amber-300/80">
              <strong className="text-amber-200">發文提醒：</strong>
              請避免張貼未經證實的人身攻擊、惡意爆料或違反平台規範的內容。若文章含有票務、活動資訊，建議附上來源與時間，讓其他人更容易查證。
            </div>

            {error ? (
              <p className="rounded-lg bg-rose-400/10 px-3 py-2 text-xs text-rose-400">{error}</p>
            ) : null}

            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
              <button
                type="button"
                onClick={submit}
                disabled={!canSubmit || loading}
                className="flex-1 rounded-xl border border-fuchsia-400/30 bg-fuchsia-400/10 py-3 text-sm font-semibold text-fuchsia-200 transition-colors hover:bg-fuchsia-400/20 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {loading ? "發文中..." : user ? "送出文章" : "登入後送出"}
              </button>
              <Link
                href="/forum"
                className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-center text-sm text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
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
