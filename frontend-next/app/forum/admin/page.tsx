"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useForumAuth } from "../../../lib/forum-auth";

const SB_URL =
  process.env.NEXT_PUBLIC_FORUM_SB_URL || "https://vxmebuygrnynxkepyunh.supabase.co";
const SB_ANON = process.env.NEXT_PUBLIC_FORUM_SB_ANON || "";

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
  reports: "檢舉處理",
  rules: "規範說明",
};

const statTone = {
  fuchsia: "border-fuchsia-400/20 bg-fuchsia-500/10 text-fuchsia-200 text-fuchsia-300/70",
  cyan: "border-cyan-400/20 bg-cyan-500/10 text-cyan-200 text-cyan-300/70",
  amber: "border-amber-400/20 bg-amber-500/10 text-amber-200 text-amber-300/70",
  rose: "border-rose-400/20 bg-rose-500/10 text-rose-200 text-rose-300/70",
} as const;

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone: keyof typeof statTone;
}) {
  const [cardClass, valueClass, labelClass] = statTone[tone].split(" ");
  return (
    <div className={`rounded-2xl border p-5 ${cardClass}`}>
      <div className={`mb-2 text-xs uppercase tracking-widest ${labelClass}`}>{label}</div>
      <div className={`text-3xl font-black ${valueClass}`}>{value}</div>
    </div>
  );
}

