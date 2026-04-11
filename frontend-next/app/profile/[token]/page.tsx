"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useForumAuth } from "../../../lib/forum-auth";
import { roleBadgeColor, roleLabel, canModerate, type UserProfile } from "../../../lib/user-role";

export default function ProfilePage({ params }: { params: { token: string } }) {
  const { user } = useForumAuth();
  const [profile, setProfile] = useState<UserProfile|null>(null);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState("");
  const isSelf = user?.token === params.token;
  const canMod = user?.role ? canModerate(user.role as any) : false;

  useEffect(() => {
    setLoading(true);
    fetch(`/api/user?token=${params.token}`).then(r=>r.json()).then(d=>{setProfile(d.profile||null);setLoading(false);}).catch(()=>setLoading(false));
  }, [params.token]);

  const doAction = async (action: string, extra: Record<string, unknown> = {}) => {
    if (!user) return;
    setActionMsg("");
    const res = await fetch("/api/user", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ admin_token: user.token, target_token: params.token, action, ...extra }) });
    const d = await res.json();
    if (res.ok) { setProfile(d.profile); setActionMsg("操作成功 ✅"); }
    else setActionMsg(d.error || "操作失敗");
  };

  if (loading) return (<main className="min-h-screen text-white"><div className="mx-auto max-w-2xl px-4 py-12 animate-pulse space-y-4"><div className="h-24 bg-white/5 rounded-3xl"/><div className="h-40 bg-white/5 rounded-3xl"/></div></main>);
  if (!profile) return (<main className="min-h-screen text-white flex items-center justify-center"><div className="text-center"><div className="text-4xl mb-4">👤</div><p className="text-zinc-400">找不到這個用戶</p><Link href="/forum" className="mt-4 inline-block text-fuchsia-400 hover:text-fuchsia-300">← 返回論壇</Link></div></main>);

  return (
    <main className="min-h-screen text-white">
      <div className="mx-auto max-w-2xl px-4 py-8 md:px-6">
        <div className="rounded-3xl overflow-hidden border border-white/10 mb-6">
          <div className="h-24 w-full" style={{ background: profile.banner_color || "#7c3aed" }}/>
          <div className="bg-black/40 px-6 pb-6">
            <div className="-mt-10 flex items-end gap-4 mb-4">
              <div className="w-20 h-20 rounded-2xl border-4 border-black/40 flex items-center justify-center text-3xl font-black text-white" style={{ background: profile.banner_color || "#7c3aed" }}>
                {[...profile.display_name][0]}
              </div>
              <div className="pb-2 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-black text-white">{profile.display_name}</h1>
                  <span className={`text-xs font-semibold border rounded-full px-2 py-0.5 ${roleBadgeColor(profile.role)} border-current/30`}>{roleLabel(profile.role)}</span>
                  {profile.is_banned && <span className="text-xs text-rose-400 border border-rose-400/30 rounded-full px-2 py-0.5">封禁中</span>}
                </div>
                <p className="text-xs text-zinc-500 mt-0.5">加入於 {new Date(profile.created_at).toLocaleDateString("zh-TW")}</p>
              </div>
              {isSelf && <Link href="/profile/edit" className="pb-2 rounded-xl border border-white/20 bg-white/5 px-3 py-1.5 text-sm text-zinc-300 hover:bg-white/10 transition-colors">✏️ 編輯</Link>}
            </div>
            {profile.bio ? <p className="text-sm text-zinc-300 leading-relaxed">{profile.bio}</p> : isSelf && <p className="text-sm text-zinc-600 italic">尚未填寫個人簡介。<Link href="/profile/edit" className="text-fuchsia-400 hover:text-fuchsia-300">立即填寫</Link></p>}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          {[["發文數", profile.post_count||0, "💬"],["角色", roleLabel(profile.role), "🎭"],["狀態", profile.is_banned?"封禁中":"正常", profile.is_banned?"🚫":"✅"]].map(([l,v,i])=>(
            <div key={l as string} className="rounded-2xl border border-white/10 bg-black/20 p-4 text-center">
              <div className="text-xl mb-1">{i}</div><div className="text-lg font-black text-white">{v}</div><div className="text-xs text-zinc-500">{l}</div>
            </div>
          ))}
        </div>

        {/* 版主/管理員操作 */}
        {canMod && !isSelf && (
          <div className="rounded-2xl border border-amber-400/20 bg-amber-500/5 p-4 mb-4">
            <h3 className="text-sm font-semibold text-amber-400 mb-3">🛡️ 管理操作</h3>
            {actionMsg && <p className="text-xs text-emerald-400 mb-3">{actionMsg}</p>}
            <div className="flex gap-2 flex-wrap">
              {user?.role === "admin" && <>
                <button onClick={()=>doAction("set_role",{role:"moderator"})} className="rounded-lg border border-blue-400/30 bg-blue-400/10 px-3 py-1.5 text-xs text-blue-300 hover:bg-blue-400/20 transition-colors">設為版主</button>
                <button onClick={()=>doAction("set_role",{role:"user"})} className="rounded-lg border border-zinc-400/30 bg-zinc-400/10 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-400/20 transition-colors">移除版主</button>
              </>}
              {!profile.is_banned
                ? <button onClick={()=>doAction("ban",{hours:24})} className="rounded-lg border border-rose-400/30 bg-rose-400/10 px-3 py-1.5 text-xs text-rose-300 hover:bg-rose-400/20 transition-colors">封禁24小時</button>
                : <button onClick={()=>doAction("unban")} className="rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-xs text-emerald-300 hover:bg-emerald-400/20 transition-colors">解除封禁</button>
              }
            </div>
          </div>
        )}
        <div className="text-center"><Link href="/forum" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">← 返回論壇</Link></div>
      </div>
    </main>
  );
}
