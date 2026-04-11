import Link from "next/link";

const FEATURES = [
  {
    title: "偶像資料整合",
    desc: "整合團體、成員、社群連結與照片資料，讓使用者能快速掌握平台收錄狀態。",
  },
  {
    title: "溫度指數排序",
    desc: "以社群存在度、資料完整度、更新新鮮度與團體關聯計算成員與團體的排序依據。",
  },
  {
    title: "論壇與內容互動",
    desc: "透過論壇、檢舉與管理後台，補強平台的社群討論與內容治理能力。",
  },
  {
    title: "靜態資料穩定部署",
    desc: "前端以 Next.js 靜態站搭配 JSON 資料輸出，兼顧讀取速度與部署穩定性。",
  },
];

const DATA_SOURCES = [
  {
    label: "偶像主資料",
    src: "idolmaps.com / Supabase",
    note: "包含成員名稱、團體關聯、照片與社群欄位，是目前溫度計算的核心資料來源。",
  },
  {
    label: "社群連結覆蓋",
    src: "Instagram / X / Facebook / YouTube",
    note: "目前先使用社群帳號是否存在作為平台覆蓋度訊號，尚未納入真實互動量。",
  },
  {
    label: "更新時間",
    src: "updated_at",
    note: "以資料最近更新時間計算新鮮度，讓長期未維護的資料自然衰減。",
  },
  {
    label: "團體關聯",
    src: "history / groups",
    note: "成員若能正確對應到現役團體，會在成員溫度中得到額外加分。",
  },
];

