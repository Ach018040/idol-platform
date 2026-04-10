"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useForumAuth } from "../../../../lib/forum-auth";
import { roleBadgeColor, roleLabel, type UserProfile } from "../../../../lib/user-role";

export default function ProfilePage({ params }: { params: { token: string } }) {
  const { user } = useForumAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [threads, setThreads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const isSelf = user?.token === params.token;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/user?token=${params.token}`);
        const data = await res.json();
        setProfile(data.profile);
      } catch { setProfile(null); }
      setLoading(false);
    };
    load();
  }, [params.token]);

  if (loading) return (
    <main className="min-h-screen text-white">
      <div className="mx-auto max-w-2xl px-4 py-12 animate-pulse space-y-4">
        <div className="h-24 bg-white/5 rounded-3xl"/>
        <div className="h-40 bg-white/5 rounded-3xl"/>
      </div>
    </main>
  );

  if (!profile) return (
    <main className="min-h-screen text-white flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-4">👤</div>
        <p className="text-zinc-400">找不到這個用戶</p>
        <Link href="/forum" className="mt-4 inline-block text-fuchsia-400 hover:text-fuchsia-300">← 返回論壇</Link>
      </div>
    </main>
  );

  const avatarChar = [...profile.display_name][0] || "?";

  return (
    <main className="min-h-screen text-white">
      <div className="mx-auto max-w-2xl px-4 py-8 md:px-6">
        {/* Banner + Avatar */}
        <div className="rounded-3xl overflow-hidden border border-white/10 mb-6">
          <div className="h-24 w-full" style={{ background: profile.banner_color || "#7c3aed" }}/>
          <div className="bg-black/40 px-6 pb-6">
            <div className="-mt-10 flex items-end gap-4 mb-4">
              <div className="w-20 h-20 rounded-2xl border-4 border-black/40 flex items-center justify-center text-3xl font-black text-white"
                style={{ background: profile.banner_color || "#7c3aed" }}>
                {avatarChar}
              </div>
              <div className="pb-2 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-black text-white">{profile.display_name}</h1>
                  <span className={`text-xs font-semibold border rounded-full px-2 py-0.5 ${roleBadgeColor(profile.role)} border-current/30`}>
                    {roleLabel(profile.role)}
                  </span>
                  {profile.is_banned && <span className="text-xs text-rose-400 border border-rose-400/30 rounded-full px-2 py-0.5">封禁中</span>}
                </div>
                <p className="text-xs text-zinc-500 mt-0.5">加入於 {new Date(profile.created_at).toLocaleDateString("zh-TW")}</p>
              </div>
              {isSelf && (
                <Link href="/profile/edit" className="pb-2 rounded-xl border border-white/20 bg-white/5 px-4 py-1.5 text-sm text-zinc-300 hover:bg-white/10 transition-colors">
                  ✏️ 編輯資料
                </Link>
              )}
            </div>
            {profile.bio && <p className="text-sm text-zinc-300 leading-relaxed">{profile.bio}</p>}
            {!profile.bio && isSelf && (
              <p className="text-sm text-zinc-600 italic">尚未填寫個人簡介。<Link href="/profile/edit" className="text-fuchsia-400 hover:text-fuchsia-300">立即填寫</Link></p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[["發文數", profile.post_count || 0, "💬"], ["角色", roleLabel(profile.role), "🎭"], ["狀態", profile.is_banned ? "封禁中" : "正常", profile.is_banned ? "🚫" : "✅"]].map(([label, val, icon]) => (
            <div key={label as string} className="rounded-2xl border border-white/10 bg-black/20 p-4 text-center">
              <div className="text-xl mb-1">{icon}</div>
              <div className="text-lg font-black text-white">{val}</div>
              <div className="text-xs text-zinc-500">{label}</div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Link href="/forum" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">← 返回論壇</Link>
        </div>
      </div>
    </main>
  );
}
