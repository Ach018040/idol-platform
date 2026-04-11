import Link from "next/link";

const FEATURES = [
  {
    emoji: "🏆",
    title: "即時排行榜",
    desc: "成員與團體溫度指數 Top 10，每次載入即時從資料來源重新計算與排序。",
  },
  {
    emoji: "📅",
    title: "近期活動",
    desc: "整合 Google Calendar，顯示未來 60 天的地下偶像相關活動與演出資訊。",
  },
  {
    emoji: "💬",
    title: "Idol Forum",
    desc: "台灣地下偶像專屬討論社群，支援論壇登入、發文、回覆與管理後台。",
  },
  {
    emoji: "🌡️",
    title: "溫度指數",
    desc: "以社群覆蓋、資料完整度、更新新鮮度與團體關聯綜合計算，反映目前市場熱度。",
  },
  {
    emoji: "🤖",
    title: "市場摘要",
    desc: "整理市場溫度、活躍團體與近期焦點，作為首頁與洞察頁面的輔助資訊。",
  },
  {
    emoji: "👁️",
    title: "使用統計",
    desc: "造訪次數傳送至伺服器蒐集，用於掌握平台整體使用人數與更新節奏。",
  },
];

const DATA_SOURCES = [
  {
    label: "成員與團體資料",
    src: "idolmaps.com / Supabase",
    note: "台灣地下偶像公開資料庫，目前溫度指數的成員、團體與社群欄位皆由此取得。",
  },
  {
    label: "社群平台連結",
    src: "Instagram / X / Facebook / YouTube",
    note: "目前先作為社群覆蓋度的判斷依據，尚未直接納入真實互動數。",
  },
  {
    label: "更新時間",
    src: "updated_at",
    note: "用於計算資料新鮮度，資料越近期更新，分數越高。",
  },
  {
    label: "團體關聯資料",
    src: "history / groups",
    note: "成員若能正確對應到團體，會在成員溫度中得到額外加分。",
  },
  {
    label: "近期活動",
    src: "Google Calendar 公開行事曆",
    note: "顯示未來活動資訊，作為平台補充資訊與觀察依據。",
  },
  {
    label: "論壇資料",
    src: "Supabase",
    note: "討論串、回覆、管理操作與論壇權限資料儲存在獨立資料表中。",
  },
];

