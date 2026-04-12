import Link from "next/link";

const FEATURES = [
  {
    emoji: "🏆",
    title: "即時排行榜",
    desc: "首頁直接讀取每日自動更新的 member_rankings.json、v7_rankings.json 與 insights.json，避免前台顯示與資料管線使用不同公式。",
  },
  {
    emoji: "📅",
    title: "近期活動",
    desc: "整合 Google Calendar 活動資料，協助讀者快速掌握未來 60 天內的地下偶像活動行程。",
  },
  {
    emoji: "💬",
    title: "Idol Forum",
    desc: "提供台灣地下偶像專屬討論空間，讓粉絲可以延伸討論排行、活動與市場觀察。",
  },
  {
    emoji: "🌡️",
    title: "溫度指數 v2",
    desc: "新版公式保留原本的可解釋性，並用結構化欄位為後續追蹤數、互動率、觀看率與受眾分析預留升級空間。",
  },
  {
    emoji: "🤖",
    title: "資料摘要",
    desc: "insights.json 會輸出 weekly_highlights、market_temperature_v2 與 data_coverage，作為首頁摘要與後續分析的基礎。",
  },
  {
    emoji: "🔁",
    title: "每日自動更新",
    desc: "GitHub Actions 會每日排程執行資料同步與 JSON 產出，讓正式站資料可持續維持更新節奏。",
  },
];

const DATA_SOURCES = [
  {
    label: "成員與團體資料",
    src: "Supabase / idolmaps",
    note: "目前排行榜資料來自 idolmaps 公開資料表，包含成員基本資料、群組關聯、社群連結與更新時間。",
  },
  {
    label: "結構化 v2 欄位",
    src: "member_rankings.json / v7_rankings.json / insights.json",
    note: "正式站現已改讀 *_v2 欄位，未來追蹤數、互動率、觀看率與受眾欄位可在不破壞舊版相容的前提下逐步補齊。",
  },
  {
    label: "更新新鮮度",
    src: "updated_at / last_social_snapshot_at",
    note: "用於計算資料新鮮度與近 90 天可見條件，避免長期未更新資料繼續占據正式排行榜。",
  },
  {
    label: "活動資料",
    src: "Google Calendar 公開行事曆",
    note: "活動列表會透過 API 每次載入時更新，補足社群之外的線下活動觀測。",
  },
  {
    label: "論壇與站內互動",
    src: "Supabase / Forum APIs",
    note: "論壇資料與站內互動可做為未來熱度驗證的輔助訊號，但目前尚未納入 v2 主公式。",
  },
];

const V2_FIELDS = [
  "temperature_index_v2",
  "conversion_score_v2",
  "data_refresh_score",
  "social_post_score",
  "member_average_temperature_v2",
  "member_top_temperature_v2",
  "group_social_coverage_score",
  "group_content_diversity_score",
  "market_temperature_v2",
  "data_coverage",
  "data_confidence",
  "metrics_available",
  "last_data_refresh_at",
  "last_social_signal_at",
];

const FRESHNESS_EXPLANATION = [
  "freshness_score 已升級為混合版本：同時參考資料庫更新時間與真實社群最後發文時間。",
  "data_refresh_score = 8 × e^(−資料更新天數 / 45)，反映 idolmaps 資料最近是否仍被維護。",
  "social_post_score = 12 × e^(−社群最後發文天數 / 21)，反映 Instagram / Threads / Facebook 的近期活躍度。",
  "若目前尚未取得真實社群最後發文時間，系統會退回資料更新時間並套用保守權重，避免假性高分。",
];

