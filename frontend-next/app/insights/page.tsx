import type { Metadata } from "next";
import Link from "next/link";

import { insightPosts } from "../../lib/insights";

export const metadata: Metadata = {
  title: "Insights",
  description: "idol-platform 的每週市場觀察與趨勢整理。",
};

export default function InsightsPage() {
  return (
    <main className="page-shell min-h-screen px-4 py-16 text-white">
      <div className="mx-auto max-w-6xl space-y-10">
        <section className="hero-surface px-6 py-10 md:px-10">
          <div className="max-w-3xl">
            <p className="eyebrow-chip px-4 py-1 text-sm uppercase tracking-[0.2em]">Insights</p>
            <h1 className="mt-4 text-4xl font-black text-white md:text-5xl">市場觀察與研究摘要</h1>
            <p className="mt-4 text-base leading-8 text-zinc-300">
              這裡整理平台每週的市場觀察、社群變化與產品研究後的可讀內容。
              如果首頁是即時看板，Insights 就是把訊號整理成判讀脈絡的地方。
            </p>
          </div>
        </section>

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {insightPosts.map((post) => (
            <Link
              key={post.slug}
              href={`/insights/${post.slug}`}
              className="surface-panel p-6 transition hover:border-cyan-300/30 hover:bg-white/10"
            >
              <p className="text-xs uppercase tracking-[0.18em] text-cyan-300">{post.category}</p>
              <h2 className="mt-3 text-xl font-semibold text-white">{post.title}</h2>
              <p className="mt-3 text-sm leading-7 text-zinc-400">{post.summary}</p>
              <p className="mt-4 text-xs text-zinc-500">{post.date}</p>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}