const VERSION_HISTORY = [
  {
    ver: "v3.7",
    date: "2026-04",
    desc: "溫度指數改為新版 deterministic 公式，About 說明與首頁排行榜同步對齊實際計算方式。",
  },
  {
    ver: "v3.6",
    date: "2026-03",
    desc: "加入活動整合、論壇功能與更多成員、團體資料顯示。",
  },
  {
    ver: "v3.5",
    date: "2026-02",
    desc: "接入 Supabase 資料來源，建立基礎排行榜與平台使用統計。",
  },
  {
    ver: "v1–v3",
    date: "2025–2026",
    desc: "初始版本，提供靜態資料展示與基本排名頁面。",
  },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.16),_transparent_32%),linear-gradient(180deg,_#050816_0%,_#101827_100%)] px-4 py-16 text-white">
      <div className="mx-auto max-w-4xl space-y-16">
        <section className="space-y-5 text-center">
          <div className="inline-flex items-center rounded-full border border-fuchsia-400/30 bg-fuchsia-400/10 px-4 py-1.5 text-xs uppercase tracking-widest text-fuchsia-200">
            Idol Temperature Platform v3.7
          </div>
          <h1 className="text-4xl font-black text-white md:text-5xl">
            關於
            <span className="mx-3 bg-gradient-to-r from-pink-400 via-fuchsia-300 to-violet-300 bg-clip-text text-transparent">
              本平台
            </span>
          </h1>
          <p className="mx-auto max-w-2xl leading-7 text-zinc-300">
            台灣地下偶像數據情報平台，整合社群活躍度、演出頻率與市場趨勢，
            提供客觀的排行分析、近期活動資訊，以及專屬的偶像討論社群。
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/"
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-300 transition-colors hover:bg-white/10"
            >
              ← 返回排行榜
            </Link>
            <Link
              href="/forum"
              className="rounded-xl border border-fuchsia-400/30 bg-fuchsia-400/10 px-4 py-2 text-sm text-fuchsia-200 transition-colors hover:bg-fuchsia-400/20"
            >
              💬 前往討論區
            </Link>
          </div>
        </section>

        <section className="space-y-5">
          <h2 className="border-b border-white/10 pb-3 text-2xl font-bold text-white">平台功能</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {FEATURES.map(({ emoji, title, desc }) => (
              <div
                key={title}
                className="rounded-2xl border border-white/10 bg-white/5 p-5 transition-colors hover:border-fuchsia-400/20"
              >
                <div className="mb-2 text-2xl">{emoji}</div>
                <div className="mb-1 text-sm font-semibold text-white">{title}</div>
                <div className="text-xs leading-6 text-zinc-400">{desc}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <h2 className="border-b border-white/10 pb-3 text-2xl font-bold text-white">溫度指數計算方式</h2>
          <p className="text-sm leading-7 text-zinc-300">
            <span className="font-semibold text-pink-300">溫度指數（Temperature Index）</span>
            是本平台的核心評估指標，反映偶像或團體在特定時間點的市場熱度與社群覆蓋程度。
            目前正式站採用 deterministic 公式，已移除舊版隨機值，所有分數基於公開可得資料計算，無人為調整。
          </p>

          <div className="space-y-4 rounded-2xl border border-white/10 bg-black/30 p-5 font-mono text-sm">
            <div>
              <p className="mb-1 text-xs uppercase tracking-widest text-emerald-300">① 成員社群覆蓋（最高 40 分）</p>
              <p className="text-zinc-300">Instagram +16 ｜ X +14 ｜ Facebook +10</p>
            </div>
            <div>
              <p className="mb-1 text-xs uppercase tracking-widest text-cyan-300">② 資料完整度（最高 22 分）</p>
              <p className="text-zinc-300">個人照片 +16 ｜ 基本資料存在 +6</p>
            </div>
            <div>
              <p className="mb-1 text-xs uppercase tracking-widest text-violet-300">③ 資料新鮮度（最高 28 分，指數衰減）</p>
              <p className="text-zinc-300">freshness_score = 28 × e^(−距離更新天數 / 45)</p>
            </div>
            <div>
              <p className="mb-1 text-xs uppercase tracking-widest text-sky-300">④ 團體關聯加分（10 分）</p>
              <p className="text-zinc-300">group_affinity_score = 有團體關聯時 +10</p>
            </div>
            <div className="h-px bg-white/10" />
            <div>
              <p className="mb-1 text-xs uppercase tracking-widest text-pink-300">⑤ 成員綜合</p>
              <p className="text-zinc-300">
                temperature_index = social_presence + profile_completeness + freshness_score + group_affinity_score
              </p>
              <p className="text-zinc-400">conversion_score = temperature_index × 0.6</p>
            </div>
            <div className="h-px bg-white/10" />
            <div>
              <p className="mb-1 text-xs uppercase tracking-widest text-fuchsia-300">⑥ 團體綜合</p>
              <p className="text-zinc-300">member_average = 成員溫度平均</p>
              <p className="text-zinc-300">member_depth = min(18, 6 × log2(成員數 + 1))</p>
              <p className="text-zinc-300">social_coverage = Instagram 8 + X 8 + Facebook 5 + YouTube 7</p>
              <p className="text-zinc-300">
                temperature_index = member_average × 0.72 + member_depth + social_coverage
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-xs leading-7 text-zinc-400">
            <strong className="text-white">活躍狀態：</strong>
            <span className="mx-2 text-emerald-400">● 活躍</span>
            近 10 天內更新
            <span className="mx-2 text-yellow-400">● 近期</span>
            10–30 天
            <span className="mx-2 text-zinc-500">● 久未更新</span>
            超過 30 天
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
          <h2 className="border-b border-white/10 pb-3 text-2xl font-bold text-white">隱私政策</h2>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-3 text-xs leading-7 text-zinc-400">
            <p className="text-sm text-zinc-300">
              本平台提供公開唯讀的資料展示服務。論壇（Idol Forum）目前採用論壇登入與管理員驗證機制。
            </p>
            <ul className="space-y-2">
              <li>✦ 排行榜頁面不收集訪客姓名、電子郵件或裝置識別碼等個人資料。</li>
              <li>✦ 造訪次數：每次訪問會傳送一筆匿名計數至伺服器，用於蒐集平台整體使用人次，不含任何個人識別資訊。</li>
              <li>✦ 論壇發文、回覆、管理後台操作資料儲存於 Supabase 資料庫，並依目前權限設計限制存取。</li>
              <li>✦ 平台展示的偶像成員資料均來自公開資料庫與社群平台。</li>
              <li>✦ 若您是平台展示資料的當事人，如有疑慮請透過本頁下方的 Facebook 粉絲專頁反映。</li>
            </ul>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="border-b border-white/10 pb-3 text-2xl font-bold text-white">使用條款</h2>
          <div className="space-y-2 text-xs leading-7 text-zinc-400">
            <p>
              本平台提供的排行與指數僅供<span className="font-semibold text-white">參考用途</span>，
              不代表任何官方認可或商業評級。
            </p>
            <p>溫度指數基於公開資料計算，可能不完整或存在誤差，本平台對資料準確性不作保證。</p>
            <p>論壇用戶發表的內容代表其個人意見，平台不對發文內容的準確性或合法性負責。</p>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="border-b border-white/10 pb-3 text-2xl font-bold text-white">版本記錄</h2>
          {VERSION_HISTORY.map(({ ver, date, desc }) => (
            <div
              key={ver}
              className="flex items-start gap-4 rounded-xl border border-white/10 bg-black/20 px-4 py-3"
            >
              <span className="w-12 flex-shrink-0 text-xs font-mono text-fuchsia-300">{ver}</span>
              <span className="w-16 flex-shrink-0 text-xs text-zinc-600">{date}</span>
              <span className="text-xs leading-5 text-zinc-400">{desc}</span>
            </div>
          ))}
        </section>

        <section className="space-y-4 rounded-3xl border border-blue-400/20 bg-blue-500/10 p-6 text-center">
          <h2 className="text-lg font-bold text-blue-200">聯絡與回饋</h2>
          <p className="text-sm text-zinc-300">
            資料更正、合作洽詢、功能建議，或您是平台展示資料的當事人如有疑慮，
            歡迎透過 Facebook 粉絲專頁與我們聯繫。
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a
              href="https://www.facebook.com/profile.php?id=61573475755166"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-blue-400/30 bg-blue-400/10 px-5 py-2.5 text-sm font-medium text-blue-200 transition-colors hover:bg-blue-400/20"
            >
              📘 Facebook 粉絲專頁
            </a>
            <Link
              href="/forum"
              className="inline-flex items-center gap-2 rounded-xl border border-violet-400/30 bg-violet-400/10 px-5 py-2.5 text-sm text-violet-200 transition-colors hover:bg-violet-400/20"
            >
              💬 論壇討論
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
