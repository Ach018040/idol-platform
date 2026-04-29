"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  createRunForWorkItem,
  ORCHESTRATION_WORK_ITEMS,
  WORK_STATES,
  type AgentRun,
  type WorkItem,
  type WorkState,
} from "@/lib/orchestration/symphony-model";

const STORAGE_KEY = "idol-platform-agent-runs-v1";

const stateStyle: Record<WorkState, string> = {
  backlog: "border-slate-400/20 bg-slate-400/10 text-slate-200",
  ready: "border-cyan-300/30 bg-cyan-300/10 text-cyan-100",
  running: "border-amber-300/30 bg-amber-300/10 text-amber-100",
  "human-review": "border-fuchsia-300/30 bg-fuchsia-300/10 text-fuchsia-100",
  done: "border-emerald-300/30 bg-emerald-300/10 text-emerald-100",
  blocked: "border-rose-300/30 bg-rose-300/10 text-rose-100",
};

function readRuns(): AgentRun[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeRuns(runs: AgentRun[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(runs.slice(0, 30)));
}

export default function OrchestrationWorkbench() {
  const [filter, setFilter] = useState<WorkState | "all">("all");
  const [runs, setRuns] = useState<AgentRun[]>([]);
  const [selected, setSelected] = useState<WorkItem>(ORCHESTRATION_WORK_ITEMS[0]);

  useEffect(() => {
    setRuns(readRuns());
  }, []);

  const filteredItems = useMemo(
    () => ORCHESTRATION_WORK_ITEMS.filter((item) => filter === "all" || item.state === filter),
    [filter],
  );

  function startRun(item: WorkItem) {
    const run = createRunForWorkItem(item);
    const next = [run, ...runs];
    setRuns(next);
    setSelected(item);
    writeRuns(next);
  }

  return (
    <main className="min-h-screen bg-[#0f1218] text-white">
      <header className="border-b border-white/10 bg-[#151a23]">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-7 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-4xl font-black md:text-6xl">Agent Orchestration</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
              參考 Symphony 的 issue-tracker control plane 概念，將 idol-platform 的工作項拆成可執行、可驗收、可交接的 agent run。
            </p>
          </div>
          <nav className="flex flex-wrap gap-2 text-sm font-bold">
            <Link href="/" className="rounded-md border border-white/15 px-4 py-2 text-slate-200 hover:bg-white/10">返回首頁</Link>
            <Link href="/validation" className="rounded-md border border-white/15 px-4 py-2 text-slate-200 hover:bg-white/10">Validation</Link>
            <Link href="/agent" className="rounded-md bg-cyan-300 px-4 py-2 text-slate-950 hover:bg-cyan-200">Agent</Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-5 px-5 py-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <section className="space-y-5">
          <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilter("all")}
                className={`rounded-md px-3 py-2 text-xs font-black ${filter === "all" ? "bg-white text-slate-950" : "bg-slate-900 text-slate-300"}`}
              >
                All
              </button>
              {WORK_STATES.map((state) => (
                <button
                  key={state.id}
                  onClick={() => setFilter(state.id)}
                  className={`rounded-md px-3 py-2 text-xs font-black ${filter === state.id ? "bg-cyan-300 text-slate-950" : "bg-slate-900 text-slate-300"}`}
                >
                  {state.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-3">
            {filteredItems.map((item) => (
              <article key={item.id} className="rounded-lg border border-white/10 bg-[#161d29] p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full border px-3 py-1 text-xs font-black ${stateStyle[item.state]}`}>
                        {item.state}
                      </span>
                      <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">{item.kind}</span>
                      <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">{item.owner}</span>
                    </div>
                    <h2 className="mt-3 text-xl font-black">{item.title}</h2>
                    <p className="mt-2 text-sm leading-7 text-slate-300">{item.goal}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setSelected(item)} className="rounded-md border border-white/15 px-3 py-2 text-xs font-black text-slate-200 hover:bg-white/10">
                      查看
                    </button>
                    <button
                      onClick={() => startRun(item)}
                      disabled={item.state === "blocked"}
                      className="rounded-md bg-cyan-300 px-3 py-2 text-xs font-black text-slate-950 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
                    >
                      建立 Run
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <aside className="space-y-5">
          <section className="rounded-lg border border-cyan-300/20 bg-cyan-300/10 p-5">
            <div className="text-xs font-black uppercase tracking-[0.2em] text-cyan-200">Selected work</div>
            <h2 className="mt-2 text-2xl font-black">{selected.title}</h2>
            <p className="mt-3 text-sm leading-7 text-cyan-50/80">{selected.goal}</p>
            <div className="mt-4 grid gap-2">
              <div className="text-xs font-black text-cyan-200">Success criteria</div>
              {selected.successCriteria.map((item) => <p key={item} className="text-sm text-cyan-50/80">- {item}</p>)}
            </div>
            <div className="mt-4 grid gap-2">
              <div className="text-xs font-black text-cyan-200">Proof required</div>
              {selected.proofRequired.map((item) => <p key={item} className="text-sm text-cyan-50/80">- {item}</p>)}
            </div>
          </section>

          <section className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
            <h2 className="text-xl font-black">Recent Runs</h2>
            <div className="mt-4 space-y-3">
              {runs.length === 0 ? (
                <p className="text-sm text-slate-400">尚未建立 agent run。</p>
              ) : (
                runs.map((run) => (
                  <div key={run.id} className="rounded-md border border-white/10 bg-slate-950 p-3">
                    <div className="text-sm font-black">{run.title}</div>
                    <div className="mt-1 text-xs text-slate-400">{run.agentRole} · {run.workspace}</div>
                    <div className="mt-2 text-xs text-slate-300">{run.handoff}</div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
            <h2 className="text-xl font-black">idol-platform 規則</h2>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              目前是安全的 MVP 控制台，不會自動 spawn 真實 Codex session。等 L3 場景測試穩定後，再接 GitHub / Linear / Codex App Server 或其他 runner。
            </p>
          </section>
        </aside>
      </div>
    </main>
  );
}
