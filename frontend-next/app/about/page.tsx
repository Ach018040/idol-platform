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
              <div className="font-mono text-sm bg-black/30 rounded-xl p-4 space-y-1">
                <p className="text-zinc-300">social_activity = IG存在(+55) + 照片(+15) + 活躍度隨機項(0~30)</p>
                <p className="text-zinc-300">temperature_index = social_activity × 0.7 + 隨機修正(0~8)</p>
                <p className="text-zinc-300">conversion_score = temperature_index × 0.6</p>
              </div>
              <ul className="space-y-2 text-zinc-400 text-xs">
                <li>📸 <strong className="text-white">Instagram 帳號存在</strong>：+55 分（最高權重，代表主要社群觸及）</li>
                <li>🖼️ <strong className="text-white">公開照片存在</strong>：+15 分（視覺資料完整度）</li>
                <li>🎲 <strong className="text-white">活躍度隨機項</strong>：0–30 分（反映資料不完整性的不確定性修正）</li>
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
