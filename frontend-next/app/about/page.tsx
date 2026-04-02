import Link from "next/link";

const SCORE_ITEMS = [
  { icon: "📱", label: "多平台覆蓋", desc: "IG + X + FB 三平台 +40 分、二平台 +28、一平台 +16、無 0 分", color: "pink" },
  { icon: "🖼️", label: "形象完整度", desc: "有公開個人照片 +20 分，有其他形象連結（如女僕照）+10 分", color: "cyan" },
  { icon: "⏱️", label: "資料新鮮度", desc: "指數衰減：30 × e^(−距今天數/30)，最近更新的資料得分最高", color: "violet" },
];

const ACTIVE_LABELS = [
  { dot: "text-emerald-400", label: "● 活躍", desc: "近 10 天內有資料更新" },
  { dot: "text-yellow-400", label: "● 近期", desc: "10–30 天前更新" },
  { dot: "text-zinc-500",   label: "● 久未更新", desc: "超過 30 天未更新" },
];

const DATA_SOURCES = [
  { label: "成員與團體資料", src: "idolmaps.com", note: "台灣地下偶像公開資料庫，即時從 Supabase 抓取" },
  { label: "社群平台連結", src: "Instagram / X / Facebook / YouTube", note: "直接連結各成員官方帳號" },
  { label: "近期活動", src: "Google Calendar 公開行事曆", note: "未來 60 天活動，每小時更新" },
  { label: "成員照片", src: "Supabase Storage（idolmaps）", note: "公開 bucket，任何人可直接存取" },
  { label: "論壇資料", src: "Supabase（idolmetrics 專案）", note: "討論串、回覆、按讚儲存於獨立資料庫" },
];

