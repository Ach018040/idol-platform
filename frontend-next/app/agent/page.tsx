"use client";

import Link from "next/link";
import { useState } from "react";

type AgentResponse = {
  answer: string;
  summary: string;
  evidence: Array<{
    type: string;
    title: string;
    snippet: string;
    href?: string;
  }>;
  traces: Array<{
    tool: string;
    input: string;
    hits: number;
  }>;
  suggestedQuestions: string[];
};

export default function AgentPage() {
  const [question, setQuestion] = useState("為何有些成員不常更新卻仍然排行靠前？");
  const [result, setResult] = useState<AgentResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function ask(nextQuestion?: string) {
    const finalQuestion = (nextQuestion ?? question).trim();
    if (!finalQuestion) return;

    setLoading(true);
    setError(null);
    setQuestion(finalQuestion);

    try {
      const response = await fetch("/api/agent/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: finalQuestion }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "agent request failed");
      }
      setResult(data);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#070b16_0%,#111827_100%)] px-4 py-14 text-white">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="space-y-4">
          <div className="inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-1 text-xs uppercase tracking-[0.2em] text-cyan-200">
            AI Agent v4
          </div>
          <h1 className="text-4xl font-black">idol-platform 智能代理</h1>
          <p className="max-w-3xl text-sm leading-7 text-zinc-300">
            這是一個直接連接排行榜、insights 與 brain 知識頁的工具型 Agent。
            現階段先以平台資料檢索與解釋為核心，後續可再接完整外部模型與 workflow。
          </p>
          <div className="flex flex-wrap gap-3 text-sm">
            <Link href="/" className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-zinc-300 hover:bg-white/10">
              返回首頁
            </Link>
            <Link href="/brain" className="rounded-xl border border-violet-400/20 bg-violet-400/10 px-4 py-2 text-violet-200 hover:bg-violet-400/20">
              前往 Brain
            </Link>
            <Link href="/insights" className="rounded-xl border border-amber-400/20 bg-amber-400/10 px-4 py-2 text-amber-200 hover:bg-amber-400/20">
              查看 Insights
            </Link>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <div className="flex flex-col gap-3">
            <textarea
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              className="min-h-28 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-500"
              placeholder="例如：為何某位成員排行靠前？某個團體最近為何上升？目前公式有哪些限制？"
            />
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => ask()}
                disabled={loading}
                className="rounded-xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:opacity-50"
              >
                {loading ? "分析中..." : "開始分析"}
              </button>
              {[
                "為何有些成員不常更新卻仍然排行靠前？",
                "團體榜和成員榜為何有時不一致？",
                "目前 v2 公式最需要補強的是什麼？",
              ].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => ask(preset)}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-300 hover:bg-white/10"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>
        </section>

        {error ? (
          <section className="rounded-3xl border border-red-400/20 bg-red-500/10 p-5 text-sm text-red-200">
            {error}
          </section>
        ) : null}

        {result ? (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.8fr)]">
            <section className="space-y-6">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <h2 className="text-lg font-semibold text-cyan-200">Agent 回答</h2>
                <p className="mt-4 text-sm leading-8 text-zinc-200">{result.answer}</p>
                <div className="mt-5 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4 text-sm text-cyan-100">
                  {result.summary}
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <h2 className="text-lg font-semibold text-white">證據與資料來源</h2>
                <div className="mt-4 grid gap-3">
                  {result.evidence.map((item, index) => (
                    <div key={`${item.type}-${item.title}-${index}`} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <div className="text-xs uppercase tracking-[0.18em] text-cyan-300">{item.type}</div>
                      <div className="mt-2 text-base font-semibold text-white">{item.title}</div>
                      <p className="mt-2 text-sm leading-7 text-zinc-300">{item.snippet}</p>
                      {item.href ? (
                        <Link href={item.href} className="mt-3 inline-block text-sm text-cyan-300 hover:text-cyan-200">
                          前往相關頁面
                        </Link>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <aside className="space-y-6">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <h2 className="text-lg font-semibold text-white">工具追蹤</h2>
                <div className="mt-4 space-y-3">
                  {result.traces.map((trace) => (
                    <div key={trace.tool} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <div className="text-sm font-medium text-white">{trace.tool}</div>
                      <div className="mt-1 text-xs text-zinc-400">query: {trace.input}</div>
                      <div className="mt-2 text-sm text-cyan-300">hits: {trace.hits}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <h2 className="text-lg font-semibold text-white">追問建議</h2>
                <div className="mt-4 flex flex-col gap-3">
                  {result.suggestedQuestions.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => ask(item)}
                      className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-left text-sm text-zinc-200 hover:bg-white/10"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        ) : null}
      </div>
    </main>
  );
}
