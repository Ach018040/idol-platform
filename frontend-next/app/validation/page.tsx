import Link from "next/link";
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

export default function ValidationPage() {
  return (
    <main className="min-h-screen bg-[#10131a] text-white">
      <header className="border-b border-white/10 bg-[#141923]">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-7 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-4xl font-black md:text-6xl">Frontend Validation</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
              idol-platform 前端測試成熟度工作台。目標是把平台從 L1 迭代驗證推進到 L2 baseline 比較與 L3 場景區塊測試。
            </p>
          </div>
          <nav className="flex flex-wrap gap-2 text-sm font-bold">
            <Link href="/" className="rounded-md border border-white/15 px-4 py-2 text-slate-200 hover:bg-white/10">返回首頁</Link>
            <Link href="/agent" className="rounded-md border border-white/15 px-4 py-2 text-slate-200 hover:bg-white/10">Agent</Link>
            <Link href="/creative-studio" className="rounded-md bg-cyan-300 px-4 py-2 text-slate-950 hover:bg-cyan-200">Creative Studio</Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-5 px-5 py-6 lg:grid-cols-[minmax(0,1fr)_360px]">
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

        <aside className="space-y-5">
          <section className="rounded-lg border border-cyan-300/20 bg-cyan-300/10 p-5">
            <div className="text-xs font-black uppercase tracking-[0.2em] text-cyan-200">Current level</div>
            <div className="mt-2 text-5xl font-black text-cyan-100">L1</div>
            <p className="mt-3 text-sm leading-7 text-cyan-50/80">
              已具備可重跑驗證的前端原型；下一步要補人工 baseline 與場景任務測試。
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
              建議 Go，但限制在 MVP 測試範圍。先把首頁排行、Forum 管理、Agent、Design Studio、Creative Studio 這五條流程測到 L3，再接真 AI provider 或重型 exporter。
            </p>
          </section>
        </aside>
      </div>
    </main>
  );
}
