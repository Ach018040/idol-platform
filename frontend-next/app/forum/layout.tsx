"use client";

import Link from "next/link";
import { useState } from "react";
import { ForumAuthProvider, useForumAuth } from "../../lib/forum-auth";

function ForumNavbar() {
  const { user, signOut } = useForumAuth();
  const [showMenu, setShowMenu] = useState(false);
  const isAdmin = user?.role === "admin";

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#070b14]/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-5">
          <Link
            href="/forum"
            className="flex items-center gap-2 text-sm font-bold text-white transition-colors hover:text-fuchsia-300"
          >
            <span className="text-lg">討</span>
            <span>Idol Forum</span>
          </Link>
          <div className="hidden items-center gap-4 text-xs text-zinc-400 sm:flex">
            <Link href="/forum" className="transition-colors hover:text-white">
              首頁
            </Link>
            <Link href="/forum/forums" className="transition-colors hover:text-white">
              看板
            </Link>
            <Link href="/forum/general" className="transition-colors hover:text-white">
              綜合
            </Link>
            <Link href="/forum/groups" className="transition-colors hover:text-white">
              團體
            </Link>
            <Link href="/forum/events" className="transition-colors hover:text-white">
              活動
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/forum/new"
            className="rounded-xl border border-fuchsia-400/30 bg-fuchsia-400/10 px-3 py-1.5 text-xs text-fuchsia-200 transition-colors hover:bg-fuchsia-400/20"
          >
            發表文章
          </Link>
          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:bg-white/10"
              >
                <div className="flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-500 to-violet-500 text-[8px] font-bold text-white">
                  {[...user.display_name][0]}
                </div>
                <span className="hidden max-w-20 truncate sm:block">{user.display_name}</span>
                {isAdmin ? <span className="text-[9px] text-amber-400">ADMIN</span> : null}
              </button>
              {showMenu ? (
                <div className="absolute right-0 top-full z-50 mt-1 w-44 rounded-xl border border-white/10 bg-[#0f1624] py-1 shadow-xl">
                  <div className="border-b border-white/5 px-4 py-2 text-xs text-zinc-500">
                    {user.is_anonymous ? "訪客模式" : `已登入：${user.display_name}`}
                  </div>
                  {isAdmin ? (
                    <Link
                      href="/forum/admin"
                      onClick={() => setShowMenu(false)}
                      className="flex w-full items-center gap-2 px-4 py-2 text-xs text-amber-300 transition-colors hover:bg-white/5"
                    >
                      前往管理後台
                    </Link>
                  ) : null}
                  <button
                    onClick={() => {
                      signOut();
                      setShowMenu(false);
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2 text-xs text-zinc-400 transition-colors hover:bg-white/5 hover:text-rose-300"
                  >
                    登出 / 清除訪客身分
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <Link
              href="/forum/new"
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:bg-white/10 hover:text-fuchsia-300"
            >
              登入後發文
            </Link>
          )}
          <Link
            href="/"
            className="hidden rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:bg-white/10 hover:text-white sm:block"
          >
            返回首頁
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
