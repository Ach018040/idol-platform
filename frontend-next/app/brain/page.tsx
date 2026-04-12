import Link from "next/link";

import { searchBrainPages } from "@/lib/brain";

export const metadata = {
  title: "Brain",
  description: "idol-platform knowledge base and searchable research notes",
};

export default async function BrainPage({
  searchParams,
}: {
  searchParams?: { q?: string; type?: string };
}) {
  const q = (searchParams?.q || "").trim();
  const type = (searchParams?.type || "").trim();
  const pages = await searchBrainPages(q, type, 24);

  const brainHref = (slug: string) => `/brain/${slug.split("/").map(encodeURIComponent).join("/")}`;

  return (
    <main className="min-h-screen bg-[#0b1020] px-4 py-14 text-white">
      <div className="mx-auto max-w-5xl space-y-8">
        <section className="space-y-4">
          <p className="text-xs uppercase tracking-[0.25em] text-cyan-300">Brain</p>
          <h1 className="text-4xl font-black">平台知識庫與研究索引</h1>
          <p className="max-w-3xl text-sm leading-7 text-zinc-300">
            這裡整合了 idol-platform 的公式版本、每週觀察、產品研究與後續可重用的知識頁。
            後續 AI 摘要、推薦說明與論壇管理規範都會逐步接到這一層。
          </p>
          <form className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 md:flex-row">
            <input
              name="q"
              defaultValue={q}
              placeholder="搜尋主題、概念或頁面..."
              className="flex-1 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-500"
            />
            <input
              name="type"
              defaultValue={type}
              placeholder="type，例如 project / concept / source"
              className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-500 md:w-72"
            />
            <button className="rounded-xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300">
              查詢
            </button>
          </form>
        </section>

        <section className="grid gap-4">
          {pages.length ? (
            pages.map((page) => (
              <Link
                key={page.slug}
                href={brainHref(page.slug)}
                className="rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:border-cyan-300/40 hover:bg-white/10"
              >
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-2 py-1 text-cyan-200">
                    {page.type}
                  </span>
                  <span className="text-zinc-500">{page.slug}</span>
                </div>
                <h2 className="mt-3 text-xl font-semibold text-white">{page.title}</h2>
                <p className="mt-3 line-clamp-3 text-sm leading-7 text-zinc-300">{page.compiled_truth}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {page.tags?.slice(0, 6).map((tag) => (
                    <span key={tag} className="rounded-full bg-white/5 px-2 py-1 text-xs text-zinc-400">
                      {tag}
                    </span>
                  ))}
                </div>
              </Link>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-8 text-sm text-zinc-400">
              目前沒有符合條件的 brain 頁面。若剛完成 migration，請先在 Supabase 套用
              `005_secbrain_knowledge_base.sql` 與 `seed_brain_runtime.sql`。
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
