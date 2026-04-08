"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useForumAuth } from "../../../lib/forum-auth";

const SB_URL = process.env.NEXT_PUBLIC_FORUM_SB_URL || "https://vxmebuygrnynxkepyunh.supabase.co";
const SB_ANON = process.env.NEXT_PUBLIC_FORUM_SB_ANON || "";

type ThreadRow = { id: string; title: string; forum_slug: string; author_name: string; likes_count: number; replies_count: number; trending_score: number; is_pinned: boolean; is_locked: boolean; created_at: string; };
type PostRow   = { id: string; thread_id: string; author_name: string; body: string; likes_count: number; created_at: string; };

function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className={`rounded-2xl border border-${color}-400/20 bg-${color}-500/10 p-5`}>
      <div className={`text-xs uppercase tracking-widest text-${color}-300/70 mb-2`}>{label}</div>
      <div className={`text-3xl font-black text-${color}-200`}>{value}</div>
    </div>
  );
}

export default function ForumAdminPage() {
  const { user, signOut } = useForumAuth();
  const [tab, setTab] = useState<"overview"|"threads"|"posts"|"rules">("overview");
  const [threads, setThreads] = useState<ThreadRow[]>([]);
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [reports, setReports] = useState<{id:string;target_type:string;target_id:string;reason:string;status:string;created_at:string;reporter_id:string}[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState("");

  const ADMIN_TOKEN = process.env.NEXT_PUBLIC_ADMIN_TOKEN || "idol-admin-2026";
  // 從 localStorage 取得 admin token 並比對
  const storedToken = typeof window !== "undefined" ? localStorage.getItem("forum_admin_token") : null;
  const isAdmin = !!(user && storedToken && storedToken === ADMIN_TOKEN);

  // Auth guard — 未登入或非管理員顯示拒絕畫面
  if (!user) return (
    <main className="min-h-screen text-white flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="text-5xl">🔐</div>
        <h2 className="text-xl font-black text-white">請先登入</h2>
        <p className="text-sm text-zinc-400">管理後台需要登入才能存取</p>
        <a href="/forum/new" className="inline-flex rounded-xl border border-fuchsia-400/30 bg-fuchsia-400/10 px-5 py-2.5 text-sm text-fuchsia-200 hover:bg-fuchsia-400/20 transition-colors">
          前往登入
        </a>
      </div>
    </main>
  );

  if (!isAdmin) return (
    <main className="min-h-screen text-white flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="text-5xl">🚫</div>
        <h2 className="text-xl font-black text-white">權限不足</h2>
        <p className="text-sm text-zinc-400">你的帳號沒有管理員權限</p>
        <a href="/forum" className="inline-flex rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm text-zinc-300 hover:bg-white/10 transition-colors">
          返回論壇
        </a>
      </div>
    </main>
  );

  const fetchData = async () => {
    setLoading(true);
    try {
      const H = { apikey: SB_ANON, Accept: "application/json" };
      const [tr, pr] = await Promise.all([
        fetch(`${SB_URL}/rest/v1/threads?select=*&order=created_at.desc&limit=30`, { headers: H }).then(r => r.json()),
        fetch(`${SB_URL}/rest/v1/posts?select=*&order=created_at.desc&limit=30`, { headers: H }).then(r => r.json()),
      ]);
      if (Array.isArray(tr)) setThreads(tr);
      if (Array.isArray(pr)) setPosts(pr);
      // 取舉報列表
      if (user?.token) {
        const rr = await fetch(`${SB_URL}/rest/v1/reports?order=created_at.desc&limit=50`, {
          headers: { apikey: SB_ANON, Accept: "application/json" }
        }).then(r2=>r2.json()).catch(()=>[]);
        if (Array.isArray(rr)) setReports(rr);
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => { if (tab === "threads" || tab === "posts" || tab === "overview") fetchData(); }, [tab]);

  const action = async (type: string, id: string, val?: boolean) => {
    if (!user?.token) return;
    const H = { apikey: SB_ANON, Authorization: `Bearer ${user.token}`, "Content-Type": "application/json", "Prefer": "return=minimal" };
    try {
      if (type === "pin")    await fetch(`${SB_URL}/rest/v1/threads?id=eq.${id}`, { method: "PATCH", headers: H, body: JSON.stringify({ is_pinned: val }) });
      if (type === "lock")   await fetch(`${SB_URL}/rest/v1/threads?id=eq.${id}`, { method: "PATCH", headers: H, body: JSON.stringify({ is_locked: val }) });
      if (type === "del_t")  await fetch(`${SB_URL}/rest/v1/threads?id=eq.${id}`, { method: "DELETE", headers: H });
      if (type === "del_p")  await fetch(`${SB_URL}/rest/v1/posts?id=eq.${id}`,   { method: "DELETE", headers: H });
      setActionMsg(`✅ 操作完成：${type} ${id.substring(0,8)}`);
      fetchData();
    } catch (e) { setActionMsg(`❌ 操作失敗：${String(e)}`); }
    setTimeout(() => setActionMsg(""), 3000);
  };

  const TABS = [
    { key: "overview", label: "📊 總覽" },
    { key: "threads",  label: "💬 討論串" },
    { key: "posts",    label: "📝 回覆" },
    { key: "reports",  label: "🚨 舉報" },
    { key: "rules",    label: "📋 管理規範" },
  ] as const;

  return (
    <main className="min-h-screen text-white">
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
        {/* Header */}
        <header className="mb-8 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">🛡️</span>
              <h1 className="text-2xl font-black text-white">論壇管理後台</h1>
              {user ? (
                <span className="text-xs text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded-full px-2 py-0.5">
                  {user.display_name}
                </span>
              ) : (
                <span className="text-xs text-rose-400 bg-rose-400/10 border border-rose-400/20 rounded-full px-2 py-0.5">未登入</span>
              )}
            </div>
            <p className="text-sm text-zinc-400">管理討論串、回覆與用戶</p>
          </div>
          <Link href="/forum" className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-300 hover:bg-white/10 transition-colors">
            ← 返回論壇
          </Link>
        </header>

        {/* Action message */}
        {actionMsg && (
          <div className="mb-4 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
            {actionMsg}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 rounded-2xl border border-white/10 bg-white/5 p-1 w-fit mb-6">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${tab === t.key ? "bg-fuchsia-500/20 text-fuchsia-200" : "text-zinc-400 hover:text-white"}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Overview */}
        {tab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard label="討論串總數" value={threads.length} color="fuchsia" />
              <StatCard label="回覆總數" value={posts.length} color="cyan" />
              <StatCard label="置頂串數" value={threads.filter(t=>t.is_pinned).length} color="amber" />
              <StatCard label="鎖定串數" value={threads.filter(t=>t.is_locked).length} color="rose" />
            </div>
            {/* Top threads */}
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <h2 className="text-base font-bold text-white mb-4">🔥 最高熱度討論串</h2>
              <div className="space-y-2">
                {[...threads].sort((a,b)=>b.trending_score-a.trending_score).slice(0,5).map(t=>(
                  <div key={t.id} className="flex items-center gap-3 rounded-xl bg-black/20 p-3 text-sm">
                    <span className="text-fuchsia-300 font-bold w-12 text-xs">{t.trending_score.toFixed(1)}</span>
                    <span className="flex-1 text-zinc-300 truncate">{t.title}</span>
                    <span className="text-zinc-600 text-xs">{t.forum_slug}</span>
                    {t.is_pinned && <span className="text-amber-400 text-xs">📌</span>}
                    {t.is_locked && <span className="text-rose-400 text-xs">🔒</span>}
                  </div>
                ))}
              </div>
            </div>
            {/* Quick SQL tips */}
            <div className="rounded-3xl border border-violet-400/20 bg-violet-500/10 p-5">
              <h2 className="text-base font-bold text-violet-200 mb-3">🔧 Supabase 快速操作</h2>
              <div className="space-y-2 font-mono text-xs text-zinc-300">
                <p className="text-zinc-500">-- 更新 trending score（在 Supabase SQL Editor 執行）</p>
                <p>SELECT compute_trending_scores();</p>
                <p className="text-zinc-500 mt-2">-- 封鎖用戶</p>
                <p>UPDATE user_profiles SET role = 'banned' WHERE id = '&lt;user_id&gt;';</p>
                <p className="text-zinc-500 mt-2">-- 清除舊的低熱度討論串</p>
                <p>DELETE FROM threads WHERE trending_score &lt; 0.1 AND created_at &lt; now() - interval '30 days';</p>
              </div>
            </div>
          </div>
        )}

        {/* Threads */}
        {tab === "threads" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base font-bold text-white">最新討論串（{threads.length} 筆）</h2>
              <button onClick={fetchData} disabled={loading} className="text-xs text-zinc-400 hover:text-white border border-white/10 rounded-lg px-3 py-1.5 hover:bg-white/5 transition-colors">
                {loading ? "載入中..." : "⟳ 重新整理"}
              </button>
            </div>
            {threads.length === 0 && !loading && (
              <div className="text-center py-12 text-zinc-500 text-sm">尚無討論串資料（Supabase forum schema 可能尚未建立）</div>
            )}
            {threads.map(t => (
              <div key={t.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-zinc-500 bg-white/5 rounded px-2 py-0.5">{t.forum_slug}</span>
                      {t.is_pinned && <span className="text-xs text-amber-400">📌 置頂</span>}
                      {t.is_locked && <span className="text-xs text-rose-400">🔒 鎖定</span>}
                    </div>
                    <p className="text-sm font-medium text-white">{t.title}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500">
                      <span>{t.author_name || "匿名"}</span>
                      <span>♥ {t.likes_count}</span>
                      <span>💬 {t.replies_count}</span>
                      <span>🔥 {t.trending_score.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button onClick={() => action("pin", t.id, !t.is_pinned)}
                      className={`text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${t.is_pinned ? "border-amber-400/40 bg-amber-400/15 text-amber-300 hover:bg-amber-400/25" : "border-white/10 bg-white/5 text-zinc-400 hover:text-amber-300"}`}>
                      {t.is_pinned ? "取消置頂" : "📌 置頂"}
                    </button>
                    <button onClick={() => action("lock", t.id, !t.is_locked)}
                      className={`text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${t.is_locked ? "border-rose-400/40 bg-rose-400/15 text-rose-300 hover:bg-rose-400/25" : "border-white/10 bg-white/5 text-zinc-400 hover:text-rose-300"}`}>
                      {t.is_locked ? "解鎖" : "🔒 鎖定"}
                    </button>
                    <button onClick={() => { if(confirm(`確定刪除「${t.title}」？`)) action("del_t", t.id); }}
                      className="text-xs px-2.5 py-1.5 rounded-lg border border-white/10 bg-white/5 text-zinc-400 hover:text-rose-300 hover:border-rose-400/30 transition-colors">
                      🗑 刪除
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Posts */}
        {tab === "posts" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base font-bold text-white">最新回覆（{posts.length} 筆）</h2>
              <button onClick={fetchData} disabled={loading} className="text-xs text-zinc-400 hover:text-white border border-white/10 rounded-lg px-3 py-1.5 hover:bg-white/5 transition-colors">
                {loading ? "載入中..." : "⟳ 重新整理"}
              </button>
            </div>
            {posts.length === 0 && !loading && (
              <div className="text-center py-12 text-zinc-500 text-sm">尚無回覆資料</div>
            )}
            {posts.map(p => (
              <div key={p.id} className="rounded-2xl border border-white/10 bg-black/20 p-4 flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1 text-xs text-zinc-500">
                    <span className="text-zinc-300">{p.author_name || "匿名"}</span>
                    <span>♥ {p.likes_count}</span>
                    <span className="text-zinc-600">{new Date(p.created_at).toLocaleDateString("zh-TW")}</span>
                  </div>
                  <p className="text-sm text-zinc-300 line-clamp-2">{p.body}</p>
                </div>
                <button onClick={() => { if(confirm("確定刪除此回覆？")) action("del_p", p.id); }}
                  className="flex-shrink-0 text-xs px-2.5 py-1.5 rounded-lg border border-white/10 bg-white/5 text-zinc-400 hover:text-rose-300 hover:border-rose-400/30 transition-colors">
                  🗑 刪除
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Reports */}
        {tab === "reports" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base font-bold text-white">舉報列表（{reports.length} 筆）</h2>
              <button onClick={fetchData} disabled={loading} className="text-xs text-zinc-400 hover:text-white border border-white/10 rounded-lg px-3 py-1.5 hover:bg-white/5 transition-colors">
                {loading ? "載入中..." : "⟳ 重新整理"}
              </button>
            </div>
            {reports.length === 0 && !loading && (
              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-6 text-center text-sm text-emerald-300">
                ✅ 目前沒有待處理的舉報
              </div>
            )}
            {reports.map(rep => (
              <div key={rep.id} className={`rounded-2xl border p-4 ${rep.status==='pending' ? 'border-rose-400/20 bg-rose-500/10' : 'border-white/10 bg-black/20 opacity-60'}`}>
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-semibold rounded-full px-2 py-0.5 ${rep.status==='pending' ? 'text-rose-300 bg-rose-500/20 border border-rose-500/30' : 'text-zinc-500 bg-white/5 border border-white/10'}`}>
                        {rep.status==='pending' ? '⚠️ 待審核' : rep.status==='reviewed' ? '✅ 已處理' : '🚫 已駁回'}
                      </span>
                      <span className="text-xs text-zinc-500">{rep.target_type}</span>
                      <span className="text-xs text-zinc-600 font-mono">{rep.target_id?.substring(0,8)}...</span>
                    </div>
                    <p className="text-sm text-zinc-300">{rep.reason}</p>
                    <p className="text-xs text-zinc-600 mt-1">{new Date(rep.created_at).toLocaleString("zh-TW")}</p>
                  </div>
                  {rep.status === 'pending' && (
                    <div className="flex gap-1.5 flex-shrink-0">
                      <button onClick={() => action("del_t", rep.target_id)}
                        className="text-xs px-2.5 py-1.5 rounded-lg border border-rose-400/30 bg-rose-400/10 text-rose-300 hover:bg-rose-400/20 transition-colors">
                        刪除內容
                      </button>
                      <button onClick={async () => {
                        await fetch('/api/forum/reports', {method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({report_id:rep.id, status:'dismissed', token:user?.token})});
                        fetchData();
                      }} className="text-xs px-2.5 py-1.5 rounded-lg border border-white/10 bg-white/5 text-zinc-400 hover:text-zinc-200 transition-colors">
                        駁回
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Rules */}
        {tab === "rules" && (
          <div className="space-y-5">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-lg font-bold text-white mb-4">角色與權限</h2>
              <div className="space-y-3">
                {[
                  { role: "admin", color: "rose", perms: "全部 — 刪文、封鎖用戶、調整版區、修改設定" },
                  { role: "moderator", color: "amber", perms: "部分 — 刪文、隱藏貼文、標記違規、查看舉報" },
                  { role: "user", color: "cyan", perms: "基本 — 發文、回覆、按讚" },
                ].map(({role, color, perms}) => (
                  <div key={role} className={`flex items-start gap-3 rounded-xl border border-${color}-400/15 bg-${color}-500/8 p-4`}>
                    <span className={`text-xs font-mono font-bold text-${color}-300 w-24 flex-shrink-0`}>{role}</span>
                    <span className="text-xs text-zinc-400">{perms}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-lg font-bold text-white mb-4">違規處理流程</h2>
              <div className="space-y-2 text-sm text-zinc-300">
                {[
                  ["1️⃣", "用戶舉報 → moderator 審核（24h 內）"],
                  ["2️⃣", "判定違規 → 隱藏貼文 + 警告"],
                  ["3️⃣", "累計 3 次警告 → 暫停發言 7 天"],
                  ["4️⃣", "再次違規 → 永久封鎖帳號"],
                  ["🚨", "嚴重違規（侵隱私、非法） → 立即封鎖 + 回報"],
                ].map(([icon, text]) => (
                  <div key={text} className="flex items-start gap-3 py-2 border-b border-white/5 last:border-0">
                    <span className="flex-shrink-0">{icon}</span>
                    <span>{text}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-3xl border border-violet-400/20 bg-violet-500/10 p-5">
              <h2 className="text-base font-bold text-violet-200 mb-2">📖 完整管理規範</h2>
              <p className="text-sm text-zinc-300">詳細版規、版區專屬規則與管理員操作 SOP 請參考 Notion 後台。</p>
              <a href="https://www.notion.so/3361d2ea9f1281b39042d1a58f955440" target="_blank" rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-2 rounded-xl border border-violet-400/30 bg-violet-400/10 px-4 py-2 text-sm text-violet-200 hover:bg-violet-400/20 transition-colors">
                Notion 管理規範 →
              </a>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
