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

type AgentMemoryItem = {
  id: string;
  sessionId: string | null;
  roleId: IdolAgentRoleId;
  roleLabel: string;
  question: string;
  answer: string;
  summary: string;
  intent?: string | null;
  entityId?: string | null;
  entityKind?: "member" | "group" | null;
  entityName?: string | null;
  createdAt: string;
};

const WATCHLIST_KEY = "idol_v4_watchlist";
const ALERTS_KEY = "idol_v4_alerts";
const MEMORY_KEY = "idol_agent_memory";
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
  return storageMode === "cloud" ? "已同步到雲端" : "目前儲存在本機";
}

function isRoleId(value: string | null | undefined): value is IdolAgentRoleId {
  return IDOL_AGENT_ROLES.some((role) => role.id === value);
}

function normalizeMemoryItem(raw: Record<string, unknown>): AgentMemoryItem | null {
  const roleId = String(raw.roleId ?? raw.role_id ?? "");
  if (!isRoleId(roleId)) return null;
  return {
    id: String(raw.id || ""),
    sessionId: raw.sessionId == null ? String(raw.session_id || "") || null : String(raw.sessionId || "") || null,
    roleId,
    roleLabel:
      String(raw.roleLabel ?? "").trim() ||
      getIdolAgentRole(roleId).label,
    question: String(raw.question || "").trim(),
    answer: String(raw.answer || "").trim(),
    summary: String(raw.summary || "").trim(),
    intent: raw.intent == null ? null : String(raw.intent),
    entityId: raw.entityId == null ? String(raw.entity_id || "") || null : String(raw.entityId || "") || null,
    entityKind:
      raw.entityKind === "group" || raw.entity_kind === "group"
        ? "group"
        : raw.entityKind === "member" || raw.entity_kind === "member"
          ? "member"
          : null,
    entityName:
      raw.entityName == null ? String(raw.entity_name || "") || null : String(raw.entityName || "") || null,
    createdAt: String(raw.createdAt ?? raw.created_at ?? new Date().toISOString()),
  };
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
  const [recentMemory, setRecentMemory] = useState<AgentMemoryItem[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [continuedFrom, setContinuedFrom] = useState<AgentMemoryItem | null>(null);
  const [forumIdentity, setForumIdentity] = useState<ForumIdentity | null>(null);
  const [storageMode, setStorageMode] = useState<"local" | "cloud">("local");
  const [syncingStorage, setSyncingStorage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const role = useMemo(() => getIdolAgentRole(selectedRole), [selectedRole]);

  useEffect(() => {
    setWatchlist(readStoredArray<string>(WATCHLIST_KEY));
    setAlerts(readStoredArray<AlertDraft>(ALERTS_KEY));
    setRecentMemory(
      readStoredArray<Record<string, unknown>>(MEMORY_KEY)
        .map((item) => normalizeMemoryItem(item))
        .filter(Boolean) as AgentMemoryItem[],
    );
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

  async function loadAgentMemory(identity: ForumIdentity) {
    try {
      const response = await fetch(
        `/api/agent/memory?token=${encodeURIComponent(identity.token)}&limit=8`,
        { cache: "no-store" },
      );
      const payload = await response.json();
      const items = Array.isArray(payload.items)
        ? payload.items
            .map((item: Record<string, unknown>) => normalizeMemoryItem(item))
            .filter(Boolean)
        : [];

      setRecentMemory(items as AgentMemoryItem[]);
      setCurrentSessionId(payload.latestSessionId || null);
      writeStoredArray(MEMORY_KEY, items);
    } catch {
      // Keep local fallback memory when cloud fetch fails.
    }
  }

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

  useEffect(() => {
    if (!forumIdentity) return;
    void loadAgentMemory(forumIdentity);
  }, [forumIdentity]);

  async function ask(nextQuestion?: string, nextRole?: IdolAgentRoleId) {
    const finalQuestion = (nextQuestion ?? question).trim();
    const finalRole = nextRole ?? selectedRole;
    if (!finalQuestion) return;
    const continuedQuestion = continuedFrom
      ? `延續上一題「${continuedFrom.question}」。這次追問：${finalQuestion}`
      : finalQuestion;

    setLoading(true);
    setError(null);
    setQuestion(finalQuestion);
    setSelectedRole(finalRole);

    try {
      const response = await fetch("/api/agent/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: continuedQuestion, role: finalRole }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "agent request failed");
      setResult(data);

      const primaryEntity = (data?.evidence || []).find(
        (item: { type?: string }) => item.type === "member" || item.type === "group",
      );

      const memoryQuestion = continuedFrom
        ? `延續「${continuedFrom.question}」：${finalQuestion}`
        : finalQuestion;
      const nextMemoryItem: AgentMemoryItem = {
        id: `local-${Date.now()}`,
        sessionId: currentSessionId,
        roleId: finalRole,
        roleLabel: data.roleLabel || getIdolAgentRole(finalRole).label,
        question: memoryQuestion,
        answer: String(data.answer || ""),
        summary: String(data.summary || ""),
        intent: data.intent || null,
        entityId: primaryEntity?.href ? null : null,
        entityKind: primaryEntity?.type === "group" ? "group" : primaryEntity?.type === "member" ? "member" : null,
        entityName: primaryEntity?.title || null,
        createdAt: new Date().toISOString(),
      };

      const nextLocalMemory = [nextMemoryItem, ...recentMemory].slice(0, 8);
      setRecentMemory(nextLocalMemory);
      writeStoredArray(MEMORY_KEY, nextLocalMemory);

      const identity = forumIdentity;
      if (identity) {
        const memoryResponse = await fetch("/api/agent/memory", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: identity.token,
            displayName: identity.displayName,
            sessionId: continuedFrom?.sessionId || currentSessionId,
            roleId: finalRole,
            question: memoryQuestion,
            answer: data.answer,
            summary: data.summary,
            intent: data.intent,
            provider: data.provider,
            mode: data.mode,
            entityName: primaryEntity?.title || null,
            entityKind: primaryEntity?.type === "group" ? "group" : primaryEntity?.type === "member" ? "member" : null,
            evidence: Array.isArray(data.evidence) ? data.evidence : [],
            traces: Array.isArray(data.traces) ? data.traces : [],
            suggestedQuestions: Array.isArray(data.suggestedQuestions) ? data.suggestedQuestions : [],
          }),
        });
        const memoryPayload = await memoryResponse.json().catch(() => null);
        if (memoryPayload?.sessionId) {
          setCurrentSessionId(memoryPayload.sessionId);
        }
        await loadAgentMemory(identity);
      }
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
              <div className="inline-flex rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-1 text-xs uppercase tracking-[0.24em] text-cyan-100">Analysis Workspace</div>
              <div className="space-y-4">
                <h1 className="max-w-4xl text-4xl font-black tracking-tight text-white md:text-5xl">用一個分析工作台，快速讀懂 idol-platform 的排名、公式與資料訊號</h1>
                <p className="max-w-3xl text-sm leading-8 text-slate-200/90">這裡是給你直接使用的平台分析介面。你可以依照想了解的問題切換角色，查看成員或團體為何上榜、分數怎麼計算、資料更新是否可靠，以及每一則市場觀察背後的依據。</p>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4"><div className="text-xs uppercase tracking-[0.18em] text-cyan-200">01</div><div className="mt-2 text-lg font-semibold text-white">看懂排名</div><p className="mt-2 text-sm leading-6 text-zinc-300">選一個分析角色，直接問成員或團體為什麼上榜、排名為何變動，以及哪些訊號拉高或拉低了分數。</p></div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4"><div className="text-xs uppercase tracking-[0.18em] text-cyan-200">02</div><div className="mt-2 text-lg font-semibold text-white">拆解公式</div><p className="mt-2 text-sm leading-6 text-zinc-300">快速檢查分數是怎麼算的，包括社群覆蓋、資料新鮮度、freshness 與其他影響權重的欄位。</p></div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4"><div className="text-xs uppercase tracking-[0.18em] text-cyan-200">03</div><div className="mt-2 text-lg font-semibold text-white">追資料訊號</div><p className="mt-2 text-sm leading-6 text-zinc-300">搭配比較、追蹤清單與提醒草稿，持續觀察哪些成員或團體最近更新、停滯，或值得再追蹤。</p></div>
              </div>
              <div className="flex flex-wrap gap-3 text-sm">
                <Link href="/" className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-zinc-200 transition hover:bg-white/10">返回首頁</Link>
                <Link href="/brain" className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-cyan-100 transition hover:bg-cyan-300/20">前往知識庫</Link>
                <Link href="/insights" className="rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-2 text-amber-100 transition hover:bg-amber-300/20">查看市場觀察</Link>
              </div>
            </div>
            <div className="grid gap-4 self-start">
              <div className="rounded-[28px] border border-white/10 bg-black/25 p-5 backdrop-blur">
                <div className="text-xs uppercase tracking-[0.18em] text-cyan-300">工作狀態</div>
                <div className="mt-4 space-y-3 text-sm text-zinc-300">
                  <div className="flex items-center justify-between gap-4"><span>目前角色</span><span className="font-medium text-cyan-100">{role.shortLabel}</span></div>
                  <div className="flex items-center justify-between gap-4"><span>分析模式</span><span className="font-medium text-cyan-100">{result?.mode || "standby"}</span></div>
                  <div className="flex items-center justify-between gap-4"><span>回答來源</span><span className="font-medium text-cyan-100">{result?.provider || "local"}</span></div>
                  <div className="flex items-center justify-between gap-4"><span>追蹤資料狀態</span><span className="font-medium text-cyan-100">{syncLabel(storageMode, syncingStorage)}</span></div>
                </div>
              </div>
              <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
                <div className="text-xs uppercase tracking-[0.18em] text-cyan-300">使用建議</div>
                <ul className="mt-4 space-y-3 text-sm leading-6 text-zinc-300">
                  <li>先從一個具體問題開始，例如「某位成員為何上榜」或「某個團體最近為何掉分」。</li>
                  <li>如果想長期觀察變化，可以把成員或團體加入追蹤清單，再建立提醒草稿。</li>
                  <li>看完答案後，往下搭配比較、證據來源與工具追蹤，能更快確認結論是否可信。</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {IDOL_AGENT_ROLES.map((item) => (
            <button key={item.id} type="button" onClick={() => { setSelectedRole(item.id); setQuestion(item.defaultQuestions[0]); setContinuedFrom(null); setCurrentSessionId(null); }} className={`rounded-[28px] border p-5 text-left transition ${selectedRole === item.id ? "border-cyan-300/40 bg-cyan-300/10 shadow-[0_18px_40px_rgba(34,211,238,0.12)]" : "border-white/10 bg-[rgba(12,16,28,0.7)] hover:border-white/20 hover:bg-white/8"}`}>
              <div className="flex items-start justify-between gap-3"><div className="text-xs uppercase tracking-[0.18em] text-cyan-300">{item.shortLabel}</div><span className="rounded-full border border-white/10 px-2 py-1 text-[11px] text-zinc-400">{item.sourceCategory}</span></div>
              <div className="mt-3 text-lg font-semibold text-white">{item.label}</div>
              <div className="mt-2 text-sm leading-6 text-zinc-300">{item.tagline}</div>
              <div className="mt-4 text-xs text-zinc-500">角色來源：{item.sourceAgentName}</div>
            </button>
          ))}
        </section>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.28fr)_minmax(330px,0.72fr)]">
          <section className="space-y-6">
            <section className="rounded-[32px] border border-white/10 bg-[rgba(10,14,24,0.82)] p-6 shadow-[0_22px_70px_rgba(0,0,0,0.28)]">
              <div className="flex flex-col gap-4">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-zinc-300">
                  <div className="text-xs uppercase tracking-[0.18em] text-cyan-300">角色說明</div>
                  <div className="mt-2 text-lg font-semibold text-white">{role.label}</div>
                  <p className="mt-2 leading-7 text-zinc-300">{role.mission}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-cyan-100">{role.focus.map((item) => <span key={item} className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1">{item}</span>)}</div>
                </div>
                {continuedFrom ? (
                  <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4 text-sm text-cyan-50">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-xs uppercase tracking-[0.18em] text-cyan-200">延續上次問題</div>
                        <div className="mt-2 font-medium text-white">{continuedFrom.question}</div>
                        <div className="mt-1 text-xs text-cyan-100/80">{continuedFrom.roleLabel}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setContinuedFrom(null);
                          setCurrentSessionId(null);
                        }}
                        className="text-xs text-cyan-100/70 transition hover:text-white"
                      >
                        清除
                      </button>
                    </div>
                  </div>
                ) : null}
                <textarea value={question} onChange={(event) => setQuestion(event.target.value)} className="min-h-32 rounded-[24px] border border-white/10 bg-black/25 px-4 py-4 text-sm leading-7 text-white outline-none placeholder:text-zinc-500" placeholder="直接輸入你想查的問題，例如：某位成員為何上榜、某團體最近為何掉分、v2 公式怎麼影響 freshness。" />
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
                <div className="mt-3 text-xs uppercase tracking-[0.16em] text-zinc-500">回答角色：{result.sourceAgentName}</div>
                <p className="mt-5 whitespace-pre-wrap text-sm leading-8 text-zinc-200">{result.answer}</p>
                <div className="mt-5 rounded-[24px] border border-cyan-400/20 bg-cyan-400/10 p-4 text-sm leading-7 text-cyan-100">{result.summary}</div>
              </section>
            ) : (
              <section className="rounded-[32px] border border-dashed border-white/10 bg-[rgba(10,14,24,0.78)] p-6 text-sm leading-7 text-zinc-300">輸入問題後，這裡會顯示分析結果。你可以先從預設問題開始，也可以直接問某位成員、某個團體、某個公式欄位，或某次排名變動的原因。</section>
            )}

            <div className="grid gap-6 lg:grid-cols-2">
              <section className="rounded-[32px] border border-white/10 bg-[rgba(10,14,24,0.82)] p-6">
                <h2 className="text-lg font-semibold text-white">Compare 比較</h2>
                <p className="mt-2 text-sm text-zinc-400">挑兩個對象快速比較分數、freshness 與目前差距。</p>
                <div className="mt-4 grid gap-3">
                  <select value={leftId} onChange={(event) => setLeftId(event.target.value)} className="rounded-2xl border border-white/10 bg-slate-950 px-3 py-3 text-sm text-white">{allEntities.map((entity) => <option key={entity.id} value={entity.id}>{kindLabel(entity.kind)} · {entity.name}</option>)}</select>
                  <select value={rightId} onChange={(event) => setRightId(event.target.value)} className="rounded-2xl border border-white/10 bg-slate-950 px-3 py-3 text-sm text-white">{allEntities.map((entity) => <option key={entity.id} value={entity.id}>{kindLabel(entity.kind)} · {entity.name}</option>)}</select>
                </div>
                {left && right && comparison ? <div className="mt-5 rounded-[24px] border border-white/10 bg-black/20 p-4 text-sm text-zinc-300"><div className="grid grid-cols-2 gap-3"><span>{left.name}</span><span className="text-right text-cyan-200">{fmt(left.score)}</span><span>{right.name}</span><span className="text-right text-violet-200">{fmt(right.score)}</span></div><div className="mt-4 text-zinc-400">目前分數差 {fmt(Math.abs(comparison.scoreDelta))}，資料新鮮度差約 {fmt(Math.abs(comparison.freshnessDelta), 0)} 天。</div></div> : null}
              </section>

              <section className="rounded-[32px] border border-white/10 bg-[rgba(10,14,24,0.82)] p-6">
                <h2 className="text-lg font-semibold text-white">Watchlist 追蹤清單</h2>
                <p className="mt-2 text-sm text-zinc-400">{forumIdentity ? "你目前的追蹤清單可以同步保存，方便之後持續觀察。" : "登入論壇後可把追蹤清單同步保存；未登入時會先暫存在本機。"}</p>
                <input value={query} onChange={(event) => setQuery(event.target.value)} className="mt-4 w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-3 text-sm text-white outline-none placeholder:text-zinc-500" placeholder="搜尋成員或團體..." />
                <div className="mt-4 max-h-72 space-y-2 overflow-y-auto pr-1">{filteredEntities.map((entity) => <button key={entity.id} type="button" onClick={() => void toggleWatch(entity)} className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-left transition hover:bg-white/10"><span><span className="block text-sm font-medium text-white">{entity.name}</span><span className="text-xs text-zinc-400">{entity.subtitle} · {fmt(entity.score)} 分</span></span><span className="text-xs text-cyan-200">{watchlist.includes(entity.id) ? "移出追蹤" : "加入追蹤"}</span></button>)}</div>
              </section>
            </div>

            <section className="rounded-[32px] border border-white/10 bg-[rgba(10,14,24,0.82)] p-6">
              <h2 className="text-lg font-semibold text-white">證據與資料來源</h2>
              {result?.evidence?.length ? <div className="mt-4 grid gap-3 md:grid-cols-2">{result.evidence.map((item, index) => <div key={`${item.type}-${item.title}-${index}`} className="rounded-[24px] border border-white/10 bg-black/20 p-4"><div className="text-xs uppercase tracking-[0.18em] text-cyan-300">{item.type}</div><div className="mt-2 text-base font-semibold text-white">{item.title}</div><p className="mt-2 text-sm leading-7 text-zinc-300">{item.snippet}</p>{item.href ? <Link href={item.href} className="mt-3 inline-block text-sm text-cyan-300 hover:text-cyan-200">查看來源</Link> : null}</div>)}</div> : <p className="mt-3 text-sm text-zinc-400">分析結果如果有引用排行榜、insights 或 brain 的內容，會在這裡列出對應依據，方便你回頭檢查來源。</p>}
            </section>
          </section>

          <aside className="space-y-6">
            <section className="rounded-[32px] border border-white/10 bg-[rgba(10,14,24,0.82)] p-6">
              <h2 className="text-lg font-semibold text-white">最近分析紀錄</h2>
              <p className="mt-2 text-sm text-zinc-400">
                {forumIdentity
                  ? "你最近的分析會同步保存，可直接延續同一題往下追問。"
                  : "未登入時會先暫存在本機；登入後可同步保存最近分析紀錄。"}
              </p>
              <div className="mt-4 space-y-3">
                {recentMemory.length ? recentMemory.map((item) => (
                  <div key={item.id} className="rounded-[24px] border border-white/10 bg-black/20 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-xs uppercase tracking-[0.18em] text-cyan-300">{item.roleLabel}</div>
                        <div className="mt-2 text-sm font-medium text-white">{item.question}</div>
                        <div className="mt-2 text-xs text-zinc-400">{item.summary}</div>
                        <div className="mt-2 text-[11px] text-zinc-500">{new Date(item.createdAt).toLocaleString("zh-TW")}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setContinuedFrom(item);
                          setCurrentSessionId(item.sessionId);
                          setSelectedRole(item.roleId);
                          setQuestion("");
                        }}
                        className="rounded-xl border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 text-xs text-cyan-100 transition hover:bg-cyan-300/20"
                      >
                        延續這題
                      </button>
                    </div>
                  </div>
                )) : <p className="rounded-[24px] border border-dashed border-white/10 bg-black/20 p-4 text-sm text-zinc-400">完成一次分析後，這裡會保留最近的提問與摘要，方便你快速回到上一題。</p>}
              </div>
            </section>

            <section className="rounded-[32px] border border-white/10 bg-[rgba(10,14,24,0.82)] p-6">
              <h2 className="text-lg font-semibold text-white">Alerts 提醒草稿</h2>
              <p className="mt-2 text-sm text-zinc-400">{forumIdentity ? "提醒草稿會跟著你的論壇身份同步保存。" : "登入論壇後可同步保存提醒草稿；未登入時會先存在本機。"}</p>
              <div className="mt-4 space-y-3">{watchedEntities.length ? watchedEntities.map((entity) => <div key={entity.id} className="rounded-[24px] border border-white/10 bg-black/20 p-4"><div className="flex items-start justify-between gap-3"><div><div className="font-semibold text-white">{entity.name}</div><div className="mt-1 text-xs text-zinc-400">{entity.subtitle} · {fmt(entity.score)} 分 · 最近更新約 {fmt(entity.freshnessDays, 0)} 天前</div></div><button type="button" onClick={() => void toggleWatch(entity)} className="text-xs text-zinc-400 hover:text-white">移出追蹤</button></div><div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={() => void addAlert(entity, "分數下降超過 5 分")} className="rounded-xl border border-pink-400/20 bg-pink-400/10 px-3 py-2 text-xs text-pink-100">分數下降</button><button type="button" onClick={() => void addAlert(entity, "14 天沒有明顯更新")} className="rounded-xl border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-xs text-amber-100">更新停滯</button></div></div>) : <p className="rounded-[24px] border border-dashed border-white/10 bg-black/20 p-4 text-sm text-zinc-400">先把成員或團體加入追蹤清單，這裡才會顯示可建立的提醒草稿。</p>}</div>
              {alerts.length ? <div className="mt-5 space-y-2">{alerts.map((alert) => <div key={alert.id} className="rounded-xl border border-cyan-300/10 bg-cyan-300/10 p-3 text-sm text-cyan-50"><div className="flex items-start justify-between gap-3"><span>{alert.entityName} · {alert.rule}</span><button type="button" onClick={() => void removeAlert(alert.id)} className="text-xs text-cyan-200/70 hover:text-white">刪除</button></div></div>)}</div> : null}
            </section>

            <section className="rounded-[32px] border border-white/10 bg-[rgba(10,14,24,0.82)] p-6">
              <h2 className="text-lg font-semibold text-white">工具追蹤</h2>
              <div className="mt-4 space-y-3">{(result?.traces || []).map((trace) => <div key={`${trace.tool}-${trace.input}`} className="rounded-[24px] border border-white/10 bg-black/20 p-4"><div className="text-sm font-medium text-white">{trace.tool}</div><div className="mt-1 text-xs text-zinc-400">query: {trace.input}</div><div className="mt-2 text-sm text-cyan-300">hits: {trace.hits}</div></div>)}{!result?.traces?.length ? <p className="text-sm text-zinc-400">當分析有實際查詢排行榜、entities 或 insights 時，這裡會顯示查詢過程與命中結果。</p> : null}</div>
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
