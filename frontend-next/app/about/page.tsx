import Link from "next/link";

import { searchBrainPages } from "@/lib/brain";

export const metadata = {
  title: "About",
  description: "關於 idol-platform、溫度公式與平台知識層",
};

const FEATURES = [
  {
    title: "即時排行榜",
    desc: "以成員與團體溫度指數為核心，整理市場概況、近期變化與值得關注的焦點對象。",
  },
  {
    title: "近期活動",
    desc: "整合近期活動與公開資訊，幫助使用者快速掌握值得追蹤的演出與動態。",
  },
  {
    title: "Idol Forum",
    desc: "提供討論、發文、管理與規範治理的論壇空間，讓排行榜之外也能留下社群互動脈絡。",
  },
  {
    title: "AI 與 Knowledge Layer",
    desc: "把每週摘要、公式版本、產品研究與知識頁串成可搜尋的資料層，方便後續推薦與說明引用。",
  },
];

const FORMULA_POINTS = [
  "成員公式以 social presence、profile completeness、mixed freshness 與 group affinity 為主。",
  "團體公式則綜合 member average、top member、group social coverage 與內容面向。",
  "freshness v2 會混合資料更新時間與 best-effort 的社群最後發文時間，而不是只看單一欄位。",
  "若外部社群數據尚未完整覆蓋，系統會保留 fallback，並透過 data coverage 與 confidence 提示可信度。",
];

export default async function AboutPage() {
  const brainRefs = await searchBrainPages("idol-platform", "", 6);
  const brainHref = (slug: string) => `/brain/${slug.split("/").map(encodeURIComponent).join("/")}`;

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#070b16_0%,#111827_100%)] px-4 py-16 text-white">
      <div className="mx-auto max-w-5xl space-y-14">
        <section className="space-y-5 text-center">
          <div className="inline-flex rounded-full border border-fuchsia-400/30 bg-fuchsia-400/10 px-4 py-1.5 text-xs uppercase tracking-[0.22em] text-fuchsia-200">
            Idol Temperature Platform
          </div>
          <h1 className="text-4xl font-black md:text-5xl">關於本平台</h1>
          <p className="mx-auto max-w-3xl text-sm leading-8 text-zinc-300">
            idol-platform 是面向台灣地下偶像的數據情報平台，整合排行榜、論壇、觀察內容與可搜尋知識頁。
            我們希望讓使用者不只看見名次，也能理解分數背後的資料來源、公式版本與市場脈絡。
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/" className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-300 hover:bg-white/10">
              返回首頁
            </Link>
            <Link href="/brain" className="rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-200 hover:bg-cyan-400/20">
              前往 Brain
            </Link>
          </div>
        </section>

        <section className="space-y-5">
          <h2 className="border-b border-white/10 pb-3 text-2xl font-bold">平台功能</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
                <p className="mt-2 text-sm leading-7 text-zinc-300">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-5">
          <h2 className="border-b border-white/10 pb-3 text-2xl font-bold">溫度公式 v2</h2>
          <div className="rounded-2xl border border-white/10 bg-black/30 p-6">
            <div className="space-y-3 text-sm leading-7 text-zinc-300">
              {FORMULA_POINTS.map((point) => (
                <p key={point}>{point}</p>
              ))}
            </div>
            <div className="mt-5 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-xs leading-7 text-zinc-200">
              目前正式站已經切到 v2 結構，但 followers、engagement、views 與 audience 這些更完整的外部訊號，
              仍會隨著資料可得性逐步接入，因此分數可信度會和資料覆蓋率一起持續提升。
            </div>
          </div>
        </section>

        <section className="space-y-5">
          <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-3">
            <h2 className="text-2xl font-bold">Brain 參考頁</h2>
            <Link href="/brain" className="text-sm text-cyan-300 hover:text-cyan-200">
              查看全部
            </Link>
          </div>
          <p className="text-sm leading-7 text-zinc-300">
            這裡展示的是 Secbrain 風格整合後的知識頁來源。就算資料庫 migration 尚未正式套用，
            `/about` 仍會先顯示可用的 fallback 頁面，讓知識層先進入使用流程。
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            {brainRefs.length ? (
              brainRefs.map((page) => (
                <Link
                  key={page.slug}
                  href={brainHref(page.slug)}
                  className="rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:border-cyan-300/40 hover:bg-white/10"
                >
                  <div className="text-xs text-cyan-300">{page.type}</div>
                  <h3 className="mt-2 text-lg font-semibold text-white">{page.title}</h3>
                  <p className="mt-2 line-clamp-3 text-sm leading-7 text-zinc-300">{page.compiled_truth}</p>
                </Link>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-6 text-sm text-zinc-400">
                Brain 目前仍以 fallback 內容顯示。之後若 Supabase 已正式套用 migration 與 seed，
                這裡會自動切到資料庫版內容。
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