const TASKS = [
  {
    title: "Followers",
    items: [
      "Instagram followers_count：需授權 Business / Creator 帳號與 Meta Graph API。",
      "Threads followers：需 Threads API 或授權後台資料；非授權帳號目前只能保留空值。",
    ],
  },
  {
    title: "Engagement",
    items: [
      "Instagram 每篇平均按讚、留言、互動率：可由媒體 insights 或授權資料取得。",
      "Threads 每篇平均按讚、回覆、互動率：需 Threads API 支援；未授權時先保留欄位。",
    ],
  },
  {
    title: "Views",
    items: [
      "Instagram views / reach：需授權帳號 insights。",
      "Threads views：需 Threads API 或平台可見指標。",
    ],
  },
  {
    title: "Audience",
    items: [
      "受眾地區、年齡、性別：僅能從授權帳號 insights 取得。",
      "未授權帳號目前以 null 保留欄位，並以 data_confidence 顯示資料完整度。",
    ],
  },
];

const VERSION_HISTORY = [
  {
    ver: "v3.9",
    date: "2026-04",
    desc: "首頁正式改讀 v2 JSON schema，/about 說明改為結構化欄位版本，並保留舊欄位相容。",
  },
  {
    ver: "v3.8",
    date: "2026-04",
    desc: "團體排行與 Solo 焦點切開，團體公式改為更重視成員平均與團內最高成員。",
  },
  {
    ver: "v3.7",
    date: "2026-04",
    desc: "論壇上線、首頁重新整理、/about 與正式站公式說明對齊。",
  },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.16),_transparent_32%),linear-gradient(180deg,_#050816_0%,_#101827_100%)] px-4 py-16 text-white">
      <div className="mx-auto max-w-4xl space-y-16">
        <section className="space-y-5 text-center">
          <div className="inline-flex items-center rounded-full border border-fuchsia-400/30 bg-fuchsia-400/10 px-4 py-1.5 text-xs uppercase tracking-widest text-fuchsia-200">
            Idol Temperature Platform v3.9
          </div>
          <h1 className="text-4xl font-black text-white md:text-5xl">
            關於
            <span className="mx-3 bg-gradient-to-r from-pink-400 via-fuchsia-300 to-violet-300 bg-clip-text text-transparent">
              本平台
            </span>
          </h1>
          <p className="mx-auto max-w-2xl leading-7 text-zinc-300">
            台灣地下偶像數據情報平台，整合成員與團體的社群覆蓋、資料新鮮度、團體結構與每日自動更新資料，
            讓排行榜、活動資訊與站內觀察使用相同資料來源。
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/"
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-300 transition-colors hover:bg-white/10"
            >
              返回排行榜
            </Link>
            <Link
              href="/forum"
              className="rounded-xl border border-fuchsia-400/30 bg-fuchsia-400/10 px-4 py-2 text-sm text-fuchsia-200 transition-colors hover:bg-fuchsia-400/20"
            >
              前往討論區
            </Link>
          </div>
        </section>

        <section className="space-y-5">
          <h2 className="border-b border-white/10 pb-3 text-2xl font-bold text-white">平台功能</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {FEATURES.map(({ emoji, title, desc }) => (
              <div key={title} className="rounded-2xl border border-white/10 bg-white/5 p-5 transition-colors hover:border-fuchsia-400/20">
                <div className="mb-2 text-2xl">{emoji}</div>
                <div className="mb-1 text-sm font-semibold text-white">{title}</div>
                <div className="text-xs leading-6 text-zinc-400">{desc}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <h2 className="border-b border-white/10 pb-3 text-2xl font-bold text-white">溫度指數 v2 計算方式</h2>
          <p className="text-sm leading-7 text-zinc-300">
            正式站目前會優先讀取 `temperature_index_v2`、`group_temperature_index_v2`、`market_temperature_v2`
            等欄位。這代表首頁、JSON 與資料管線現在已經走同一套資料結構，而不是前台再各自重算一次。
          </p>

          <div className="space-y-4 rounded-2xl border border-white/10 bg-black/30 p-5 font-mono text-sm">
            <div>
              <p className="mb-1 text-xs uppercase tracking-widest text-emerald-300">① 成員社群覆蓋</p>
              <p className="text-zinc-300">Instagram +14 ｜ X +12 ｜ Facebook +8 ｜ 跨平台加成最高 +6</p>
            </div>
            <div>
              <p className="mb-1 text-xs uppercase tracking-widest text-cyan-300">② 資料完整度</p>
              <p className="text-zinc-300">照片 +14 ｜ 基本資料 +6</p>
            </div>
            <div>
              <p className="mb-1 text-xs uppercase tracking-widest text-violet-300">③ 資料新鮮度</p>
              <p className="text-zinc-300">freshness_score = 20 × e^(−距離更新天數 / 60)</p>
            </div>
            <div>
              <p className="mb-1 text-xs uppercase tracking-widest text-sky-300">④ 團體關聯</p>
              <p className="text-zinc-300">group_affinity_score = 有團體關聯時 +6</p>
            </div>
            <div className="h-px bg-white/10" />
            <div>
              <p className="mb-1 text-xs uppercase tracking-widest text-pink-300">⑤ 成員綜合</p>
              <p className="text-zinc-300">raw_total = social_presence + profile_completeness + freshness_score + group_affinity_score</p>
              <p className="text-zinc-300">temperature_index_v2 = raw_total × (100 / 86)</p>
              <p className="text-zinc-400">conversion_score_v2 = temperature_index_v2 × 0.6</p>
            </div>
            <div className="h-px bg-white/10" />
            <div>
              <p className="mb-1 text-xs uppercase tracking-widest text-fuchsia-300">⑥ 團體綜合</p>
              <p className="text-zinc-300">member_average_temperature_v2 = 成員溫度平均</p>
              <p className="text-zinc-300">member_top_temperature_v2 = 團內最高成員溫度</p>
              <p className="text-zinc-300">group_social_coverage_score = Instagram 6 + X 5 + Facebook 3 + YouTube 4</p>
              <p className="text-zinc-300">group_content_diversity_score = 依內容類型數量加分</p>
              <p className="text-zinc-300">group_temperature_index_v2 = 平均 × 0.45 + 最高 × 0.25 + 團體覆蓋與內容多樣性</p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-xs leading-7 text-zinc-400">
            <strong className="text-white">目前限制：</strong>
            v2 結構已經預留 `followers_*`、`engagement_rate_*`、`view_rate_*`、`audience_*`、
            `brand_collab_*` 等欄位，但目前正式站仍以公開可得資料為主，無法直接填滿所有社群平台的私有 insights。
            因此這一版會用 `data_confidence` 與 `metrics_available` 反映資料完整度。
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="border-b border-white/10 pb-3 text-2xl font-bold text-white">目前已上線的 v2 欄位</h2>
          <div className="flex flex-wrap gap-2">
            {V2_FIELDS.map((field) => (
              <span key={field} className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-200">
                {field}
              </span>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="border-b border-white/10 pb-3 text-2xl font-bold text-white">Freshness 混合公式</h2>
          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-5 text-sm leading-7 text-zinc-200">
            {FRESHNESS_EXPLANATION.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="border-b border-white/10 pb-3 text-2xl font-bold text-white">資料來源</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {DATA_SOURCES.map(({ label, src, note }) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-sm font-medium text-white">{label}</div>
                <div className="mt-1 text-xs text-cyan-300">{src}</div>
                <div className="mt-0.5 text-xs leading-5 text-zinc-500">{note}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="border-b border-white/10 pb-3 text-2xl font-bold text-white">後續可實作資料任務</h2>
          <div className="space-y-4">
            {TASKS.map(({ title, items }) => (
              <div key={title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="mb-2 text-sm font-semibold text-white">{title}</div>
                <ul className="space-y-2 text-xs leading-6 text-zinc-400">
                  {items.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="border-b border-white/10 pb-3 text-2xl font-bold text-white">版本記錄</h2>
          {VERSION_HISTORY.map(({ ver, date, desc }) => (
            <div key={ver} className="flex items-start gap-4 rounded-xl border border-white/10 bg-black/20 px-4 py-3">
              <span className="w-12 flex-shrink-0 text-xs font-mono text-fuchsia-300">{ver}</span>
              <span className="w-16 flex-shrink-0 text-xs text-zinc-600">{date}</span>
              <span className="text-xs leading-5 text-zinc-400">{desc}</span>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
