import Link from "next/link";

const PLANS = [
  {
    name: "Free",
    price: "免費",
    priceNote: "永久免費",
    color: "zinc",
    badge: null,
    features: [
      "成員 / 團體 Top 10 排行榜",
      "市場溫度指數瀏覽",
      "近期活動行事曆",
      "AI 市場摘要（每日更新）",
      "論壇瀏覽與發文",
      "7 天歷史資料",
    ],
    cta: "開始使用",
    ctaHref: "/",
    ctaStyle: "border border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10",
  },
  {
    name: "Pro",
    price: "即將推出",
    priceNote: "搶先通知",
    color: "fuchsia",
    badge: "即將推出",
    features: [
      "完整成員 / 團體排行（無限制）",
      "30 / 90 天趨勢圖表",
      "Watchlist 追蹤清單",
      "儲存篩選條件",
      "CSV 資料匯出",
      "預測指數視圖",
      "週報 Email 摘要",
    ],
    cta: "訂閱通知",
    ctaHref: "https://www.facebook.com/profile.php?id=61573475755166",
    ctaStyle: "border border-fuchsia-400/30 bg-fuchsia-400/10 text-fuchsia-200 hover:bg-fuchsia-400/20",
  },
  {
    name: "Team",
    price: "即將推出",
    priceNote: "多人協作",
    color: "violet",
    badge: "企劃中",
    features: [
      "Pro 全部功能",
      "多人 Workspace",
      "內部筆記與標註",
      "Alert 通知中心",
      "報告分享功能",
      "Team Watchlist",
      "API Token 存取",
    ],
    cta: "洽詢合作",
    ctaHref: "https://www.facebook.com/profile.php?id=61573475755166",
    ctaStyle: "border border-violet-400/30 bg-violet-400/10 text-violet-200 hover:bg-violet-400/20",
  },
];

const FAQS = [
  { q: "Pro 和 Team 方案什麼時候推出？", a: "目前正在開發中，預計 2026 年下半年推出。請追蹤 Facebook 粉絲專頁取得最新消息。" },
  { q: "免費版有什麼限制？", a: "免費版可瀏覽 Top 10 排行榜、活動行事曆、AI 摘要，以及論壇功能。進階分析（趨勢圖、Watchlist）將在 Pro 版提供。" },
  { q: "如果我是偶像團體或經紀公司，有企業方案嗎？", a: "有的，我們提供客製化方案，包含自訂評分權重、專屬儀表板等。請透過 Facebook 粉絲專頁聯繫我們。" },
  { q: "資料從哪裡來？", a: "資料來源為 idolmaps.com 公開資料庫、Google Calendar 活動行事曆，以及各偶像的官方社群帳號。詳見關於頁面。" },
];

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.15),_transparent_30%),linear-gradient(180deg,_#070b14_0%,_#111827_100%)] text-white px-4 py-16">
      <div className="mx-auto max-w-5xl space-y-16">

        {/* Hero */}
        <section className="text-center space-y-4">
          <div className="inline-flex items-center rounded-full border border-fuchsia-400/30 bg-fuchsia-400/10 px-4 py-1.5 text-xs text-fuchsia-200 tracking-widest uppercase">
            Idol Platform 方案
          </div>
          <h1 className="text-4xl font-black text-white md:text-5xl">
            選擇適合你的
            <span className="block bg-gradient-to-r from-pink-400 via-fuchsia-300 to-violet-300 bg-clip-text text-transparent">
              情報方案
            </span>
          </h1>
          <p className="text-zinc-400 max-w-xl mx-auto leading-7">
            免費版永久開放，Pro / Team 方案開發中。
            追蹤 Facebook 粉絲專頁掌握最新上線資訊。
          </p>
        </section>

        {/* Plans */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {PLANS.map((plan) => (
            <div key={plan.name}
              className={`relative rounded-3xl border p-6 flex flex-col ${
                plan.name === "Pro"
                  ? "border-fuchsia-400/40 bg-fuchsia-500/10 shadow-lg shadow-fuchsia-500/10"
                  : "border-white/10 bg-white/5"
              }`}>
              {plan.badge && (
                <div className={`absolute -top-3 left-1/2 -translate-x-1/2 rounded-full border px-3 py-1 text-[10px] font-semibold ${
                  plan.name === "Pro"
                    ? "border-fuchsia-400/50 bg-fuchsia-400/20 text-fuchsia-200"
                    : "border-violet-400/50 bg-violet-400/20 text-violet-200"
                }`}>
                  {plan.badge}
                </div>
              )}
              <div className="mb-5">
                <div className={`text-xs uppercase tracking-widest text-${plan.color}-300/70 mb-1`}>{plan.name}</div>
                <div className="text-3xl font-black text-white">{plan.price}</div>
                <div className="text-xs text-zinc-500 mt-1">{plan.priceNote}</div>
              </div>
              <ul className="space-y-2.5 flex-1 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs text-zinc-300">
                    <span className={`text-${plan.color}-400 flex-shrink-0 mt-0.5`}>✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <a href={plan.ctaHref} target={plan.ctaHref.startsWith("http") ? "_blank" : undefined}
                rel={plan.ctaHref.startsWith("http") ? "noopener noreferrer" : undefined}
                className={`block text-center rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors ${plan.ctaStyle}`}>
                {plan.cta}
              </a>
            </div>
          ))}
        </section>

        {/* FAQ */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-white text-center">常見問題</h2>
          <div className="space-y-3 max-w-2xl mx-auto">
            {FAQS.map(({ q, a }) => (
              <div key={q} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className="text-sm font-semibold text-white mb-2">{q}</div>
                <div className="text-xs text-zinc-400 leading-6">{a}</div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="rounded-3xl border border-blue-400/20 bg-blue-500/10 p-8 text-center space-y-4">
          <h2 className="text-xl font-bold text-blue-200">想提前體驗 Pro 功能？</h2>
          <p className="text-sm text-zinc-300">
            追蹤 Facebook 粉絲專頁，第一時間收到 Pro 版上線通知及早鳥優惠。
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <a href="https://www.facebook.com/profile.php?id=61573475755166" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-blue-400/30 bg-blue-400/10 px-5 py-2.5 text-sm text-blue-200 hover:bg-blue-400/20 transition-colors font-medium">
              📘 Facebook 粉絲專頁
            </a>
            <Link href="/" className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm text-zinc-300 hover:bg-white/10 transition-colors">
              ← 返回排行榜
            </Link>
          </div>
        </section>

      </div>
    </main>
  );
}
