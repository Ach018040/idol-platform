import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getInsightBySlug, insightPosts } from "../../../lib/insights";

export async function generateStaticParams() {
  return insightPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = getInsightBySlug(params.slug);
  if (!post) return { title: "文章不存在" };
  return { title: post.title, description: post.summary };
}

export default function InsightDetailPage({ params }: { params: { slug: string } }) {
  const post = getInsightBySlug(params.slug);
  if (!post) notFound();

  return (
    <main className="page-shell min-h-screen px-4 py-16 text-white">
      <article className="mx-auto max-w-3xl space-y-8">
        <div className="hero-surface px-6 py-10 md:px-10">
          <p className="eyebrow-chip px-4 py-1 text-xs uppercase tracking-[0.18em]">{post.category}</p>
          <h1 className="mt-4 text-4xl font-black leading-tight text-white md:text-5xl">{post.title}</h1>
          <p className="mt-4 text-sm text-zinc-400">{post.date}</p>
          <p className="mt-4 text-base leading-8 text-zinc-300">{post.summary}</p>
          <div className="mt-6">
            <Link href="/insights" className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/10">
              返回 Insights
            </Link>
          </div>
        </div>

        <div className="surface-panel px-6 py-8 md:px-10">
          <div className="space-y-6 text-base leading-8 text-zinc-300">
            {post.content.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        </div>
      </article>
    </main>
  );
}
