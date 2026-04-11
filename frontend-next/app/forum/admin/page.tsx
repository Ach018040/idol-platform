"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useForumAuth } from "../../../lib/forum-auth";

const SB_URL =
  process.env.NEXT_PUBLIC_FORUM_SB_URL || "https://vxmebuygrnynxkepyunh.supabase.co";
const SB_ANON = process.env.NEXT_PUBLIC_FORUM_SB_ANON || "";
const ADMIN_SECRET_KEY = "forum_admin_secret";
const FORUM_USER_KEY = "forum_user_v2";

type ThreadRow = {
  id: string;
  title: string;
  forum_slug: string;
  author_name: string;
  likes_count: number;
  replies_count: number;
  trending_score: number;
  is_pinned: boolean;
  is_locked: boolean;
  created_at: string;
};

type PostRow = {
  id: string;
  thread_id: string;
  author_name: string;
  body: string;
  likes_count: number;
  created_at: string;
};

type ReportRow = {
  id: string;
  target_type: string;
  target_id: string;
  reason: string;
  status: string;
  created_at: string;
  reporter_id: string;
};

type TabKey = "overview" | "threads" | "posts" | "reports" | "rules";

const tabLabels: Record<TabKey, string> = {
  overview: "總覽",
  threads: "主題管理",
  posts: "留言管理",
  reports: "檢舉管理",
  rules: "規範說明",
};

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone: "fuchsia" | "cyan" | "amber" | "rose";
}) {
  const toneMap = {
    fuchsia: "border-fuchsia-400/20 bg-fuchsia-500/10 text-fuchsia-200",
    cyan: "border-cyan-400/20 bg-cyan-500/10 text-cyan-200",
    amber: "border-amber-400/20 bg-amber-500/10 text-amber-200",
    rose: "border-rose-400/20 bg-rose-500/10 text-rose-200",
  } as const;

  return (
    <div className={`rounded-2xl border p-5 ${toneMap[tone]}`}>
      <div className="mb-2 text-xs uppercase tracking-widest text-white/60">{label}</div>
      <div className="text-3xl font-black">{value}</div>
    </div>
  );
}

