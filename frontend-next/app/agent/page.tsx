"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { compareV4Entities, type V4Entity, type V4EntityPayload } from "@/lib/v4-entities";

type AgentResponse = {
  answer: string;
  summary: string;
  intent?: string;
  mode?: string;
  provider?: string;
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

type AlertDraft = {
  id: string;
  entityId: string;
  entityName: string;
  rule: string;
  createdAt: string;
};

type ForumIdentity = {
  token: string;
  displayName: string;
};

type RemoteWatchlistItem = {
  id: string;
  entity_id: string;
};

type RemoteAlertItem = {
  id: string;
  entity_id: string;
  entity_name: string;
  rule_type: string;
  created_at: string;
};

const DEFAULT_QUESTION = "為何有些成員不常更新卻仍然排在前面？";
const WATCHLIST_KEY = "idol_v4_watchlist";
const ALERTS_KEY = "idol_v4_alerts";
const FORUM_USER_KEY = "forum_user_v2";
const PRESET_QUESTIONS = [
  "為何有些成員不常更新卻仍然排在前面？",
  "團體榜和成員榜為何有時不一致？",
  "目前 v2 公式最需要補強的是什麼？",
  "桜野杏理為何目前分數這樣算？",
];
const DEFAULT_SUGGESTIONS = [
  "為何這位成員的溫度分數比更新更頻繁的人高？",
  "比較兩個團體目前的分數差異與 freshness 影響",
  "目前平台還缺哪些資料，才可以把公式再做準？",
];

function fmt(value: number | null | undefined, digits = 1) {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n.toFixed(digits) : "0";
}

function readStoredArray<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStoredArray<T>(key: string, value: T[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function readForumIdentity(): ForumIdentity | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(FORUM_USER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { token?: string; display_name?: string };
    if (!parsed?.token) return null;
    return {
      token: parsed.token,
      displayName: parsed.display_name || "Agent User",
    };
  } catch {
    return null;
  }
}

export default function AgentPage() {
  const [question, setQuestion] = useState(DEFAULT_QUESTION);
  const [result, setResult] = useState<AgentResponse | null>(null);
  const [entities, setEntities] = useState<V4EntityPayload | null>(null);
  const [query, setQuery] = useState("");
  const [leftId, setLeftId] = useState("");
  const [rightId, setRightId] = useState("");
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [alerts, setAlerts] = useState<AlertDraft[]>([]);
  const [forumIdentity, setForumIdentity] = useState<ForumIdentity | null>(null);
  const [storageMode, setStorageMode] = useState<"local" | "cloud">("local");
  const [syncingStorage, setSyncingStorage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setWatchlist(readStoredArray<string>(WATCHLIST_KEY));
    setAlerts(readStoredArray<AlertDraft>(ALERTS_KEY));
    setForumIdentity(readForumIdentity());

    fetch("/api/v4/entities", { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error(`entities ${response.status}`);
        return response.json();
      })
      .then((payload: V4EntityPayload) => {
        setEntities(payload);
        setLeftId(payload.members[0]?.id || payload.groups[0]?.id || "");
        setRightId(payload.members[1]?.id || payload.groups[1]?.id || "");
      })
      .catch((err) => setError(String(err)));
  }, []);

  const allEntities = useMemo(() => [...(entities?.members || []), ...(entities?.groups || [])], [entities]);
  const entityById = useMemo(() => new Map(allEntities.map((entity) => [entity.id, entity])), [allEntities]);
  const left = entityById.get(leftId);
  const right = entityById.get(rightId);
  const comparison = left && right ? compareV4Entities(left, right) : null;

  const filteredEntities = useMemo(() => {
    const term = query.trim().toLowerCase();
    const source = allEntities.slice(0, 80);
    if (!term) return source.slice(0, 18);
    return source
      .filter((entity) => `${entity.name} ${entity.subtitle} ${entity.kind}`.toLowerCase().includes(term))
      .slice(0, 18);
  }, [allEntities, query]);

  const watchedEntities = watchlist.map((id) => entityById.get(id)).filter(Boolean) as V4Entity[];

  useEffect(() => {
    if (!forumIdentity || allEntities.length === 0) return;

    let cancelled = false;

    async function syncCloudState() {
      const identity = forumIdentity;
      if (!identity) return;

      setSyncingStorage(true);
      try {
        const localWatch = readStoredArray<string>(WATCHLIST_KEY);
        const localAlerts = readStoredArray<AlertDraft>(ALERTS_KEY);

        const [watchResponse, alertResponse] = await Promise.all([
          fetch(`/api/v4/watchlist?token=${encodeURIComponent(identity.token)}`, { cache: "no-store" }),
          fetch(`/api/v4/alerts?token=${encodeURIComponent(identity.token)}`, { cache: "no-store" }),
        ]);

        const watchPayload = await watchResponse.json();
        const alertPayload = await alertResponse.json();

        const remoteWatchIds = new Set<string>((watchPayload.items || []).map((item: RemoteWatchlistItem) => item.entity_id));
        const remoteAlertKeys = new Set<string>(
          (alertPayload.items || []).map((item: RemoteAlertItem) => `${item.entity_id}:${item.rule_type}`),
        );

        await Promise.all(
          localWatch
            .filter((entityId) => !remoteWatchIds.has(entityId))
            .map((entityId) => {
              const entity = entityById.get(entityId);
              if (!entity) return Promise.resolve();
              return fetch("/api/v4/watchlist", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  token: identity.token,
                  displayName: identity.displayName,
                  entityId: entity.id,
                  entityKind: entity.kind,
                  entityName: entity.name,
                }),
              });
            }),
        );

        await Promise.all(
          localAlerts
            .filter((alert) => !remoteAlertKeys.has(`${alert.entityId}:${alert.rule}`))
            .map((alert) => {
              const entity = entityById.get(alert.entityId);
              if (!entity) return Promise.resolve();
              return fetch("/api/v4/alerts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  token: identity.token,
                  displayName: identity.displayName,
                  entityId: entity.id,
                  entityKind: entity.kind,
                  entityName: entity.name,
                  ruleType: alert.rule,
                }),
              });
            }),
        );

        const [watchRefresh, alertRefresh] = await Promise.all([
          fetch(`/api/v4/watchlist?token=${encodeURIComponent(identity.token)}`, { cache: "no-store" }).then((res) => res.json()),
          fetch(`/api/v4/alerts?token=${encodeURIComponent(identity.token)}`, { cache: "no-store" }).then((res) => res.json()),
        ]);

        if (cancelled) return;

        const nextWatchlist = (watchRefresh.items || []).map((item: RemoteWatchlistItem) => item.entity_id);
        const nextAlerts = (alertRefresh.items || []).map((item: RemoteAlertItem) => ({
          id: item.id,
          entityId: item.entity_id,
          entityName: item.entity_name,
          rule: item.rule_type,
          createdAt: item.created_at,
        }));

        setWatchlist(nextWatchlist);
        setAlerts(nextAlerts);
        writeStoredArray(WATCHLIST_KEY, nextWatchlist);
        writeStoredArray(ALERTS_KEY, nextAlerts);
        setStorageMode("cloud");
      } catch {
        if (!cancelled) setStorageMode("local");
      } finally {
        if (!cancelled) setSyncingStorage(false);
      }
    }

    void syncCloudState();

    return () => {
      cancelled = true;
    };
  }, [forumIdentity, allEntities.length, entityById]);

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
      if (!response.ok) throw new Error(data?.error || "agent request failed");
      setResult(data);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  async function toggleWatch(entity: V4Entity) {
    const wasWatching = watchlist.includes(entity.id);
    const next = wasWatching ? watchlist.filter((id) => id !== entity.id) : [entity.id, ...watchlist].slice(0, 12);

    setWatchlist(next);
    writeStoredArray(WATCHLIST_KEY, next);

    const identity = forumIdentity;
    if (!identity) return;

    try {
      if (wasWatching) {
        await fetch(`/api/v4/watchlist?token=${encodeURIComponent(identity.token)}&entityId=${encodeURIComponent(entity.id)}`, {
          method: "DELETE",
        });
      } else {
        await fetch("/api/v4/watchlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: identity.token,
            displayName: identity.displayName,
            entityId: entity.id,
            entityKind: entity.kind,
            entityName: entity.name,
          }),
        });
      }
      setStorageMode("cloud");
    } catch {
      setStorageMode("local");
    }
  }

  async function addAlert(entity: V4Entity, rule: string) {
    const optimistic = {
      id: `${entity.id}:${Date.now()}`,
      entityId: entity.id,
      entityName: entity.name,
      rule,
      createdAt: new Date().toISOString(),
    };
    const next = [optimistic, ...alerts].slice(0, 20);
    setAlerts(next);
    writeStoredArray(ALERTS_KEY, next);

    const identity = forumIdentity;
    if (!identity) return;

    try {
      const response = await fetch("/api/v4/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: identity.token,
          displayName: identity.displayName,
          entityId: entity.id,
          entityKind: entity.kind,
          entityName: entity.name,
          ruleType: rule,
        }),
      });
      const payload = await response.json();
      if (payload.item?.id) {
        const remoteNext = [
          {
            id: payload.item.id,
            entityId: payload.item.entity_id,
            entityName: payload.item.entity_name,
            rule: payload.item.rule_type,
            createdAt: payload.item.created_at,
          },
          ...alerts,
        ].slice(0, 20);
        setAlerts(remoteNext);
        writeStoredArray(ALERTS_KEY, remoteNext);
      }
      setStorageMode("cloud");
    } catch {
      setStorageMode("local");
    }
  }

  async function removeAlert(id: string) {
    const next = alerts.filter((alert) => alert.id !== id);
    setAlerts(next);
    writeStoredArray(ALERTS_KEY, next);

    const identity = forumIdentity;
    if (!identity) return;

    try {
      await fetch(`/api/v4/alerts?token=${encodeURIComponent(identity.token)}&id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      setStorageMode("cloud");
    } catch {
      setStorageMode("local");
    }
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#070b16_0%,#111827_100%)] px-4 py-10 text-white">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="space-y-5">
          <div className="inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-1 text-xs uppercase tracking-[0.2em] text-cyan-200">
            AI Agent v4
          </div>
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
            <div>
              <h1 className="text-4xl font-black md:text-5xl">idol-platform 智能代理</h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-zinc-300">
                這是一個直接連接排行榜、insights 與 brain 知識頁的工具型 Agent。現階段先以平台資料檢索與解釋為核心，
                並把 compare、watchlist、alerts 做成可互動工作台，讓分析不只停留在單次回答。
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-zinc-300">
              <div className="text-xs uppercase tracking-[0.18em] text-cyan-300">Runtime</div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <span>Entity schema</span>
                <span className="text-right text-cyan-200">{entities?.schemaVersion || "loading"}</span>
                <span>Provider</span>
                <span className="text-right text-cyan-200">{result?.provider || "local"}</span>
                <span>Mode</span>
                <span className="text-right text-cyan-200">{result?.mode || "standby"}</span>
                <span>Storage</span>
                <span className="text-right text-cyan-200">
                  {syncingStorage ? "syncing" : storageMode === "cloud" ? "cloud" : "local"}
                </span>
              </div>
            </div>
          </div>
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
              placeholder="輸入你要問的平台問題，例如某位成員為何上榜、團體榜差異、公式解釋或 freshness 影響。"
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
              {PRESET_QUESTIONS.map((preset) => (
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

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.75fr)]">
          <section className="space-y-6">
            {result ? (
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold text-cyan-200">Agent 回答</h2>
                  {result.intent ? (
                    <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-100">
                      {result.intent}
                    </span>
                  ) : null}
                </div>
                <p className="mt-4 whitespace-pre-wrap text-sm leading-8 text-zinc-200">{result.answer}</p>
                <div className="mt-5 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4 text-sm text-cyan-100">
                  {result.summary}
                </div>
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-6 text-sm leading-7 text-zinc-300">
                目前還沒有回答內容。你可以直接提問，例如某位成員為何上榜、團體榜為何跳號，或目前 v2 公式還有哪些盲點。
              </div>
            )}

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <h2 className="text-lg font-semibold text-white">Compare 比較</h2>
                <p className="mt-2 text-sm text-zinc-400">直接比較兩個 entity 的分數、資料新鮮度與目前差距。</p>
                <div className="mt-4 grid gap-3">
                  <select
                    value={leftId}
                    onChange={(event) => setLeftId(event.target.value)}
                    className="rounded-xl border border-white/10 bg-slate-950 px-3 py-3 text-sm text-white"
                  >
                    {allEntities.map((entity) => (
                      <option key={entity.id} value={entity.id}>
                        {entity.kind === "member" ? "成員" : "團體"}｜{entity.name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={rightId}
                    onChange={(event) => setRightId(event.target.value)}
                    className="rounded-xl border border-white/10 bg-slate-950 px-3 py-3 text-sm text-white"
                  >
                    {allEntities.map((entity) => (
                      <option key={entity.id} value={entity.id}>
                        {entity.kind === "member" ? "成員" : "團體"}｜{entity.name}
                      </option>
                    ))}
                  </select>
                </div>
                {left && right && comparison ? (
                  <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-300">
                    <div className="grid grid-cols-2 gap-3">
                      <span>{left.name}</span>
                      <span className="text-right text-cyan-200">{fmt(left.score)}</span>
                      <span>{right.name}</span>
                      <span className="text-right text-violet-200">{fmt(right.score)}</span>
                    </div>
                    <div className="mt-4 text-zinc-400">
                      分數差 {fmt(Math.abs(comparison.scoreDelta))}，更新天數差 {fmt(Math.abs(comparison.freshnessDelta), 0)} 天。
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <h2 className="text-lg font-semibold text-white">Watchlist 追蹤清單</h2>
                <p className="mt-2 text-sm text-zinc-400">
                  {forumIdentity ? "已登入論壇帳號，追蹤清單會同步保存到雲端。" : "尚未登入論壇帳號，追蹤清單先保存在本機。"}
                </p>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="mt-4 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm text-white outline-none placeholder:text-zinc-500"
                  placeholder="搜尋成員或團體..."
                />
                <div className="mt-4 max-h-72 space-y-2 overflow-y-auto pr-1">
                  {filteredEntities.map((entity) => (
                    <button
                      key={entity.id}
                      type="button"
                      onClick={() => void toggleWatch(entity)}
                      className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-left hover:bg-white/10"
                    >
                      <span>
                        <span className="block text-sm font-medium text-white">{entity.name}</span>
                        <span className="text-xs text-zinc-400">
                          {entity.subtitle}｜{fmt(entity.score)} 分
                        </span>
                      </span>
                      <span className="text-xs text-cyan-200">{watchlist.includes(entity.id) ? "已追蹤" : "加入追蹤"}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-lg font-semibold text-white">證據與資料來源</h2>
              {result?.evidence?.length ? (
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {result.evidence.map((item, index) => (
                    <div key={`${item.type}-${item.title}-${index}`} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <div className="text-xs uppercase tracking-[0.18em] text-cyan-300">{item.type}</div>
                      <div className="mt-2 text-base font-semibold text-white">{item.title}</div>
                      <p className="mt-2 text-sm leading-7 text-zinc-300">{item.snippet}</p>
                      {item.href ? (
                        <Link href={item.href} className="mt-3 inline-block text-sm text-cyan-300 hover:text-cyan-200">
                          查看來源
                        </Link>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-zinc-400">送出問題後，這裡會顯示本次回答引用到的資料線索與來源。</p>
              )}
            </div>
          </section>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-lg font-semibold text-white">Alerts 提醒草稿</h2>
              <p className="mt-2 text-sm text-zinc-400">
                {forumIdentity ? "提醒草稿會綁定目前論壇 token 並同步到 Supabase。" : "尚未登入論壇帳號，提醒草稿先保留在本機。"}
              </p>
              <div className="mt-4 space-y-3">
                {watchedEntities.length ? (
                  watchedEntities.map((entity) => (
                    <div key={entity.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-semibold text-white">{entity.name}</div>
                          <div className="mt-1 text-xs text-zinc-400">
                            {entity.subtitle}｜{fmt(entity.score)} 分｜更新 {fmt(entity.freshnessDays, 0)} 天前
                          </div>
                        </div>
                        <button type="button" onClick={() => void toggleWatch(entity)} className="text-xs text-zinc-400 hover:text-white">
                          移出追蹤
                        </button>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => void addAlert(entity, "分數下降 5 分以上")}
                          className="rounded-lg border border-pink-400/20 bg-pink-400/10 px-3 py-2 text-xs text-pink-100"
                        >
                          分數下滑
                        </button>
                        <button
                          type="button"
                          onClick={() => void addAlert(entity, "14 天沒有新的資料更新")}
                          className="rounded-lg border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-xs text-amber-100"
                        >
                          更新停滯
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-4 text-sm text-zinc-400">
                    先把你要觀察的成員或團體加入 watchlist，這裡才會出現提醒設定。
                  </p>
                )}
              </div>
              {alerts.length ? (
                <div className="mt-5 space-y-2">
                  {alerts.map((alert) => (
                    <div key={alert.id} className="rounded-xl border border-cyan-300/10 bg-cyan-300/10 p-3 text-sm text-cyan-50">
                      <div className="flex items-start justify-between gap-3">
                        <span>
                          {alert.entityName}｜{alert.rule}
                        </span>
                        <button type="button" onClick={() => void removeAlert(alert.id)} className="text-xs text-cyan-200/70 hover:text-white">
                          移除
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-lg font-semibold text-white">工具追蹤</h2>
              <div className="mt-4 space-y-3">
                {(result?.traces || []).map((trace) => (
                  <div key={`${trace.tool}-${trace.input}`} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="text-sm font-medium text-white">{trace.tool}</div>
                    <div className="mt-1 text-xs text-zinc-400">query: {trace.input}</div>
                    <div className="mt-2 text-sm text-cyan-300">hits: {trace.hits}</div>
                  </div>
                ))}
                {!result?.traces?.length ? <p className="text-sm text-zinc-400">送出問題後，這裡會顯示本次實際走過的資料工具。</p> : null}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-lg font-semibold text-white">建議提問</h2>
              <div className="mt-4 flex flex-col gap-3">
                {(result?.suggestedQuestions || DEFAULT_SUGGESTIONS).map((item) => (
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
      </div>
    </main>
  );
}