const VERSION_HISTORY = [
  {
    ver: "v3.7",
    date: "2026-04",
    desc: "溫度公式改為 deterministic 模型，移除隨機值，並將 About 頁說明對齊實際資料管線。",
  },
  {
    ver: "v3.6",
    date: "2026-03",
    desc: "補強論壇、活動與資料頁面，整理正式站的整體資訊架構。",
  },
  {
    ver: "v3.5",
    date: "2026-02",
    desc: "完成 Supabase 資料來源接軌，建立基礎排名與洞察頁面。",
  },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.16),_transparent_32%),linear-gradient(180deg,_#050816_0%,_#101827_100%)] px-4 py-16 text-white">
      <div className="mx-auto flex max-w-5xl flex-col gap-16">
        <section className="space-y-6 text-center">
          <div className="inline-flex items-center rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200">
            Idol Platform / About
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-black leading-tight md:text-5xl">
              讓偶像資料、社群熱度與平台排序
              <span className="bg-gradient-to-r from-cyan-300 via-sky-300 to-fuchsia-300 bg-clip-text text-transparent">
                {" "}
                更透明可解釋
              </span>
            </h1>
            <p className="mx-auto max-w-3xl text-sm leading-8 text-zinc-300 md:text-base">
              Idol Platform
              目前採用的是可穩定部署、可追溯來源的溫度指數模型。這一版重點不是模擬話題聲量，而是先用平台已穩定取得的資料，
              建立一套可解釋、可維護、可逐步升級的偶像排序基礎。
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/"
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-200 transition-colors hover:bg-white/10"
            >
              返回首頁
            </Link>
            <Link
              href="/rankings"
              className="rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-200 transition-colors hover:bg-cyan-400/20"
            >
              查看排行榜
            </Link>
          </div>
        </section>

        <section className="space-y-5">
          <h2 className="border-b border-white/10 pb-3 text-2xl font-bold">平台目前做什麼</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {FEATURES.map((feature) => (
              <article
                key={feature.title}
                className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_12px_40px_rgba(0,0,0,0.18)]"
              >
                <h3 className="text-base font-semibold text-white">{feature.title}</h3>
                <p className="mt-2 text-sm leading-7 text-zinc-400">{feature.desc}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <div className="space-y-3">
            <h2 className="border-b border-white/10 pb-3 text-2xl font-bold">正式版溫度公式</h2>
            <p className="text-sm leading-8 text-zinc-300">
              正式站現在已經不是早期的隨機波動版本，而是和資料產線同步的 deterministic
              公式。也就是說，同一份資料在同一時間重新計算，會得到一致結果，方便追蹤、驗證與後續優化。
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <section className="rounded-3xl border border-cyan-400/20 bg-cyan-400/5 p-6">
              <div className="mb-3 text-sm font-semibold uppercase tracking-[0.22em] text-cyan-200">
                成員公式
              </div>
              <div className="space-y-2 font-mono text-sm text-zinc-200">
                <p>`social_presence = IG 16 + X 14 + Facebook 10`</p>
                <p>`profile_completeness = 照片 16 + 基本資料 6`</p>
                <p>`freshness_score = 28 × e^(-距離更新天數 / 45)`</p>
                <p>`group_affinity_score = 有團體關聯時 +10`</p>
                <p className="pt-2 text-cyan-200">
                  `temperature_index = social_presence + profile_completeness + freshness_score + group_affinity_score`
                </p>
                <p className="text-zinc-400">`conversion_score = temperature_index × 0.6`</p>
              </div>
              <ul className="mt-4 space-y-2 text-sm leading-7 text-zinc-300">
                <li>Instagram、X、Facebook 目前代表社群覆蓋度，而不是互動量。</li>
                <li>資料越完整、越新，排序就越有機會往前。</li>
                <li>能正確掛到團體的成員，會得到額外的結構性加分。</li>
              </ul>
            </section>

            <section className="rounded-3xl border border-fuchsia-400/20 bg-fuchsia-400/5 p-6">
              <div className="mb-3 text-sm font-semibold uppercase tracking-[0.22em] text-fuchsia-200">
                團體公式
              </div>
              <div className="space-y-2 font-mono text-sm text-zinc-200">
                <p>`member_average = 成員溫度平均`</p>
                <p>`member_depth = min(18, 6 × log2(成員數 + 1))`</p>
                <p>`social_coverage = Instagram 8 + X 8 + Facebook 5 + YouTube 7`</p>
                <p className="pt-2 text-fuchsia-200">
                  `temperature_index = member_average × 0.72 + member_depth + social_coverage`
                </p>
                <p className="text-zinc-400">`conversion_score = temperature_index × 0.6`</p>
              </div>
              <ul className="mt-4 space-y-2 text-sm leading-7 text-zinc-300">
                <li>團體分數主要來自成員整體平均，而不是只看單一熱門成員。</li>
                <li>成員數量有加成，但會用對數函數抑制極端膨脹。</li>
                <li>YouTube 目前只納入團體層級的社群覆蓋計分。</li>
              </ul>
            </section>
          </div>

          <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/5 p-5 text-sm leading-8 text-zinc-300">
            <strong className="text-emerald-200">這次優化的重點：</strong>
            已移除隨機值、加入時間衰減、把成員與團體拆成不同邏輯，並讓頁面說明和
            `pipeline/fetch_members.py` 的實際計算同步。
          </div>
        </section>

        <section className="space-y-5">
          <h2 className="border-b border-white/10 pb-3 text-2xl font-bold">資料來源</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {DATA_SOURCES.map((source) => (
              <article key={source.label} className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <div className="text-sm font-semibold text-white">{source.label}</div>
                <div className="mt-1 text-xs uppercase tracking-[0.18em] text-sky-300">{source.src}</div>
                <p className="mt-3 text-sm leading-7 text-zinc-400">{source.note}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="space-y-5">
          <h2 className="border-b border-white/10 pb-3 text-2xl font-bold">目前限制與下一步</h2>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm leading-8 text-zinc-300">
            <ul className="space-y-3">
              <li>目前公式仍以資料存在度與更新狀態為主，尚未納入真實按讚、留言、分享等互動量。</li>
              <li>尚未接入情緒分析、7 日歷史快照、擴散速度與反作弊機制，因此這版仍屬可落地的基礎模型。</li>
              <li>若未來資料來源穩定，下一版會優先補上成長率、互動率與時間窗口權重。</li>
              <li>About 頁現在說明的是正式站實際採用版本，不再混用規劃中但尚未上線的模型。</li>
            </ul>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="border-b border-white/10 pb-3 text-2xl font-bold">版本紀錄</h2>
          <div className="space-y-3">
            {VERSION_HISTORY.map((item) => (
              <article
                key={item.ver}
                className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm text-zinc-300 md:flex-row md:items-start"
              >
                <div className="w-16 flex-shrink-0 font-mono text-cyan-300">{item.ver}</div>
                <div className="w-20 flex-shrink-0 text-zinc-500">{item.date}</div>
                <div className="leading-7">{item.desc}</div>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-sky-400/20 bg-sky-400/10 p-6 text-center">
          <h2 className="text-xl font-bold text-sky-100">想看目前實際排序結果？</h2>
          <p className="mt-3 text-sm leading-7 text-zinc-300">
            你可以直接前往排行榜、論壇或首頁，查看這套正式版公式在目前資料上的實際呈現結果。
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/rankings"
              className="rounded-xl border border-sky-300/30 bg-sky-300/10 px-5 py-2.5 text-sm text-sky-100 transition-colors hover:bg-sky-300/20"
            >
              前往排行榜
            </Link>
            <Link
              href="/forum"
              className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm text-zinc-100 transition-colors hover:bg-white/10"
            >
              前往論壇
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
