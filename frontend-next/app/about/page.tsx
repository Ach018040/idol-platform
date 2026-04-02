export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#070b14] text-white px-4 py-16">
      <div className="mx-auto max-w-3xl space-y-16">

        {/* Hero */}
        <section className="text-center space-y-4">
          <div className="inline-flex items-center rounded-full border border-fuchsia-400/30 bg-fuchsia-400/10 px-3 py-1 text-xs text-fuchsia-200">
            Idol Temperature Platform v3.7
          </div>
          <h1 className="text-4xl font-black text-white">關於本平台</h1>
          <p className="text-zinc-400 max-w-xl mx-auto">
            台灣地下偶像數據情報平台，整合社群活躍度、演出頻率與市場趨勢，提供客觀的排行與熱度分析。
          </p>
        </section>

        {/* 方法論 */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold text-white border-b border-white/10 pb-3">溫度指數計算方式</h2>
          <div className="space-y-4 text-sm text-zinc-300 leading-7">
            <p>
              <span className="text-pink-300 font-semibold">溫度指數（Temperature Index）</span> 是本平台的核心評估指標，
              反映偶像或團體在特定時間點的市場熱度與社群活躍程度。
            </p>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-3">
              <h3 className="text-base font-semibold text-cyan-300">計算公式</h3>
              <div className="font-mono text-sm bg-black/30 rounded-xl p-4 space-y-2">
                <p className="text-emerald-300 font-semibold">// 平台覆蓋率（最高 40 分）</p>
                <p className="text-zinc-300">platform_score = 3平台(40) | 2平台(28) | 1平台(16) | 無(0)</p>
                <p className="text-amber-300 font-semibold mt-1">// 形象完整度（最高 30 分）</p>
                <p className="text-zinc-300">image_score = 有公開照片(+20) + 有其他形象連結(+10)</p>
                <p className="text-cyan-300 font-semibold mt-1">// 資料新鮮度（最高 30 分，指數衰減）</p>
                <p className="text-zinc-300">freshness = 30 × e^(−距今天數 / 30)</p>
                <p className="text-pink-300 font-semibold mt-2">// 綜合分數</p>
                <p className="text-zinc-300">social_activity = platform + image + freshness（上限 100）</p>
                <p className="text-zinc-300">temperature_index = sa×0.60 + platform×0.20 + freshness×0.20</p>
                <p className="text-zinc-300">conversion_score = temperature_index × 0.6</p>
              </div>
              <ul className="space-y-2 text-zinc-400 text-xs">
                <li>📱 <strong className="text-white">多平台覆蓋</strong>：同時有 IG + X + FB 最高得 40 分，觸及越廣分數越高</li>
                <li>🖼️ <strong className="text-white">形象完整度</strong>：有公開照片 +20、其他形象連結 +10</li>
                <li>⏱️ <strong className="text-white">資料新鮮度</strong>：以指數衰減計算，最近 30 天內更新的資料得分最高</li>
                <li>● <strong className="text-emerald-300">活躍</strong> = 近 10 天內更新 | <strong className="text-yellow-400">近期</strong> = 10–30 天 | <strong className="text-zinc-400">久未更新</strong> = 超過 30 天</li>
              </ul>
            </div>
            <p className="text-zinc-400 text-xs">
              資料來源：idolmaps.com Supabase 資料庫（成員、團體、歷史紀錄）。
              每次載入頁面即時從資料庫抓取，確保資料是當前最新狀態。
            </p>
          </div>
        </section>

        {/* 資料來源 */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-white border-b border-white/10 pb-3">資料來源</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            {[
              { label: "成員與團體資料", src: "idolmaps.com", note: "台灣地下偶像資料庫" },
              { label: "社群連結", src: "Instagram / X / Facebook / YouTube", note: "直接連結至官方帳號" },
              { label: "近期活動", src: "Google Calendar（公開行事曆）", note: "未來 60 天更新" },
              { label: "成員照片", src: "Supabase Storage", note: "公開 bucket 儲存" },
            ].map(({ label, src, note }) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-white font-medium">{label}</div>
                <div className="text-cyan-300 text-xs mt-1">{src}</div>
                <div className="text-zinc-500 text-xs mt-0.5">{note}</div>
              </div>
            ))}
          </div>
        </section>

        {/* 隱私政策 */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-white border-b border-white/10 pb-3">隱私政策</h2>
          <div className="space-y-3 text-sm text-zinc-300 leading-7">
            <p>本平台為<strong className="text-white">公開唯讀</strong>的資料展示服務，不提供帳號註冊或登入功能。</p>
            <ul className="space-y-2 text-zinc-400">
              <li>✦ 本平台<strong className="text-white">不收集</strong>訪客的個人資料，包括姓名、電子郵件或裝置識別碼。</li>
              <li>✦ 造訪次數計數儲存於<strong className="text-white">瀏覽器本機 localStorage</strong>，不傳送至伺服器。</li>
              <li>✦ 平台展示的偶像成員資料均來自公開的資料庫與社群平台。</li>
              <li>✦ 成員照片儲存於 Supabase 公開 Storage bucket，任何人可透過直接 URL 存取。</li>
              <li>✦ 若您是平台展示資料的當事人，如有疑慮請聯繫資料來源方（idolmaps.com）處理。</li>
            </ul>
          </div>
        </section>

        {/* 使用條款 */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-white border-b border-white/10 pb-3">使用條款</h2>
          <div className="space-y-3 text-sm text-zinc-400 leading-7">
            <p>本平台提供的排行與指數僅供<strong className="text-white">參考用途</strong>，不代表任何官方認可或商業評級。</p>
            <p>溫度指數基於公開可得資料計算，可能不完整或存在誤差。本平台對資料準確性不作保證。</p>
            <p>平台內容受著作權保護，未經授權不得重製或商業使用。</p>
          </div>
        </section>

        {/* 聯絡 */}
        <section className="rounded-3xl border border-fuchsia-400/20 bg-fuchsia-500/10 p-6 text-center space-y-3">
          <h2 className="text-lg font-bold text-fuchsia-200">聯絡與回饋</h2>
          <p className="text-sm text-zinc-300">資料更正、合作洽詢或其他問題，歡迎透過 GitHub Issues 反映。</p>
          <a
            href="https://github.com/Ach018040/idol-platform/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-fuchsia-400/30 bg-fuchsia-400/10 px-4 py-2 text-sm text-fuchsia-200 hover:bg-fuchsia-400/20 transition-colors"
          >
            GitHub Issues →
          </a>
        </section>

      </div>
    </main>
  );
}