export default function ForumAdminPage() {
  const { user, refreshProfile } = useForumAuth();
  const [tab, setTab] = useState<TabKey>("overview");
  const [threads, setThreads] = useState<ThreadRow[]>([]);
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState("");
  const [secret, setSecret] = useState("");
  const [loginMsg, setLoginMsg] = useState("");

  const isAdmin = user?.role === "admin";

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
          .then((res) => res.json())
          .catch(() => []),
      ]);

      if (Array.isArray(threadRows)) setThreads(threadRows);
      if (Array.isArray(postRows)) setPosts(postRows);
      if (Array.isArray(reportRows)) setReports(reportRows);
    } catch {
      setActionMsg("讀取論壇資料失敗，請稍後再試。");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) fetchData();
  }, [isAdmin, tab]);

  const action = async (type: string, id: string, val?: boolean) => {
    if (!user?.token) return;

    const headers = {
      apikey: SB_ANON,
      Authorization: `Bearer ${user.token}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    };

    try {
      if (type === "pin") {
        await fetch(`${SB_URL}/rest/v1/threads?id=eq.${id}`, {
          method: "PATCH",
          headers,
          body: JSON.stringify({ is_pinned: val }),
        });
      }
      if (type === "lock") {
        await fetch(`${SB_URL}/rest/v1/threads?id=eq.${id}`, {
          method: "PATCH",
          headers,
          body: JSON.stringify({ is_locked: val }),
        });
      }
      if (type === "del_t") {
        await fetch(`${SB_URL}/rest/v1/threads?id=eq.${id}`, {
          method: "DELETE",
          headers,
        });
      }
      if (type === "del_p") {
        await fetch(`${SB_URL}/rest/v1/posts?id=eq.${id}`, {
          method: "DELETE",
          headers,
        });
      }

      setActionMsg(`操作已完成：${id.slice(0, 8)}`);
      fetchData();
    } catch (error) {
      setActionMsg(`操作失敗：${String(error)}`);
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
          <h2 className="text-xl font-black text-white">需要管理員授權</h2>
          <p className="text-sm text-zinc-400">
            你已登入論壇，但目前還不是管理員。輸入管理員密碼後，會立刻升級目前帳號權限。
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
                    setLoginMsg("管理員驗證成功，正在刷新權限。");
                    await refreshProfile();
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
            <p className="text-sm text-zinc-400">管理主題、留言、檢舉與論壇規範。</p>
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

            <div className="rounded-3xl border border-violet-400/20 bg-violet-500/10 p-5">
              <h2 className="mb-3 text-base font-bold text-violet-200">管理操作建議</h2>
              <div className="space-y-2 text-sm text-zinc-300">
                <p>先處理待檢舉內容，再針對高風險主題進行鎖定或刪除。</p>
                <p>熱門主題可視情況置頂，維持首頁與各看板的資訊品質。</p>
                <p>若要長期管理規則，建議把 SOP 另存到 Notion 供團隊共享。</p>
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
            {threads.length === 0 && !loading ? (
              <div className="py-12 text-center text-sm text-zinc-500">目前還沒有可管理的主題資料。</div>
            ) : null}
            {threads.map((thread) => (
              <div key={thread.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="rounded px-2 py-0.5 text-xs text-zinc-500 bg-white/5">
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
                        if (confirm(`確定要刪除主題「${thread.title}」嗎？`)) action("del_t", thread.id);
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
            {posts.length === 0 && !loading ? (
              <div className="py-12 text-center text-sm text-zinc-500">目前沒有可管理的留言資料。</div>
            ) : null}
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
                    if (confirm("確定要刪除此留言嗎？")) action("del_p", post.id);
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
            {reports.length === 0 && !loading ? (
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
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          report.status === "pending"
                            ? "border border-rose-500/30 bg-rose-500/20 text-rose-300"
                            : "border border-white/10 bg-white/5 text-zinc-500"
                        }`}
                      >
                        {report.status === "pending"
                          ? "待處理"
                          : report.status === "reviewed"
                            ? "已審核"
                            : "已結案"}
                      </span>
                      <span className="text-xs text-zinc-500">{report.target_type}</span>
                      <span className="font-mono text-xs text-zinc-600">
                        {report.target_id?.slice(0, 8)}...
                      </span>
                    </div>
                    <p className="text-sm text-zinc-300">{report.reason}</p>
                    <p className="mt-1 text-xs text-zinc-600">
                      {new Date(report.created_at).toLocaleString("zh-TW")}
                    </p>
                  </div>
                  {report.status === "pending" ? (
                    <div className="flex flex-shrink-0 gap-1.5">
                      <button
                        onClick={() => action("del_t", report.target_id)}
                        className="rounded-lg border border-rose-400/30 bg-rose-400/10 px-2.5 py-1.5 text-xs text-rose-300 transition-colors hover:bg-rose-400/20"
                      >
                        刪除內容
                      </button>
                      <button
                        onClick={async () => {
                          await fetch("/api/forum/reports", {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              report_id: report.id,
                              status: "dismissed",
                              token: user?.token,
                            }),
                          });
                          fetchData();
                        }}
                        className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-zinc-400 transition-colors hover:text-zinc-200"
                      >
                        忽略
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {tab === "rules" ? (
          <div className="space-y-5">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <h2 className="mb-4 text-lg font-bold text-white">權限分工</h2>
              <div className="space-y-3">
                <div className="rounded-xl border border-rose-400/15 bg-rose-500/8 p-4">
                  <div className="mb-1 text-xs font-bold text-rose-300">admin</div>
                  <div className="text-xs text-zinc-400">
                    可驗證管理員身分、刪除主題與留言、置頂、鎖定、處理檢舉與維護論壇規範。
                  </div>
                </div>
                <div className="rounded-xl border border-amber-400/15 bg-amber-500/8 p-4">
                  <div className="mb-1 text-xs font-bold text-amber-300">moderator</div>
                  <div className="text-xs text-zinc-400">
                    可協助日常巡檢、整理看板、處理基本違規內容，必要時升級交由管理員判斷。
                  </div>
                </div>
                <div className="rounded-xl border border-cyan-400/15 bg-cyan-500/8 p-4">
                  <div className="mb-1 text-xs font-bold text-cyan-300">user</div>
                  <div className="text-xs text-zinc-400">
                    可使用訪客名稱發文、回覆與參與討論，但沒有管理功能。
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <h2 className="mb-4 text-lg font-bold text-white">處理建議</h2>
              <div className="space-y-2 text-sm text-zinc-300">
                <p>1. 先看檢舉，再看熱門主題，能更快處理高風險內容。</p>
                <p>2. 對於公告、票務與重大活動資訊，可暫時設為置頂。</p>
                <p>3. 若討論偏離主題或出現爭議升高，可先鎖定主題避免延燒。</p>
                <p>4. 若要長期保存 SOP，建議同步整理到團隊 Notion。</p>
              </div>
            </div>

            <div className="rounded-3xl border border-violet-400/20 bg-violet-500/10 p-5">
              <h2 className="mb-2 text-base font-bold text-violet-200">管理規範文件</h2>
              <p className="text-sm text-zinc-300">
                若你有更完整的審核流程或黑名單規則，可以再整理進 Notion，方便後續維運。
              </p>
              <a
                href="https://www.notion.so/3361d2ea9f1281b39042d1a58f955440"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-2 rounded-xl border border-violet-400/30 bg-violet-400/10 px-4 py-2 text-sm text-violet-200 transition-colors hover:bg-violet-400/20"
              >
                開啟 Notion 管理規範
              </a>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}
