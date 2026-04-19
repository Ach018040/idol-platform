"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import {
  DEFAULT_AGENT_ROLE_ID,
  IDOL_AGENT_ROLES,
  getIdolAgentRole,
  type IdolAgentRoleId,
} from "@/lib/idol-agent-roles";
import { compareV4Entities, type V4Entity, type V4EntityPayload } from "@/lib/v4-entities";

type AgentResponse = {
  answer: string;
  summary: string;
  role: IdolAgentRoleId;
  roleLabel: string;
  sourceAgentName: string;
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

const WATCHLIST_KEY = "idol_v4_watchlist";
const ALERTS_KEY = "idol_v4_alerts";
const FORUM_USER_KEY = "forum_user_v2";

function fmt(value: number | null | undefined, digits = 1) {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n.toFixed(digits) : "0";
}

function kindLabel(kind: V4Entity["kind"]) {
  return kind === "member" ? "成員" : "團體";
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

function syncLabel(storageMode: "local" | "cloud", syncingStorage: boolean) {
  if (syncingStorage) return "同步中";
  return storageMode === "cloud" ? "已同步到雲端" : "僅保存在本機";
}

export default function AgentWorkbench() {
  const [question, setQuestion] = useState(getIdolAgentRole(DEFAULT_AGENT_ROLE_ID).defaultQuestions[0]);
  const [selectedRole, setSelectedRole] = useState<IdolAgentRoleId>(DEFAULT_AGENT_ROLE_ID);
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

  const role = useMemo(() => getIdolAgentRole(selectedRole), [selectedRole]);

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

  async function ask(nextQuestion?: string, nextRole?: IdolAgentRoleId) {
    const finalQuestion = (nextQuestion ?? question).trim();
    const finalRole = nextRole ?? selectedRole;
    if (!finalQuestion) return;

    setLoading(true);
    setError(null);
    setQuestion(finalQuestion);
    setSelectedRole(finalRole);

    try {
      const response = await fetch("/api/agent/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: finalQuestion, role: finalRole }),
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

  async function addAlert(entity: V4Entity, ruleName: string) {
    const optimistic = {
      id: `${entity.id}:${Date.now()}`,
      entityId: entity.id,
      entityName: entity.name,
      rule: ruleName,
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
          ruleType: ruleName,
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
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#15306d_0%,rgba(21,48,109,0)_28%),radial-gradient(circle_at_top_right,#7c2d12_0%,rgba(124,45,18,0)_24%),linear-gradient(180deg,#050816_0%,#101827_52%,#172033_100%)] px-4 py-8 text-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <section className="overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(135deg,rgba(10,14,24,0.98)_0%,rgba(16,28,54,0.94)_56%,rgba(23,32,51,0.96)_100%)] shadow-[0_30px_90px_rgba(0,0,0,0.35)]">
          <div className="grid gap-8 px-6 py-8 lg:grid-cols-[minmax(0,1.15fr)_340px] lg:px-8 lg:py-10">
            <div className="space-y-5">
              <div className="inline-flex rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-1 text-xs uppercase tracking-[0.24em] text-cyan-100">Agent Workspace</div>
              <div className="space-y-4">
                <h1 className="max-w-4xl text-4xl font-black tracking-tight text-white md:text-5xl">用一個分析工作台，快速讀懂 idol-platform 的排名、公式與資料訊號</h1>
                <p className="max-w-3xl text-sm leading-8 text-slate-200/90">這裡是給你直接使用的平台分析介面。你可以依題目切換角色，追問成員與團體為何上榜、公式如何影響分數、資料更新是否可信，以及市場觀察背後的依據。</p>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4"><div className="text-xs uppercase tracking-[0.18em] text-cyan-200">01</div><div className="mt-2 text-lg font-semibold text-white">選角色</div><p className="mt-2 text-sm leading-6 text-zinc-300">依你的問題切到排名、公式、資料管線、產品策略或市場研究角度。</p></div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4"><div className="text-xs uppercase tracking-[0.18em] text-cyan-200">02</div><div className="mt-2 text-lg font-semibold text-white">問問題</div><p className="mt-2 text-sm leading-6 text-zinc-300">直接輸入成員、團體、公式或 freshness 相關問題，快速得到可讀的分析結果。</p></div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4"><div className="text-xs uppercase tracking-[0.18em] text-cyan-200">03</div><div className="mt-2 text-lg font-semibold text-white">延伸操作</div><p className="mt-2 text-sm leading-6 text-zinc-300">把關注對象加入比較、追蹤與提醒草稿，讓單次查詢延伸成持續觀察。</p></div>
              </div>
              <div className="flex flex-wrap gap-3 text-sm">
                <Link href="/" className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-zinc-200 transition hover:bg-white/10">返回首頁</Link>
                <Link href="/brain" className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-cyan-100 transition hover:bg-cyan-300/20">前往 Brain</Link>
                <Link href="/insights" className="rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-2 text-amber-100 transition hover:bg-amber-300/20">查看 Insights</Link>
              </div>
            </div>
            <div className="grid gap-4 self-start">
              <div className="rounded-[28px] border border-white/10 bg-black/25 p-5 backdrop-blur">
                <div className="text-xs uppercase tracking-[0.18em] text-cyan-300">工作狀態</div>
                <div className="mt-4 space-y-3 text-sm text-zinc-300">
                  <div className="flex items-center justify-between gap-4"><span>目前角色</span><span className="font-medium text-cyan-100">{role.shortLabel}</span></div>
                  <div className="flex items-center justify-between gap-4"><span>回答模式</span><span className="font-medium text-cyan-100">{result?.mode || "standby"}</span></div>
                  <div className="flex items-center justify-between gap-4"><span>模型來源</span><span className="font-medium text-cyan-100">{result?.provider || "local"}</span></div>
                  <div className="flex items-center justify-between gap-4"><span>追蹤同步</span><span className="font-medium text-cyan-100">{syncLabel(storageMode, syncingStorage)}</span></div>
                </div>
              </div>
              <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
                <div className="text-xs uppercase tracking-[0.18em] text-cyan-300">使用建議</div>
                <ul className="mt-4 space-y-3 text-sm leading-6 text-zinc-300">
                  <li>先選一個最接近問題的角色，答案會更聚焦，不會只回通用摘要。</li>
                  <li>想看實際差異時，搭配下方的比較區塊與追蹤清單一起使用。</li>
                  <li>如果要長期觀察某位成員或團體，建議加入提醒草稿與追蹤。</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {IDOL_AGENT_ROLES.map((item) => (
            <button key={item.id} type="button" onClick={() => { setSelectedRole(item.id); setQuestion(item.defaultQuestions[0]); }} className={`rounded-[28px] border p-5 text-left transition ${selectedRole === item.id ? "border-cyan-300/40 bg-cyan-300/10 shadow-[0_18px_40px_rgba(34,211,238,0.12)]" : "border-white/10 bg-[rgba(12,16,28,0.7)] hover:border-white/20 hover:bg-white/8"}`}>
              <div className="flex items-start justify-between gap-3"><div className="text-xs uppercase tracking-[0.18em] text-cyan-300">{item.shortLabel}</div><span className="rounded-full border border-white/10 px-2 py-1 text-[11px] text-zinc-400">{item.sourceCategory}</span></div>
              <div className="mt-3 text-lg font-semibold text-white">{item.label}</div>
              <div className="mt-2 text-sm leading-6 text-zinc-300">{item.tagline}</div>
              <div className="mt-4 text-xs text-zinc-500">Source: {item.sourceAgentName}</div>
            </button>
          ))}
        </section>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.28fr)_minmax(330px,0.72fr)]">
          <section className="space-y-6">
            <section className="rounded-[32px] border border-white/10 bg-[rgba(10,14,24,0.82)] p-6 shadow-[0_22px_70px_rgba(0,0,0,0.28)]">
              <div className="flex flex-col gap-4">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-zinc-300">
                  <div className="text-xs uppercase tracking-[0.18em] text-cyan-300">角色焦點</div>
                  <div className="mt-2 text-lg font-semibold text-white">{role.label}</div>
                  <p className="mt-2 leading-7 text-zinc-300">{role.mission}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-cyan-100">{role.focus.map((item) => <span key={item} className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1">{item}</span>)}</div>
                </div>
                <textarea value={question} onChange={(event) => setQuestion(event.target.value)} className="min-h-32 rounded-[24px] border border-white/10 bg-black/25 px-4 py-4 text-sm leading-7 text-white outline-none placeholder:text-zinc-500" placeholder="例如：桜野杏理目前分數為何這樣算？或是團體排行為何和成員榜不一致？也可以問 v2 公式、freshness 與資料可信度。" />
                <div className="flex flex-wrap gap-3">
                  <button type="button" onClick={() => ask()} disabled={loading} className="rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:opacity-50">{loading ? "分析中..." : "開始分析"}</button>
                  {role.defaultQuestions.map((preset) => <button key={preset} type="button" onClick={() => ask(preset)} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/10">{preset}</button>)}
                </div>
              </div>
            </section>

            {error ? <section className="rounded-[28px] border border-red-400/20 bg-red-500/10 p-5 text-sm text-red-200">{error}</section> : null}

            {result ? (
              <section className="rounded-[32px] border border-white/10 bg-[rgba(10,14,24,0.84)] p-6">
                <div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-semibold text-cyan-200">分析結果</h2><span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-100">{result.roleLabel}</span>{result.intent ? <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300">{result.intent}</span> : null}</div>
                <div className="mt-3 text-xs uppercase tracking-[0.16em] text-zinc-500">Adapted from {result.sourceAgentName}</div>
                <p className="mt-5 whitespace-pre-wrap text-sm leading-8 text-zinc-200">{result.answer}</p>
                <div className="mt-5 rounded-[24px] border border-cyan-400/20 bg-cyan-400/10 p-4 text-sm leading-7 text-cyan-100">{result.summary}</div>
              </section>
            ) : (
              <section className="rounded-[32px] border border-dashed border-white/10 bg-[rgba(10,14,24,0.78)] p-6 text-sm leading-7 text-zinc-300">送出問題後，這裡會顯示本次分析結果。你可以先從「開始分析」送出目前問題，或直接點一個預設問題，快速看這個角色如何解讀排名、公式與資料更新。</section>
            )}

            <div className="grid gap-6 lg:grid-cols-2">
              <section className="rounded-[32px] border border-white/10 bg-[rgba(10,14,24,0.82)] p-6">
                <h2 className="text-lg font-semibold text-white">Compare 比較</h2>
                <p className="mt-2 text-sm text-zinc-400">選兩個 entity 並直接查看分數與 freshness 差異。</p>
                <div className="mt-4 grid gap-3">
                  <select value={leftId} onChange={(event) => setLeftId(event.target.value)} className="rounded-2xl border border-white/10 bg-slate-950 px-3 py-3 text-sm text-white">{allEntities.map((entity) => <option key={entity.id} value={entity.id}>{kindLabel(entity.kind)}｜{entity.name}</option>)}</select>
                  <select value={rightId} onChange={(event) => setRightId(event.target.value)} className="rounded-2xl border border-white/10 bg-slate-950 px-3 py-3 text-sm text-white">{allEntities.map((entity) => <option key={entity.id} value={entity.id}>{kindLabel(entity.kind)}｜{entity.name}</option>)}</select>
                </div>
                {left && right && comparison ? <div className="mt-5 rounded-[24px] border border-white/10 bg-black/20 p-4 text-sm text-zinc-300"><div className="grid grid-cols-2 gap-3"><span>{left.name}</span><span className="text-right text-cyan-200">{fmt(left.score)}</span><span>{right.name}</span><span className="text-right text-violet-200">{fmt(right.score)}</span></div><div className="mt-4 text-zinc-400">分數差 {fmt(Math.abs(comparison.scoreDelta))}，最近更新差 {fmt(Math.abs(comparison.freshnessDelta), 0)} 天。</div></div> : null}
              </section>

              <section className="rounded-[32px] border border-white/10 bg-[rgba(10,14,24,0.82)] p-6">
                <h2 className="text-lg font-semibold text-white">Watchlist 追蹤清單</h2>
                <p className="mt-2 text-sm text-zinc-400">{forumIdentity ? "已登入論壇帳號，追蹤清單會同步保存到雲端。" : "尚未登入論壇帳號，追蹤清單先保存在本機。"}</p>
                <input value={query} onChange={(event) => setQuery(event.target.value)} className="mt-4 w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-3 text-sm text-white outline-none placeholder:text-zinc-500" placeholder="搜尋成員或團體..." />
                <div className="mt-4 max-h-72 space-y-2 overflow-y-auto pr-1">{filteredEntities.map((entity) => <button key={entity.id} type="button" onClick={() => void toggleWatch(entity)} className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-left transition hover:bg-white/10"><span><span className="block text-sm font-medium text-white">{entity.name}</span><span className="text-xs text-zinc-400">{entity.subtitle}｜{fmt(entity.score)} 分</span></span><span className="text-xs text-cyan-200">{watchlist.includes(entity.id) ? "已追蹤" : "加入追蹤"}</span></button>)}</div>
              </section>
            </div>

            <section className="rounded-[32px] border border-white/10 bg-[rgba(10,14,24,0.82)] p-6">
              <h2 className="text-lg font-semibold text-white">證據與資料來源</h2>
              {result?.evidence?.length ? <div className="mt-4 grid gap-3 md:grid-cols-2">{result.evidence.map((item, index) => <div key={`${item.type}-${item.title}-${index}`} className="rounded-[24px] border border-white/10 bg-black/20 p-4"><div className="text-xs uppercase tracking-[0.18em] text-cyan-300">{item.type}</div><div className="mt-2 text-base font-semibold text-white">{item.title}</div><p className="mt-2 text-sm leading-7 text-zinc-300">{item.snippet}</p>{item.href ? <Link href={item.href} className="mt-3 inline-block text-sm text-cyan-300 hover:text-cyan-200">查看來源</Link> : null}</div>)}</div> : <p className="mt-3 text-sm text-zinc-400">送出問題後，這裡會顯示本次回答所引用的資料片段。若目前沒有證據卡，通常代表回答以 insights 或 brain 的整理內容為主。</p>}
            </section>
          </section>

          <aside className="space-y-6">
            <section className="rounded-[32px] border border-white/10 bg-[rgba(10,14,24,0.82)] p-6">
              <h2 className="text-lg font-semibold text-white">Alerts 提醒草稿</h2>
              <p className="mt-2 text-sm text-zinc-400">{forumIdentity ? "提醒草稿會綁定目前論壇 token 並同步到 Supabase。" : "尚未登入論壇帳號，提醒草稿先保留在本機。"}</p>
              <div className="mt-4 space-y-3">{watchedEntities.length ? watchedEntities.map((entity) => <div key={entity.id} className="rounded-[24px] border border-white/10 bg-black/20 p-4"><div className="flex items-start justify-between gap-3"><div><div className="font-semibold text-white">{entity.name}</div><div className="mt-1 text-xs text-zinc-400">{entity.subtitle}｜{fmt(entity.score)} 分｜最近更新 {fmt(entity.freshnessDays, 0)} 天前</div></div><button type="button" onClick={() => void toggleWatch(entity)} className="text-xs text-zinc-400 hover:text-white">移出追蹤</button></div><div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={() => void addAlert(entity, "分數下降 5 分以上")} className="rounded-xl border border-pink-400/20 bg-pink-400/10 px-3 py-2 text-xs text-pink-100">分數下降</button><button type="button" onClick={() => void addAlert(entity, "14 天內沒有新更新")} className="rounded-xl border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-xs text-amber-100">更新停滯</button></div></div>) : <p className="rounded-[24px] border border-dashed border-white/10 bg-black/20 p-4 text-sm text-zinc-400">先從左側把成員或團體加入追蹤，這裡才會出現可建立的提醒草稿。</p>}</div>
              {alerts.length ? <div className="mt-5 space-y-2">{alerts.map((alert) => <div key={alert.id} className="rounded-xl border border-cyan-300/10 bg-cyan-300/10 p-3 text-sm text-cyan-50"><div className="flex items-start justify-between gap-3"><span>{alert.entityName}｜{alert.rule}</span><button type="button" onClick={() => void removeAlert(alert.id)} className="text-xs text-cyan-200/70 hover:text-white">刪除</button></div></div>)}</div> : null}
            </section>

            <section className="rounded-[32px] border border-white/10 bg-[rgba(10,14,24,0.82)] p-6">
              <h2 className="text-lg font-semibold text-white">工具追蹤</h2>
              <div className="mt-4 space-y-3">{(result?.traces || []).map((trace) => <div key={`${trace.tool}-${trace.input}`} className="rounded-[24px] border border-white/10 bg-black/20 p-4"><div className="text-sm font-medium text-white">{trace.tool}</div><div className="mt-1 text-xs text-zinc-400">query: {trace.input}</div><div className="mt-2 text-sm text-cyan-300">hits: {trace.hits}</div></div>)}{!result?.traces?.length ? <p className="text-sm text-zinc-400">送出問題後，這裡會顯示本次實際用到的角色與資料工具。</p> : null}</div>
            </section>

            <section className="rounded-[32px] border border-white/10 bg-[rgba(10,14,24,0.82)] p-6">
              <h2 className="text-lg font-semibold text-white">推薦問題</h2>
              <div className="mt-4 flex flex-col gap-3">{(result?.suggestedQuestions || role.defaultQuestions).map((item) => <button key={item} type="button" onClick={() => ask(item)} className="rounded-[22px] border border-white/10 bg-black/20 px-4 py-3 text-left text-sm text-zinc-200 transition hover:bg-white/10">{item}</button>)}</div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
