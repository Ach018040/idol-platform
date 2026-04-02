import Link from "next/link";
import { MOCK_FORUMS, MOCK_THREADS } from "../../../lib/supabase-forum";

export default function ForumsPage() {
  return (
    <main className="min-h-screen text-white">
      <div className="mx-auto max-w-4xl px-4 py-8 md:px-6">
        <div className="mb-8">
          <h1 className="text-2xl font-black text-white">所有討論版區</h1>
          <p className="mt-1 text-sm text-zinc-400">選擇版區開始討論</p>
        </div>
        <div className="space-y-3">
          {MOCK_FORUMS.map(forum => {
            const recentThreads = MOCK_THREADS
              .filter(t => t.forum_slug === forum.slug)
              .sort((a, b) => new Date(b.last_reply_at).getTime() - new Date(a.last_reply_at).getTime())
              .slice(0, 2);
            return (
              <Link key={forum.slug} href={`/forum/${forum.slug}`}>
                <div className="group rounded-2xl border border-white/10 bg-black/20 p-5 hover:border-fuchsia-400/30 hover:bg-white/5 transition-all cursor-pointer">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl">
                      {forum.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <h2 className="text-base font-bold text-white group-hover:text-fuchsia-200 transition-colors">
                          {forum.title}
                        </h2>
                        <div className="text-xs text-zinc-500 flex items-center gap-3">
                          <span>💬 {forum.thread_count}</span>
                          <span className="text-zinc-600">→</span>
                        </div>
                      </div>
                      <p className="mt-0.5 text-xs text-zinc-400">{forum.description}</p>
                      {recentThreads.length > 0 && (
                        <div className="mt-3 space-y-1">
                          {recentThreads.map(t => (
                            <div key={t.id} className="flex items-center gap-2 text-[11px] text-zinc-600">
                              <span className="text-zinc-700">└</span>
                              <span className="truncate text-zinc-500">{t.title}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 h-1 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-fuchsia-500/60 to-violet-500/60"
                      style={{ width: `${Math.min(100, (forum.thread_count || 0) / 1)}%`, maxWidth: '80%' }}
                    />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}
