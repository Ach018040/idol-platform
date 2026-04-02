import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "地下偶像討論區", template: "%s | Idol Forum" },
  description: "台灣地下偶像專屬討論社群，討論活動、成員、物販與更多話題。",
};

export default function ForumLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#070b14]">
      {/* Forum Navbar */}
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#070b14]/90 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
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
            <Link href="/" className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-400 hover:text-white hover:bg-white/10 transition-colors">
              ← 排行榜
            </Link>
          </div>
        </div>
      </nav>
      {children}
    </div>
  );
}