const FEATURES = [
  { emoji: "🏆", title: "即時排行榜", desc: "成員與團體溫度指數 Top 10，每次載入即時從資料庫更新" },
  { emoji: "📅", title: "近期活動", desc: "整合 Google Calendar，顯示未來 60 天的地下偶像相關活動" },
  { emoji: "💬", title: "Idol Forum", desc: "台灣地下偶像專屬討論社群，7 個版區，支援登入發文、回覆、按讚" },
  { emoji: "🤖", title: "AI Market Snapshot", desc: "自動生成市場摘要，分析本週熱度變化與社群領先者" },
  { emoji: "🌡️", title: "溫度指數", desc: "基於多平台覆蓋、形象完整度與資料新鮮度計算，客觀反映市場熱度" },
  { emoji: "👁️", title: "造訪計數", desc: "本機 localStorage 記錄個人造訪次數，不上傳至伺服器" },
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

        {/* 功能總覽 */}
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

        {/* 溫度指數計算方式 */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold text-white border-b border-white/10 pb-3">溫度指數計算方式</h2>
          <p className="text-sm text-zinc-300 leading-7">
            <span className="text-pink-300 font-semibold">溫度指數（Temperature Index）</span> 是本平台的核心評估指標，
            反映偶像或團體在特定時間點的市場熱度與社群活躍程度。所有分數基於公開可得資料即時計算，無人為調整。
          </p>

          {/* 公式區塊 */}
          <div className="rounded-2xl border border-white/10 bg-black/30 p-5 space-y-4 font-mono text-sm">
            <div className="space-y-1">
              <p className="text-emerald-300 text-xs uppercase tracking-widest mb-2">① 平台覆蓋率（最高 40 分）</p>
              <p className="text-zinc-300">platform_score = 3平台 → 40 | 2平台 → 28 | 1平台 → 16 | 無 → 0</p>
            </div>
            <div className="space-y-1">
              <p className="text-cyan-300 text-xs uppercase tracking-widest mb-2">② 形象完整度（最高 30 分）</p>
              <p className="text-zinc-300">image_score = 個人照片(+20) + 其他形象連結(+10)</p>
            </div>
            <div className="space-y-1">
              <p className="text-violet-300 text-xs uppercase tracking-widest mb-2">③ 資料新鮮度（最高 30 分）</p>
              <p className="text-zinc-300">freshness = 30 × e^(−距今更新天數 / 30)</p>
            </div>
            <div className="h-px bg-white/10 my-2"/>
            <div className="space-y-1">
              <p className="text-pink-300 text-xs uppercase tracking-widest mb-2">④ 綜合計算</p>
              <p className="text-zinc-300">social_activity = ① + ② + ③（上限 100）</p>
              <p className="text-zinc-300">temperature_index = sa×0.60 + ①×0.20 + ③×0.20</p>
              <p className="text-zinc-500 text-xs mt-1">conversion_score = temperature_index × 0.6</p>
            </div>
          </div>

          {/* 指標說明 */}
          <div className="space-y-3">
            {SCORE_ITEMS.map(({ icon, label, desc, color }) => (
              <div key={label} className={`flex gap-3 rounded-xl border border-${color}-400/15 bg-${color}-500/8 p-4`}>
                <span className="text-xl flex-shrink-0">{icon}</span>
                <div>
                  <div className={`text-sm font-semibold text-${color}-200 mb-0.5`}>{label}</div>
                  <div className="text-xs text-zinc-400 leading-6">{desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* 活躍狀態說明 */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h3 className="text-sm font-semibold text-zinc-300 mb-3">活躍狀態標籤</h3>
            <div className="space-y-2">
              {ACTIVE_LABELS.map(({ dot, label, desc }) => (
                <div key={label} className="flex items-center gap-3 text-sm">
                  <span className={`font-bold ${dot} w-24 flex-shrink-0`}>{label}</span>
                  <span className="text-zinc-400 text-xs">{desc}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-zinc-500 leading-6">
            資料來源：idolmaps.com Supabase 資料庫（members、groups、history 表）。
            每次載入頁面即時從資料庫抓取，排名反映當下最新狀態。
          </p>
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
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-3 text-sm text-zinc-300 leading-7">
            <p>本平台提供<strong className="text-white">公開唯讀</strong>的資料展示服務。論壇（Idol Forum）支援帳號註冊與登入功能。</p>
            <ul className="space-y-2 text-zinc-400 text-xs leading-7">
              <li>✦ 排行榜頁面<strong className="text-white">不收集</strong>任何訪客個人資料，包括姓名、電子郵件或裝置識別碼。</li>
              <li>✦ 造訪次數計數儲存於<strong className="text-white">瀏覽器本機 localStorage</strong>，不傳送至伺服器。</li>
              <li>✦ 論壇帳號資料（電子郵件、顯示名稱）儲存於 <strong className="text-white">Supabase Auth</strong>，採用業界標準加密保護。</li>
              <li>✦ 論壇發文、回覆內容儲存於 <strong className="text-white">idolmetrics Supabase</strong> 專案資料庫，受 RLS（行列安全）保護。</li>
              <li>✦ 平台展示的偶像成員資料均來自公開的資料庫與社群平台。</li>
              <li>✦ 成員照片儲存於 Supabase Storage 公開 bucket，擁有 URL 者均可存取。</li>
              <li>✦ 若您是平台展示資料的當事人，如有疑慮請聯繫資料來源方（idolmaps.com）或透過 GitHub Issues 反映。</li>
            </ul>
          </div>
        </section>

        {/* 使用條款 */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-white border-b border-white/10 pb-3">使用條款</h2>
          <div className="space-y-3 text-sm text-zinc-400 leading-7">
            <p>本平台提供的排行與指數僅供<strong className="text-white">參考用途</strong>，不代表任何官方認可或商業評級。</p>
            <p>溫度指數基於公開可得資料計算，可能不完整或存在誤差。本平台對資料準確性不作任何保證。</p>
            <p>論壇用戶發表的內容代表其個人意見，平台不對用戶發文內容的準確性或合法性負責。</p>
            <p>平台原創內容受著作權保護，未經授權不得重製或商業使用。偶像成員資料之著作權歸原始資料來源所有。</p>
          </div>
        </section>

        {/* 版本記錄 */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-white border-b border-white/10 pb-3">版本記錄</h2>
          <div className="space-y-2">
            {[
              { ver: "v3.7", date: "2026-04", desc: "溫度指數優化（多平台 + 新鮮度衰減）、Idol Forum 論壇上線、隱私政策 / About 頁面" },
              { ver: "v3.6", date: "2026-03", desc: "iCal 活動整合、社群連結（IG/X/FB/YT）、成員活躍狀態標籤" },
              { ver: "v3.5", date: "2026-02", desc: "即時 Supabase fetch、造訪計數、⟳ 立即更新按鈕" },
              { ver: "v1–v3", date: "2025–2026", desc: "初始版本，靜態 JSON 資料、基本排行榜功能" },
            ].map(({ ver, date, desc }) => (
              <div key={ver} className="flex items-start gap-4 rounded-xl border border-white/10 bg-black/20 px-4 py-3">
                <div className="flex-shrink-0 text-xs font-mono text-fuchsia-300 w-12">{ver}</div>
                <div className="flex-shrink-0 text-xs text-zinc-600 w-18">{date}</div>
                <div className="text-xs text-zinc-400 leading-5">{desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* 聯絡 */}
        <section className="rounded-3xl border border-fuchsia-400/20 bg-fuchsia-500/10 p-6 text-center space-y-4">
          <h2 className="text-lg font-bold text-fuchsia-200">聯絡與回饋</h2>
          <p className="text-sm text-zinc-300">資料更正、合作洽詢、功能建議或其他問題，歡迎透過以下管道聯繫。</p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <a href="https://www.facebook.com/profile.php?id=61573475755166" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-blue-400/30 bg-blue-400/10 px-4 py-2 text-sm text-blue-200 hover:bg-blue-400/20 transition-colors">
              <span>📘</span> Facebook 粉絲頁
            </a>
            <Link href="/forum" className="inline-flex items-center gap-2 rounded-xl border border-violet-400/30 bg-violet-400/10 px-4 py-2 text-sm text-violet-200 hover:bg-violet-400/20 transition-colors">
              💬 論壇討論
            </Link>
            <a href="https://github.com/Ach018040/idol-platform/issues" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-300 hover:bg-white/10 transition-colors">
              GitHub Issues
            </a>
          </div>
        </section>

      </div>
    </main>
  );
}
