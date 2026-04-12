import Link from "next/link";
import { notFound } from "next/navigation";

import { getBrainPage, searchBrainPages } from "@/lib/brain";

function brainHref(slug: string) {
  return `/brain/${slug.split("/").map(encodeURIComponent).join("/")}`;
}

export default async function BrainDetailPage({
  params,
}: {
  params: { slug: string[] };
}) {
  const slug = params.slug.join("/");
  const page = await getBrainPage(slug);
  if (!page) notFound();

  const related = (await searchBrainPages("", "", 12)).filter((item) => item.slug !== slug).slice(0, 6);

  return (
    <main className="min-h-screen bg-[#0b1020] px-4 py-14 text-white">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
        <article className="rounded-3xl border border-white/10 bg-white/5 p-6 md:p-8">
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <Link href="/brain" className="text-cyan-300 hover:text-cyan-200">
              ← 返回 Brain
            </Link>
            <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-2 py-1 text-cyan-200">
              {page.type}
            </span>
            <span className="text-zinc-500">{page.slug}</span>
          </div>
          <h1 className="mt-4 text-3xl font-black">{page.title}</h1>
          <p className="mt-6 whitespace-pre-wrap text-sm leading-8 text-zinc-200">{page.compiled_truth}</p>
          {page.timeline_md ? (
            <section className="mt-8 border-t border-white/10 pt-6">
              <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">Timeline</h2>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-zinc-300">{page.timeline_md}</p>
            </section>
          ) : null}
        </article>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">Tags</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {page.tags?.length ? (
                page.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-white/5 px-2 py-1 text-xs text-zinc-300">
                    {tag}
                  </span>
                ))
              ) : (
                <span className="text-sm text-zinc-500">尚無 tags</span>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">Related</h2>
            <div className="mt-3 space-y-3">
              {related.map((item) => (
                <Link key={item.slug} href={brainHref(item.slug)} className="block">
                  <div className="text-sm font-medium text-white">{item.title}</div>
                  <div className="text-xs text-zinc-500">{item.slug}</div>
                </Link>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
