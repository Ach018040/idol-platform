import Link from "next/link";

const FEATURES = [
  { emoji: "🏆", title: "即時排行榜", desc: "成員與團體溫度指數 Top 10，每次載入即時從資料庫更新" },
  { emoji: "📅", title: "近期活動", desc: "整合 Google Calendar，顯示未來 60 天的地下偶像相關活動" },
  { emoji: "💬", title: "Idol Forum", desc: "台灣地下偶像專屬討論社群，7 個版區，支援登入發文與回覆" },
  { emoji: "🌡️", title: "溫度指數", desc: "多平台覆蓋、形象完整度與資料新鮮度三維計算，客觀反映市場熱度" },
  { emoji: "🤖", title: "AI 市場摘要", desc: "自動生成本週熱度摘要，分析社群領先者與市場變化" },
  { emoji: "👁️", title: "使用統計", desc: "造訪次數傳送至伺服器蒐集，掌握平台整體使用人數" },
];

const DATA_SOURCES = [
  { label: "成員與團體資料", src: "idolmaps.com", note: "台灣地下偶像公開資料庫，即時從 Supabase 抓取" },
  { label: "社群平台連結", src: "Instagram / X / Facebook / YouTube", note: "直接連結各成員官方帳號" },
  { label: "近期活動", src: "Google Calendar 公開行事曆", note: "未來 60 天活動，每小時更新" },
  { label: "成員照片", src: "Supabase Storage（idolmaps）", note: "公開 bucket，擁有 URL 者可直接存取" },
  { label: "論壇資料", src: "Supabase（idolmetrics）", note: "討論串、回覆、按讚儲存於獨立資料庫" },
  { label: "使用統計", src: "Supabase（idolmaps site_stats）", note: "每次造訪觸發 +1，蒐集整體使用人次" },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.15),_transparent_30%),linear-gradient(180deg,_#070b14_0%,_#111827_100%)] text-white px-4 py-16">
      <div className="mx-auto max-w-3xl space-y-16">

        {/* Hero */}
        <section className="text-center space-y-5">
          <div className="inline-flex items-center rounded-full border border-fuchsia-400/30 bg-fuchsia-400/10 px-4 py-1.5 text-xs text-fuchsia-200 tracking-widest uppercase">
            Idol Temperature Platform v3.7
          </div>
          <h1 className="text-4xl font-black text-white md:text-5xl">
            關於
            <span className="mx-3 bg-gradient-to-r from-pink-400 via-fuchsia-300 to-violet-300 bg-clip-text text-transparent">
              本平台
            </span>
          </h1>
          <p className="text-zinc-400 max-w-xl mx-auto leading-7">
            台灣地下偶像數據情報平台，整合社群活躍度、演出頻率與市場趨勢，
            提供客觀的排行分析、近期活動資訊，以及專屬的偶像討論社群。
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link href="/" className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-300 hover:bg-white/10 transition-colors">
              ← 返回排行榜
            </Link>
            <Link href="/forum" className="rounded-xl border border-fuchsia-400/30 bg-fuchsia-400/10 px-4 py-2 text-sm text-fuchsia-200 hover:bg-fuchsia-400/20 transition-colors">
              💬 前往討論區
            </Link>
          </div>
        </section>

        {/* 功能 */}
        <section className="space-y-5">
          <h2 className="text-2xl font-bold text-white border-b border-white/10 pb-3">平台功能</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {FEATURES.map(({ emoji, title, desc }) => (
              <div key={title} className="rounded-2xl border border-white/10 bg-white/5 p-5 hover:border-fuchsia-400/20 transition-colors">
                <div className="text-2xl mb-2">{emoji}</div>
                <div className="text-sm font-semibold text-white mb-1">{title}</div>
                <div className="text-xs text-zinc-400 leading-6">{desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* 溫度指數 */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold text-white border-b border-white/10 pb-3">溫度指數計算方式</h2>
          <p className="text-sm text-zinc-300 leading-7">
            <span className="text-pink-300 font-semibold">溫度指數（Temperature Index）</span> 是本平台的核心評估指標，
            反映偶像或團體在特定時間點的市場熱度與社群活躍程度。所有分數基於公開可得資料即時計算，無人為調整。
          </p>
          <div className="rounded-2xl border border-white/10 bg-black/30 p-5 space-y-4 font-mono text-sm">
            <div><p className="text-emerald-300 text-xs uppercase tracking-widest mb-1">① 平台覆蓋率（最高 40 分）</p>
              <p className="text-zinc-300">3平台 → 40 ｜ 2平台 → 28 ｜ 1平台 → 16 ｜ 無 → 0</p></div>
            <div><p className="text-cyan-300 text-xs uppercase tracking-widest mb-1">② 形象完整度（最高 30 分）</p>
              <p className="text-zinc-300">個人照片 +20 ｜ 其他形象連結 +10</p></div>
            <div><p className="text-violet-300 text-xs uppercase tracking-widest mb-1">③ 資料新鮮度（最高 30 分，指數衰減）</p>
              <p className="text-zinc-300">freshness = 30 × e^(−距今更新天數 / 30)</p></div>
            <div className="h-px bg-white/10"/>
            <div><p className="text-pink-300 text-xs uppercase tracking-widest mb-1">④ 綜合</p>
              <p className="text-zinc-300">social_activity = ① + ② + ③（上限 100）</p>
              <p className="text-zinc-300">temperature_index = sa×0.60 + ①×0.20 + ③×0.20</p></div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-zinc-400 leading-7">
            <strong className="text-white">活躍狀態：</strong>
            <span className="text-emerald-400 mx-2">● 活躍</span>近 10 天內更新
            <span className="text-yellow-400 mx-2">● 近期</span>10–30 天
            <span className="text-zinc-500 mx-2">● 久未更新</span>超過 30 天
          </div>
        </section>

        {/* 資料來源 */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-white border-b border-white/10 pb-3">資料來源</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {DATA_SOURCES.map(({ label, src, note }) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-white font-medium text-sm">{label}</div>
                <div className="text-cyan-300 text-xs mt-1">{src}</div>
                <div className="text-zinc-500 text-xs mt-0.5 leading-5">{note}</div>
              </div>
            ))}
          </div>
        </section>

        {/* 隱私政策 */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-white border-b border-white/10 pb-3">隱私政策</h2>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-3 text-xs text-zinc-400 leading-7">
            <p className="text-sm text-zinc-300">本平台提供<strong className="text-white">公開唯讀</strong>的資料展示服務。論壇（Idol Forum）支援帳號註冊與登入。</p>
            <ul className="space-y-2">
              <li>✦ 排行榜頁面不收集訪客姓名、電子郵件或裝置識別碼等個人資料。</li>
              <li>✦ <strong className="text-white">造訪次數</strong>：每次訪問會傳送一筆匿名計數至伺服器，用於蒐集平台整體使用人次，不含任何個人識別資訊。</li>
              <li>✦ 論壇帳號資料（電子郵件、顯示名稱）儲存於 <strong className="text-white">Supabase Auth</strong>，採業界標準加密保護。</li>
              <li>✦ 論壇發文、回覆內容儲存於 <strong className="text-white">idolmetrics Supabase</strong> 資料庫，受 RLS 行列安全保護。</li>
              <li>✦ 平台展示的偶像成員資料均來自公開資料庫與社群平台。</li>
              <li>✦ 若您是平台展示資料的當事人，如有疑慮請透過本頁下方的 Facebook 粉絲專頁反映。</li>
            </ul>
          </div>
        </section>

        {/* 使用條款 */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-white border-b border-white/10 pb-3">使用條款</h2>
          <div className="space-y-2 text-xs text-zinc-400 leading-7">
            <p>本平台提供的排行與指數僅供<strong className="text-white">參考用途</strong>，不代表任何官方認可或商業評級。</p>
            <p>溫度指數基於公開資料計算，可能不完整或存在誤差，本平台對資料準確性不作保證。</p>
            <p>論壇用戶發表的內容代表其個人意見，平台不對發文內容的準確性或合法性負責。</p>
          </div>
        </section>

        {/* 版本記錄 */}
        <section className="space-y-3">
          <h2 className="text-2xl font-bold text-white border-b border-white/10 pb-3">版本記錄</h2>
          {[
            { ver: "v3.7", date: "2026-04", desc: "溫度指數優化、Idol Forum 論壇上線、伺服器端使用統計、Privacy Policy" },
            { ver: "v3.6", date: "2026-03", desc: "iCal 活動整合、社群連結、成員活躍狀態標籤" },
            { ver: "v3.5", date: "2026-02", desc: "即時 Supabase fetch、造訪計數、立即更新按鈕" },
            { ver: "v1–v3", date: "2025–2026", desc: "初始版本，靜態資料、基本排行榜" },
          ].map(({ ver, date, desc }) => (
            <div key={ver} className="flex items-start gap-4 rounded-xl border border-white/10 bg-black/20 px-4 py-3">
              <span className="flex-shrink-0 text-xs font-mono text-fuchsia-300 w-12">{ver}</span>
              <span className="flex-shrink-0 text-xs text-zinc-600 w-16">{date}</span>
              <span className="text-xs text-zinc-400 leading-5">{desc}</span>
            </div>
          ))}
        </section>

        {/* 聯絡 */}
        <section className="rounded-3xl border border-blue-400/20 bg-blue-500/10 p-6 text-center space-y-4">
          <h2 className="text-lg font-bold text-blue-200">聯絡與回饋</h2>
          <p className="text-sm text-zinc-300">
            資料更正、合作洽詢、功能建議，或您是平台展示資料的當事人如有疑慮，<br className="hidden sm:block"/>
            歡迎透過 Facebook 粉絲專頁與我們聯繫。
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <a href="https://www.facebook.com/profile.php?id=61573475755166" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-blue-400/30 bg-blue-400/10 px-5 py-2.5 text-sm text-blue-200 hover:bg-blue-400/20 transition-colors font-medium">
              📘 Facebook 粉絲專頁
            </a>
            <Link href="/forum" className="inline-flex items-center gap-2 rounded-xl border border-violet-400/30 bg-violet-400/10 px-5 py-2.5 text-sm text-violet-200 hover:bg-violet-400/20 transition-colors">
              💬 論壇討論
            </Link>
          </div>
        </section>

      </div>
    </main>
  );
}
