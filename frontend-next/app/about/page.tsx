import Link from "next/link";

import { searchBrainPages } from "@/lib/brain";

export const metadata = {
  title: "About",
  description: "了解 idol-platform 的平台定位、溫度公式與知識層。",
};

const FEATURES = [
  {
    title: "即時排行榜",
    desc: "整合成員與團體資料，使用新版 v2 指標顯示目前排行榜、社群覆蓋與更新狀態。",
  },
  {
    title: "近期活動",
    desc: "彙整未來 60 天活動資訊，讓使用者快速查看演出、活動與近期市場節奏。",
  },
  {
    title: "Idol Forum",
    desc: "提供討論區、發文與管理後台，讓排行榜之外也能承接粉絲討論與內容互動。",
  },
  {
    title: "AI 與 Knowledge Layer",
    desc: "把 insights、brain 與 agent 工作台串起來，讓平台不只顯示數據，也能解釋數據。",
  },
];

const FORMULA_POINTS = [
  "成員分數由 social presence、profile completeness、mixed freshness 與 group affinity 組成。",
  "團體分數綜合 member average、top member、group social coverage 與團體活躍深度。",
  "freshness v2 會同時參考資料更新時間與 best-effort 的社群更新訊號，不再只依賴靜態存在分數。",
  "若缺少部分欄位，系統會保留 fallback，但會透過 data coverage 與 confidence 提醒可信度差異。",
];

export default async function AboutPage() {
  const brainRefs = await searchBrainPages("idol-platform", "", 6);
  const brainHref = (slug: string) => `/brain/${slug.split("/").map(encodeURIComponent).join("/")}`;

  return (
    <main className="page-shell min-h-screen px-4 py-16 text-white">
      <div className="mx-auto max-w-5xl space-y-14">
        <section className="hero-surface space-y-5 px-6 py-10 text-center md:px-10">
          <div className="eyebrow-chip mx-auto px-4 py-1.5 text-xs uppercase tracking-[0.22em]">
            Idol Temperature Platform
          </div>
          <h1 className="text-4xl font-black md:text-5xl">關於本平台</h1>
          <p className="mx-auto max-w-3xl text-sm leading-8 text-zinc-300">
            idol-platform 是以台灣地下偶像為核心的市場情報平台。
            我們把排行榜、活動、論壇、知識層與分析工作台放在同一個產品裡，
            讓使用者不只看到分數，也能理解分數從哪裡來、目前可信到什麼程度。
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/" className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-300 hover:bg-white/10">
              返回首頁
            </Link>
            <Link href="/brain" className="rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-200 hover:bg-cyan-400/20">
              前往 Brain
            </Link>
            <Link href="/agent" className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-sm text-amber-200 hover:bg-amber-400/20">
              開啟 Agent 工作台
            </Link>
          </div>
        </section>

        <section className="space-y-5">
          <h2 className="border-b border-white/10 pb-3 text-2xl font-bold">平台功能</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="surface-panel p-5">
                <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
                <p className="mt-2 text-sm leading-7 text-zinc-300">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-5">
          <h2 className="border-b border-white/10 pb-3 text-2xl font-bold">溫度公式 v2</h2>
          <div className="surface-panel p-6">
            <div className="space-y-3 text-sm leading-7 text-zinc-300">
              {FORMULA_POINTS.map((point) => (
                <p key={point}>{point}</p>
              ))}
            </div>
            <div className="mt-5 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-xs leading-7 text-zinc-200">
              目前 v2 已經開始切入 followers、engagement、views、audience 等更細緻欄位設計，
              但依資料來源可得性不同，部分欄位仍處於逐步補齊階段。平台會保留可實作欄位與資料可信度說明，
              避免把估計值偽裝成完整真實數據。
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
            這一區會優先引用知識層中的平台說明、產品研究與公式整理內容。
            如果目前沒有可用資料，頁面會自動退回 fallback 顯示，不會讓整個 About 變成空白。
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            {brainRefs.length ? (
              brainRefs.map((page) => (
                <Link
                  key={page.slug}
                  href={brainHref(page.slug)}
                  className="surface-panel p-5 transition hover:border-cyan-300/40 hover:bg-white/10"
                >
                  <div className="text-xs text-cyan-300">{page.type}</div>
                  <h3 className="mt-2 text-lg font-semibold text-white">{page.title}</h3>
                  <p className="mt-2 line-clamp-3 text-sm leading-7 text-zinc-300">{page.compiled_truth}</p>
                </Link>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-6 text-sm text-zinc-400">
                目前尚無可引用的 Brain 頁面。等 migration 與 seed 完成後，這裡會自動接上知識層內容。
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
