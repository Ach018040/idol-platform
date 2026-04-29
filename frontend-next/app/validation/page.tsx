import Link from "next/link";
import dataQuality from "@/public/data/data_quality.json";
import { FRONTEND_MATURITY_LEVELS, MVP_TEST_TASKS } from "@/lib/validation/frontend-maturity";

const statusStyle = {
  pass: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  partial: "border-amber-400/30 bg-amber-400/10 text-amber-200",
  gap: "border-rose-400/30 bg-rose-400/10 text-rose-200",
};

const statusLabel = {
  pass: "Pass",
  partial: "Partial",
  gap: "Gap",
};

function pct(value: number | undefined) {
  return `${Math.round((value ?? 0) * 100)}%`;
}

export default function ValidationPage() {
  const memberCoverage = dataQuality.member_coverage;
  const groupCoverage = dataQuality.group_coverage;

  return (
    <main className="min-h-screen bg-[#10131a] text-white">
      <header className="border-b border-white/10 bg-[#141923]">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-7 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-4xl font-black md:text-6xl">Platform Validation</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
              idol-platform 的前端測試與資料完整度工作台。這裡用來追蹤 L0-L10 成熟度、MVP 測試任務，以及偶像資料庫目前缺口。
            </p>
          </div>
          <nav className="flex flex-wrap gap-2 text-sm font-bold">
            <Link href="/" className="rounded-md border border-white/15 px-4 py-2 text-slate-200 hover:bg-white/10">返回首頁</Link>
            <Link href="/agent" className="rounded-md border border-white/15 px-4 py-2 text-slate-200 hover:bg-white/10">Agent</Link>
            <Link href="/orchestration" className="rounded-md border border-white/15 px-4 py-2 text-slate-200 hover:bg-white/10">Orchestration</Link>
            <Link href="/creative-studio" className="rounded-md bg-cyan-300 px-4 py-2 text-slate-950 hover:bg-cyan-200">Creative Studio</Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-5 px-5 py-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <section className="space-y-5">
          <section className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="text-xs font-black uppercase tracking-[0.2em] text-cyan-200">Data Quality</div>
                <h2 className="mt-1 text-2xl font-black">偶像資料庫完整度</h2>
                <p className="mt-2 text-sm leading-7 text-slate-300">
                  目前資料庫有 {dataQuality.summary.member_total} 位成員、{dataQuality.summary.group_total} 個團體。最大缺口是「真實社群活動時間」與「多來源活動 discovery」。
                </p>
              </div>
              <span className="rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1 text-xs font-black text-amber-100">
                {dataQuality.summary.current_maturity}
              </span>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <div className="rounded-md bg-slate-950 p-4">
                <h3 className="font-black text-cyan-100">成員覆蓋率</h3>
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-slate-300">
                  <span>Instagram</span><strong>{pct(memberCoverage.instagram)}</strong>
                  <span>Facebook</span><strong>{pct(memberCoverage.facebook)}</strong>
                  <span>X / Threads</span><strong>{pct(memberCoverage.twitter)}</strong>
                  <span>照片</span><strong>{pct(memberCoverage.photo_url)}</strong>
                  <span>團體關聯</span><strong>{pct(memberCoverage.group)}</strong>
                  <span>真實社群更新</span><strong>{pct(memberCoverage.last_social_signal_at)}</strong>
                </div>
              </div>
              <div className="rounded-md bg-slate-950 p-4">
                <h3 className="font-black text-cyan-100">團體覆蓋率</h3>
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-slate-300">
                  <span>Instagram</span><strong>{pct(groupCoverage.instagram)}</strong>
                  <span>Facebook</span><strong>{pct(groupCoverage.facebook)}</strong>
                  <span>X</span><strong>{pct(groupCoverage.twitter)}</strong>
                  <span>YouTube</span><strong>{pct(groupCoverage.youtube)}</strong>
                  <span>成員名單</span><strong>{pct(groupCoverage.member_names)}</strong>
                  <span>團體快照</span><strong>{pct(groupCoverage.last_group_snapshot_at)}</strong>
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              {dataQuality.known_gaps.map((gap) => (
                <div key={gap.id} className="rounded-md border border-white/10 bg-slate-950 p-4">
                  <div className="font-black text-rose-100">{gap.label}</div>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{gap.impact}</p>
                  <p className="mt-2 text-sm leading-6 text-cyan-200">{gap.next_action}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            {FRONTEND_MATURITY_LEVELS.map((item) => (
              <article key={item.level} className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="text-xs font-black uppercase tracking-[0.2em] text-cyan-200">{item.level}</div>
                    <h2 className="mt-1 text-xl font-black">{item.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-300">{item.goal}</p>
                  </div>
                  <span className={`rounded-full border px-3 py-1 text-xs font-black ${statusStyle[item.current]}`}>
                    {statusLabel[item.current]}
                  </span>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div className="rounded-md bg-slate-950 p-3">
                    <div className="text-xs font-black text-slate-500">目前證據</div>
                    <p className="mt-1 text-sm leading-6 text-slate-300">{item.evidence}</p>
                  </div>
                  <div className="rounded-md bg-slate-950 p-3">
                    <div className="text-xs font-black text-slate-500">下一步</div>
                    <p className="mt-1 text-sm leading-6 text-slate-300">{item.nextAction}</p>
                  </div>
                </div>
              </article>
            ))}
          </section>
        </section>

        <aside className="space-y-5">
          <section className="rounded-lg border border-cyan-300/20 bg-cyan-300/10 p-5">
            <div className="text-xs font-black uppercase tracking-[0.2em] text-cyan-200">Current level</div>
            <div className="mt-2 text-5xl font-black text-cyan-100">L1</div>
            <p className="mt-3 text-sm leading-7 text-cyan-50/80">
              前端已可重跑驗證；資料庫可展示，但真實社群更新與活動來源仍需補強，下一步是 L2 baseline 與 L3 場景測試。
            </p>
          </section>

          <section className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
            <h2 className="text-xl font-black">MVP 測試任務</h2>
            <div className="mt-4 space-y-3">
              {MVP_TEST_TASKS.map((task, index) => (
                <div key={task} className="flex gap-3 rounded-md bg-slate-950 p-3 text-sm leading-6 text-slate-300">
                  <span className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-full bg-cyan-300 text-xs font-black text-slate-950">
                    {index + 1}
                  </span>
                  <span>{task}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
            <h2 className="text-xl font-black">Go / Pivot / Stop</h2>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              建議 Go，但資料補強要優先：先補社群最後發文、活動來源、真實互動欄位，再擴大 Creative / Design Studio 的真 AI provider。
            </p>
          </section>
        </aside>
      </div>
    </main>
  );
}
