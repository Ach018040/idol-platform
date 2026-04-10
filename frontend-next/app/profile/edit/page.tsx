"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForumAuth } from "../../../../lib/forum-auth";
import type { UserProfile } from "../../../../lib/user-role";

const COLORS = ["#7c3aed","#db2777","#dc2626","#ea580c","#ca8a04","#16a34a","#0891b2","#2563eb","#7e22ce","#be185d"];

export default function EditProfilePage() {
  const { user, refreshProfile, loading } = useForumAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile|null>(null);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [bannerColor, setBannerColor] = useState("#7c3aed");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && !user) { router.push("/forum/new"); return; }
    if (user) {
      fetch(`/api/user?token=${user.token}`).then(r=>r.json()).then(d=>{
        if (d.profile) {
          setProfile(d.profile);
          setDisplayName(d.profile.display_name || user.display_name);
          setBio(d.profile.bio || "");
          setBannerColor(d.profile.banner_color || "#7c3aed");
        } else {
          setDisplayName(user.display_name);
        }
      }).catch(()=>setDisplayName(user.display_name));
    }
  }, [user, loading, router]);

  const save = async () => {
    if (!user) return;
    if (!displayName.trim()) { setError("暱稱不能為空"); return; }
    setSaving(true); setError(""); setSaved(false);
    try {
      const res = await fetch("/api/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: user.token, display_name: displayName.trim(), bio, banner_color: bannerColor })
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "儲存失敗");
      await refreshProfile();
      setSaved(true);
      setTimeout(() => router.push(`/profile/${user.token}`), 1000);
    } catch(e) { setError(String(e)); }
    finally { setSaving(false); }
  };

  const avatarChar = displayName ? [...displayName][0] : "?";

  if (loading || !user) return (
    <main className="min-h-screen text-white flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-2 border-fuchsia-400 border-t-transparent rounded-full"/>
    </main>
  );

  return (
    <main className="min-h-screen text-white">
      <div className="mx-auto max-w-xl px-4 py-8 md:px-6">
        <h1 className="text-2xl font-black text-white mb-6">✏️ 編輯個人資料</h1>

        {/* Preview */}
        <div className="rounded-3xl overflow-hidden border border-white/10 mb-6">
          <div className="h-16 w-full transition-colors" style={{ background: bannerColor }}/>
          <div className="bg-black/40 px-5 pb-5">
            <div className="-mt-8 flex items-center gap-3 mb-3">
              <div className="w-16 h-16 rounded-xl border-4 border-black/40 flex items-center justify-center text-2xl font-black text-white transition-colors"
                style={{ background: bannerColor }}>{avatarChar}</div>
              <div>
                <div className="font-black text-white">{displayName || "你的名稱"}</div>
                <div className="text-xs text-zinc-500">{bio || "個人簡介..."}</div>
              </div>
            </div>
          </div>
        </div>

        {/* 表單 */}
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-zinc-300 mb-2">暱稱 *</label>
            <input value={displayName} onChange={e=>setDisplayName(e.target.value)} maxLength={20}
              className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-fuchsia-400/50 transition-colors"
              placeholder="輸入你的暱稱（最多20字）"/>
            <p className="mt-1 text-xs text-zinc-600 text-right">{displayName.length}/20</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-zinc-300 mb-2">個人簡介</label>
            <textarea value={bio} onChange={e=>setBio(e.target.value)} maxLength={120} rows={3}
              className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-zinc-200 placeholder-zinc-600 resize-none focus:outline-none focus:border-fuchsia-400/50 transition-colors"
              placeholder="介紹自己（最多120字）"/>
            <p className="mt-1 text-xs text-zinc-600 text-right">{bio.length}/120</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-zinc-300 mb-3">橫幅顏色</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map(c => (
                <button key={c} onClick={() => setBannerColor(c)}
                  className={`w-8 h-8 rounded-lg border-2 transition-all ${bannerColor===c ? "border-white scale-110" : "border-transparent"}`}
                  style={{ background: c }}/>
              ))}
            </div>
          </div>

          {error && <p className="text-xs text-rose-400 bg-rose-400/10 rounded-xl px-4 py-3">{error}</p>}
          {saved && <p className="text-xs text-emerald-400 bg-emerald-400/10 rounded-xl px-4 py-3">✅ 儲存成功！正在跳轉...</p>}

          <div className="flex gap-3 pt-2">
            <button onClick={save} disabled={saving || !displayName.trim()}
              className="flex-1 rounded-xl border border-fuchsia-400/30 bg-fuchsia-400/10 px-5 py-3 text-sm font-semibold text-fuchsia-200 hover:bg-fuchsia-400/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              {saving ? "儲存中..." : "💾 儲存"}
            </button>
            <button onClick={() => router.back()}
              className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-zinc-400 hover:bg-white/10 transition-colors">
              取消
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