export default function ForumAdminPage() {
  const { user } = useForumAuth();
  const [tab, setTab] = useState<TabKey>("overview");
  const [threads, setThreads] = useState<ThreadRow[]>([]);
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState("");
  const [secret, setSecret] = useState("");
  const [loginMsg, setLoginMsg] = useState("");
  const [localAdmin, setLocalAdmin] = useState(false);

  const isAdmin = useMemo(() => localAdmin || user?.role === "admin", [localAdmin, user?.role]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedSecret = localStorage.getItem(ADMIN_SECRET_KEY) || "";
    if (storedSecret) {
      setSecret(storedSecret);
      setLocalAdmin(true);
    }
  }, []);

  const markLocalAdmin = (adminSecret: string) => {
    if (typeof window === "undefined" || !user) return;

    localStorage.setItem(ADMIN_SECRET_KEY, adminSecret);
    const raw = localStorage.getItem(FORUM_USER_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        localStorage.setItem(
          FORUM_USER_KEY,
          JSON.stringify({
            ...parsed,
            role: "admin",
          }),
        );
      } catch {}
    }

    setLocalAdmin(true);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const headers = { apikey: SB_ANON, Accept: "application/json" };
      const [threadRows, postRows, reportRows] = await Promise.all([
        fetch(`${SB_URL}/rest/v1/threads?select=*&order=created_at.desc&limit=30`, {
          headers,
        }).then((res) => res.json()),
        fetch(`${SB_URL}/rest/v1/posts?select=*&order=created_at.desc&limit=30`, {
          headers,
        }).then((res) => res.json()),
        fetch(`${SB_URL}/rest/v1/reports?order=created_at.desc&limit=50`, {
          headers,
        })
          .then((res) => (res.ok ? res.json() : []))
          .catch(() => []),
      ]);

      if (Array.isArray(threadRows)) setThreads(threadRows);
      if (Array.isArray(postRows)) setPosts(postRows);
      if (Array.isArray(reportRows)) setReports(reportRows);
    } catch {
      setActionMsg("無法讀取論壇管理資料，請稍後再試。");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin, tab]);

  const runAdminAction = async (action: string, targetId: string, value?: boolean) => {
    if (!secret) {
      setActionMsg("請先完成管理員驗證。");
      return;
    }

    const res = await fetch("/api/forum/admin/moderate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        adminSecret: secret,
        action,
        targetId,
        value,
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || "管理操作失敗");
    }
    return data;
  };

  const action = async (kind: string, id: string, val?: boolean) => {
    try {
      if (kind === "pin") {
        await runAdminAction("pin", id, val);
      } else if (kind === "lock") {
        await runAdminAction("lock", id, val);
      } else if (kind === "del_t") {
        await runAdminAction("delete_thread", id);
      } else if (kind === "del_p") {
        await runAdminAction("delete_post", id);
      }

      setActionMsg("管理操作已完成。");
      fetchData();
    } catch (error) {
      setActionMsg(String(error));
    }

    setTimeout(() => setActionMsg(""), 3000);
  };

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 text-white">
        <div className="space-y-4 text-center">
          <div className="text-5xl">🔐</div>
          <h2 className="text-xl font-black text-white">請先登入論壇</h2>
          <p className="text-sm text-zinc-400">管理後台需要先建立論壇身分，才能驗證管理員權限。</p>
          <Link
            href="/forum/new"
            className="inline-flex rounded-xl border border-fuchsia-400/30 bg-fuchsia-400/10 px-5 py-2.5 text-sm text-fuchsia-200 transition-colors hover:bg-fuchsia-400/20"
          >
            前往論壇登入
          </Link>
        </div>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 text-white">
        <div className="w-full max-w-sm space-y-4 text-center">
          <div className="text-5xl">🛡️</div>
          <h2 className="text-xl font-black text-white">需要管理員驗證</h2>
          <p className="text-sm text-zinc-400">
            目前論壇採暱稱登入，輸入管理員密碼後會開啟本次瀏覽器工作階段的後台權限。
          </p>
          <div className="space-y-2">
            <input
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="輸入管理員密碼"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-400/50"
            />
            <button
              onClick={async () => {
                if (!secret || !user) return;
                try {
                  const res = await fetch("/api/forum/admin/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ token: user.token, adminSecret: secret }),
                  });
                  const data = await res.json();
                  if (data.profile?.role === "admin") {
                    markLocalAdmin(secret);
                    setLoginMsg(
                      data.persisted === false
                        ? "已開啟管理員工作階段，目前以本機權限模式操作後台。"
                        : "管理員驗證成功，現在可以進入後台。",
                    );
                  } else {
                    setLoginMsg(data.error || "管理員密碼錯誤");
                  }
                } catch {
                  setLoginMsg("管理員驗證失敗，請稍後再試");
                }
              }}
              className="w-full rounded-lg border border-fuchsia-400/30 bg-fuchsia-400/10 px-4 py-2 text-sm text-fuchsia-200 transition-colors hover:bg-fuchsia-400/20"
            >
              驗證管理員身分
            </button>
            {loginMsg ? <p className="text-xs text-emerald-300">{loginMsg}</p> : null}
          </div>
          <Link
            href="/forum"
            className="inline-flex rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm text-zinc-300 transition-colors hover:bg-white/10"
          >
            返回論壇
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-8 text-white md:px-6">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <span className="text-xl">🛠️</span>
              <h1 className="text-2xl font-black text-white">論壇管理後台</h1>
              <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-xs text-emerald-400">
                {user.display_name}
              </span>
            </div>
            <p className="text-sm text-zinc-400">
              管理主題、留言、檢舉與論壇規範。若你看到這頁，代表管理員驗證已通過。
            </p>
          </div>
          <Link
            href="/forum"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-300 transition-colors hover:bg-white/10"
          >
            返回論壇
          </Link>
        </header>

        {actionMsg ? (
          <div className="mb-4 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
            {actionMsg}
          </div>
        ) : null}

        <div className="mb-6 flex w-fit gap-2 rounded-2xl border border-white/10 bg-white/5 p-1">
          {Object.entries(tabLabels).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key as TabKey)}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                tab === key ? "bg-fuchsia-500/20 text-fuchsia-200" : "text-zinc-400 hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "overview" ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <StatCard label="主題數" value={threads.length} tone="fuchsia" />
              <StatCard label="留言數" value={posts.length} tone="cyan" />
              <StatCard label="置頂主題" value={threads.filter((t) => t.is_pinned).length} tone="amber" />
              <StatCard label="鎖定主題" value={threads.filter((t) => t.is_locked).length} tone="rose" />
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <h2 className="mb-4 text-base font-bold text-white">近期熱門主題</h2>
              <div className="space-y-2">
                {[...threads]
                  .sort((a, b) => b.trending_score - a.trending_score)
                  .slice(0, 5)
                  .map((thread) => (
                    <div key={thread.id} className="flex items-center gap-3 rounded-xl bg-black/20 p-3 text-sm">
                      <span className="w-12 text-xs font-bold text-fuchsia-300">
                        {thread.trending_score.toFixed(1)}
                      </span>
                      <span className="flex-1 truncate text-zinc-300">{thread.title}</span>
                      <span className="text-xs text-zinc-600">{thread.forum_slug}</span>
                      {thread.is_pinned ? <span className="text-xs text-amber-400">置頂</span> : null}
                      {thread.is_locked ? <span className="text-xs text-rose-400">鎖定</span> : null}
                    </div>
                  ))}
              </div>
            </div>
          </div>
        ) : null}

        {tab === "threads" ? (
          <div className="space-y-3">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-base font-bold text-white">主題列表，共 {threads.length} 筆</h2>
              <button
                onClick={fetchData}
                disabled={loading}
                className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"
              >
                {loading ? "更新中..." : "重新整理"}
              </button>
            </div>
            {threads.map((thread) => (
              <div key={thread.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="rounded bg-white/5 px-2 py-0.5 text-xs text-zinc-500">
                        {thread.forum_slug}
                      </span>
                      {thread.is_pinned ? <span className="text-xs text-amber-400">置頂</span> : null}
                      {thread.is_locked ? <span className="text-xs text-rose-400">鎖定</span> : null}
                    </div>
                    <p className="text-sm font-medium text-white">{thread.title}</p>
                    <div className="mt-1 flex items-center gap-3 text-xs text-zinc-500">
                      <span>{thread.author_name || "匿名"}</span>
                      <span>讚 {thread.likes_count}</span>
                      <span>回覆 {thread.replies_count}</span>
                      <span>熱度 {thread.trending_score.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-1.5">
                    <button
                      onClick={() => action("pin", thread.id, !thread.is_pinned)}
                      className={`rounded-lg border px-2.5 py-1.5 text-xs transition-colors ${
                        thread.is_pinned
                          ? "border-amber-400/40 bg-amber-400/15 text-amber-300 hover:bg-amber-400/25"
                          : "border-white/10 bg-white/5 text-zinc-400 hover:text-amber-300"
                      }`}
                    >
                      {thread.is_pinned ? "取消置頂" : "設為置頂"}
                    </button>
                    <button
                      onClick={() => action("lock", thread.id, !thread.is_locked)}
                      className={`rounded-lg border px-2.5 py-1.5 text-xs transition-colors ${
                        thread.is_locked
                          ? "border-rose-400/40 bg-rose-400/15 text-rose-300 hover:bg-rose-400/25"
                          : "border-white/10 bg-white/5 text-zinc-400 hover:text-rose-300"
                      }`}
                    >
                      {thread.is_locked ? "解除鎖定" : "鎖定主題"}
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`確定要刪除主題「${thread.title}」嗎？`)) {
                          action("del_t", thread.id);
                        }
                      }}
                      className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-zinc-400 transition-colors hover:border-rose-400/30 hover:text-rose-300"
                    >
                      刪除
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {tab === "posts" ? (
          <div className="space-y-3">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-base font-bold text-white">留言列表，共 {posts.length} 筆</h2>
              <button
                onClick={fetchData}
                disabled={loading}
                className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"
              >
                {loading ? "更新中..." : "重新整理"}
              </button>
            </div>
            {posts.map((post) => (
              <div
                key={post.id}
                className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/20 p-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2 text-xs text-zinc-500">
                    <span className="text-zinc-300">{post.author_name || "匿名"}</span>
                    <span>讚 {post.likes_count}</span>
                    <span>{new Date(post.created_at).toLocaleDateString("zh-TW")}</span>
                  </div>
                  <p className="line-clamp-2 text-sm text-zinc-300">{post.body}</p>
                </div>
                <button
                  onClick={() => {
                    if (confirm("確定要刪除此留言嗎？")) {
                      action("del_p", post.id);
                    }
                  }}
                  className="flex-shrink-0 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-zinc-400 transition-colors hover:border-rose-400/30 hover:text-rose-300"
                >
                  刪除
                </button>
              </div>
            ))}
          </div>
        ) : null}

        {tab === "reports" ? (
          <div className="space-y-3">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-base font-bold text-white">檢舉列表，共 {reports.length} 筆</h2>
              <button
                onClick={fetchData}
                disabled={loading}
                className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"
              >
                {loading ? "更新中..." : "重新整理"}
              </button>
            </div>
            {reports.length === 0 ? (
              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-6 text-center text-sm text-emerald-300">
                目前沒有待處理的檢舉。
              </div>
            ) : null}
            {reports.map((report) => (
              <div
                key={report.id}
                className={`rounded-2xl border p-4 ${
                  report.status === "pending"
                    ? "border-rose-400/20 bg-rose-500/10"
                    : "border-white/10 bg-black/20 opacity-70"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-zinc-300">
                        {report.status}
                      </span>
                      <span className="text-xs text-zinc-500">{report.target_type}</span>
                      <span className="font-mono text-xs text-zinc-600">{report.target_id?.slice(0, 8)}...</span>
                    </div>
                    <p className="text-sm text-zinc-300">{report.reason}</p>
                    <p className="mt-1 text-xs text-zinc-600">
                      {new Date(report.created_at).toLocaleString("zh-TW")}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {tab === "rules" ? (
          <div className="space-y-5">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <h2 className="mb-4 text-lg font-bold text-white">權限說明</h2>
              <div className="space-y-3 text-sm text-zinc-300">
                <p>1. 目前管理後台使用「管理員密碼 + 瀏覽器工作階段」模式。</p>
                <p>2. 這版已修正進不去後台與操作權限鏈，但資料庫結構仍需後續補齊正式 RLS。</p>
                <p>3. 若某些動作仍失敗，代表目前 Supabase 表結構或 policy 還沒完全對齊。</p>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}
