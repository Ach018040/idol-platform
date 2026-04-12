import Link from "next/link";

import { searchBrainPages } from "@/lib/brain";

export const metadata = {
  title: "About",
  description: "關於 idol-platform、溫度指數與平台知識層",
};

const FEATURES = [
  {
    title: "即時排行榜",
    desc: "整合成員與團體溫度指數，讓使用者快速觀察近期值得注意的對象。",
  },
  {
    title: "近期活動",
    desc: "整理地下偶像活動資訊，降低粉絲追蹤演出與行程的成本。",
  },
  {
    title: "Idol Forum",
    desc: "提供論壇討論區，讓粉絲能圍繞團體、成員與活動建立互動。",
  },
  {
    title: "AI 與 Knowledge Layer",
    desc: "將市場摘要、公式說明與研究筆記逐步沉澱到 brain knowledge base。",
  },
];

const FORMULA_POINTS = [
  "成員分數以 social presence、profile completeness、mixed freshness 與 group affinity 組成。",
  "團體分數以 member average、top member、group social coverage 與 content diversity 組成。",
  "freshness v2 會混合資料更新時間與 best-effort 社群最後發文訊號。",
  "若部分指標尚不可得，系統會保守 fallback，並以 data coverage / confidence 呈現可得性。",
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
            idol-platform 是一個以台灣地下偶像為主題的資料平台，整合排行榜、活動、論壇、AI 摘要與知識層。
            我們希望不只提供分數，也能讓每次變化、推薦與觀察都更容易被理解。
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
          <h2 className="border-b border-white/10 pb-3 text-2xl font-bold">溫度指數 v2</h2>
          <div className="rounded-2xl border border-white/10 bg-black/30 p-6">
            <div className="space-y-3 text-sm leading-7 text-zinc-300">
              {FORMULA_POINTS.map((point) => (
                <p key={point}>{point}</p>
              ))}
            </div>
            <div className="mt-5 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-xs leading-7 text-zinc-200">
              溫度指數目前較準確地反映「社群覆蓋、資料完整度、更新活躍度與團體結構」，
              並作為市場熱度的基礎觀察指標；它仍會隨著 followers、engagement、views 與 audience 資料接入而持續升級。
            </div>
          </div>
        </section>

        <section className="space-y-5">
          <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-3">
            <h2 className="text-2xl font-bold">Brain 引用</h2>
            <Link href="/brain" className="text-sm text-cyan-300 hover:text-cyan-200">
              查看全部
            </Link>
          </div>
          <p className="text-sm leading-7 text-zinc-300">
            這一層來自 `Secbrain` 的整合方向，後續會承接公式說明、每週市場摘要、產品研究與推薦解釋。
            `/about` 現在已開始直接引用這些 brain 頁面。
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
                Brain 頁面尚未從 Supabase 讀回。若你剛完成整合，請先執行 migration 與 seed。
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
