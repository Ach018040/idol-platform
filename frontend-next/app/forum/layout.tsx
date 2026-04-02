"use client";
import Link from "next/link";
import { useState } from "react";
import { ForumAuthProvider, useForumAuth } from "../../lib/forum-auth";

const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "").split(",").map(e=>e.trim());

function ForumNavbar() {
  const { user, signOut } = useForumAuth();
  const [showMenu, setShowMenu] = useState(false);
  const isAdmin = user && (
    ADMIN_EMAILS.includes(user.email) ||
    user.display_name?.toLowerCase() === "admin"
  );

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#070b14]/90 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-5">
          <Link href="/forum" className="flex items-center gap-2 text-sm font-bold text-white hover:text-fuchsia-300 transition-colors">
            <span className="text-lg">💬</span>
            <span>Idol Forum</span>
          </Link>
          <div className="hidden sm:flex items-center gap-4 text-xs text-zinc-400">
            <Link href="/forum" className="hover:text-white transition-colors">首頁</Link>
            <Link href="/forum/forums" className="hover:text-white transition-colors">版區</Link>
            <Link href="/forum/groups" className="hover:text-white transition-colors">🎤 團體</Link>
            <Link href="/forum/events" className="hover:text-white transition-colors">🎵 活動</Link>
            <Link href="/forum/goods" className="hover:text-white transition-colors">📸 物販</Link>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/forum/new" className="rounded-xl border border-fuchsia-400/30 bg-fuchsia-400/10 px-3 py-1.5 text-xs text-fuchsia-200 hover:bg-fuchsia-400/20 transition-colors">
            ✏️ 發文
          </Link>
          {user ? (
            <div className="relative">
              <button onClick={() => setShowMenu(!showMenu)}
                className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-300 hover:bg-white/10 transition-colors">
                <div className="w-4 h-4 rounded-full bg-gradient-to-br from-fuchsia-500 to-violet-500 flex items-center justify-center text-[8px] font-bold text-white">
                  {[...user.display_name][0]}
                </div>
                <span className="hidden sm:block">{user.display_name}</span>
                {isAdmin && <span className="text-amber-400 text-[9px]">★</span>}
              </button>
              {showMenu && (
                <div className="absolute right-0 top-full mt-1 w-40 rounded-xl border border-white/10 bg-[#0f1624] py-1 shadow-xl z-50">
                  {isAdmin && (
                    <Link href="/forum/admin" onClick={() => setShowMenu(false)}
                      className="flex items-center gap-2 w-full px-4 py-2 text-xs text-amber-300 hover:bg-white/5 transition-colors">
                      🛡️ 管理後台
                    </Link>
                  )}
                  <button onClick={() => { signOut(); setShowMenu(false); }}
                    className="flex items-center gap-2 w-full px-4 py-2 text-xs text-zinc-400 hover:text-rose-300 hover:bg-white/5 transition-colors">
                    登出
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/forum/new"
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-400 hover:text-white hover:bg-white/10 transition-colors">
              登入
            </Link>
          )}
          <Link href="/"
            className="hidden sm:block rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-400 hover:text-white hover:bg-white/10 transition-colors">
            ← 排行榜
          </Link>
        </div>
      </div>
    </nav>
  );
}

export default function ForumLayout({ children }: { children: React.ReactNode }) {
  return (
    <ForumAuthProvider>
      <div className="min-h-screen bg-[#070b14]">
        <ForumNavbar />
        {children}
      </div>
    </ForumAuthProvider>
  );
}
