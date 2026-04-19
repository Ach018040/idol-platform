const SB_URL = process.env.NEXT_PUBLIC_FORUM_SB_URL || "https://vxmebuygrnynxkepyunh.supabase.co";
const SB_ANON = process.env.NEXT_PUBLIC_FORUM_SB_ANON || "";

export type WatchlistRow = {
  id: string;
  user_id: string;
  entity_id: string;
  entity_kind: "member" | "group";
  entity_name: string;
  created_at: string;
};

export type AlertRuleRow = {
  id: string;
  user_id: string;
  entity_id: string;
  entity_kind: "member" | "group";
  entity_name: string;
  rule_type: string;
  threshold: number | null;
  created_at: string;
};

export type AgentSessionRow = {
  id: string;
  user_id: string;
  role_id: string;
  last_question: string | null;
  last_intent: string | null;
  summary: string | null;
  entity_id: string | null;
  entity_kind: "member" | "group" | null;
  entity_name: string | null;
  created_at: string;
  updated_at: string;
};

export type AgentObservationRow = {
  id: string;
  session_id: string | null;
  user_id: string;
  role_id: string;
  question: string;
  answer: string;
  summary: string | null;
  intent: string | null;
  provider: string | null;
  mode: string | null;
  entity_id: string | null;
  entity_kind: "member" | "group" | null;
  entity_name: string | null;
  evidence: unknown;
  traces: unknown;
  suggested_questions: unknown;
  created_at: string;
};

function headers() {
  return {
    apikey: SB_ANON,
    Authorization: `Bearer ${SB_ANON}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  };
}

export function hasForumStorageConfig() {
  return Boolean(SB_URL && SB_ANON);
}

export async function ensureUserProfile(token: string, displayName = "Agent User") {
  if (!hasForumStorageConfig() || !token) return null;

  const existing = await fetch(`${SB_URL}/rest/v1/user_profiles?token=eq.${encodeURIComponent(token)}&select=id,token&limit=1`, {
    headers: { apikey: SB_ANON, Accept: "application/json" },
    cache: "no-store",
  }).then((res) => res.json()).catch(() => []);

  if (Array.isArray(existing) && existing[0]) return existing[0];

  const created = await fetch(`${SB_URL}/rest/v1/user_profiles`, {
    method: "POST",
    headers: {
      ...headers(),
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      id: token,
      token,
      display_name: displayName,
      role: "user",
      bio: "",
      avatar_url: "",
      banner_color: "#7c3aed",
      post_count: 0,
      is_banned: false,
    }),
  }).then((res) => res.json()).catch(() => []);

  return Array.isArray(created) ? created[0] : null;
}

export async function listWatchlist(token: string): Promise<WatchlistRow[]> {
  if (!hasForumStorageConfig() || !token) return [];
  const rows = await fetch(
    `${SB_URL}/rest/v1/user_watchlists?user_id=eq.${encodeURIComponent(token)}&select=*&order=created_at.desc`,
    { headers: { apikey: SB_ANON, Accept: "application/json" }, cache: "no-store" },
  ).then((res) => res.json()).catch(() => []);

  return Array.isArray(rows) ? rows : [];
}

export async function insertWatchlist(row: Omit<WatchlistRow, "id" | "created_at">) {
  if (!hasForumStorageConfig()) return null;
  const data = await fetch(`${SB_URL}/rest/v1/user_watchlists`, {
    method: "POST",
    headers: {
      ...headers(),
      Prefer: "return=representation,resolution=merge-duplicates",
    },
    body: JSON.stringify(row),
  }).then((res) => res.json()).catch(() => []);

  return Array.isArray(data) ? data[0] : null;
}

export async function deleteWatchlist(token: string, entityId: string) {
  if (!hasForumStorageConfig()) return false;
  const res = await fetch(
    `${SB_URL}/rest/v1/user_watchlists?user_id=eq.${encodeURIComponent(token)}&entity_id=eq.${encodeURIComponent(entityId)}`,
    {
      method: "DELETE",
      headers: headers(),
    },
  ).catch(() => null);

  return Boolean(res?.ok);
}

export async function listAlertRules(token: string): Promise<AlertRuleRow[]> {
  if (!hasForumStorageConfig() || !token) return [];
  const rows = await fetch(
    `${SB_URL}/rest/v1/user_alert_rules?user_id=eq.${encodeURIComponent(token)}&select=*&order=created_at.desc`,
    { headers: { apikey: SB_ANON, Accept: "application/json" }, cache: "no-store" },
  ).then((res) => res.json()).catch(() => []);

  return Array.isArray(rows) ? rows : [];
}

export async function insertAlertRule(row: Omit<AlertRuleRow, "id" | "created_at">) {
  if (!hasForumStorageConfig()) return null;
  const data = await fetch(`${SB_URL}/rest/v1/user_alert_rules`, {
    method: "POST",
    headers: {
      ...headers(),
      Prefer: "return=representation",
    },
    body: JSON.stringify(row),
  }).then((res) => res.json()).catch(() => []);

  return Array.isArray(data) ? data[0] : null;
}

export async function deleteAlertRule(token: string, id: string) {
  if (!hasForumStorageConfig()) return false;
  const res = await fetch(
    `${SB_URL}/rest/v1/user_alert_rules?id=eq.${encodeURIComponent(id)}&user_id=eq.${encodeURIComponent(token)}`,
    {
      method: "DELETE",
      headers: headers(),
    },
  ).catch(() => null);

  return Boolean(res?.ok);
}

export async function listAgentObservations(token: string, limit = 8): Promise<AgentObservationRow[]> {
  if (!hasForumStorageConfig() || !token) return [];
  const rows = await fetch(
    `${SB_URL}/rest/v1/agent_observations?user_id=eq.${encodeURIComponent(token)}&select=*&order=created_at.desc&limit=${Math.max(
      1,
      Math.min(limit, 20),
    )}`,
    { headers: { apikey: SB_ANON, Accept: "application/json" }, cache: "no-store" },
  ).then((res) => res.json()).catch(() => []);

  return Array.isArray(rows) ? rows : [];
}

export async function getAgentSession(token: string, sessionId: string) {
  if (!hasForumStorageConfig() || !token || !sessionId) return null;
  const rows = await fetch(
    `${SB_URL}/rest/v1/agent_sessions?id=eq.${encodeURIComponent(sessionId)}&user_id=eq.${encodeURIComponent(
      token,
    )}&select=*&limit=1`,
    { headers: { apikey: SB_ANON, Accept: "application/json" }, cache: "no-store" },
  ).then((res) => res.json()).catch(() => []);

  return Array.isArray(rows) ? rows[0] ?? null : null;
}

export async function createAgentSession(
  row: Omit<AgentSessionRow, "id" | "created_at" | "updated_at">,
) {
  if (!hasForumStorageConfig()) return null;
  const data = await fetch(`${SB_URL}/rest/v1/agent_sessions`, {
    method: "POST",
    headers: {
      ...headers(),
      Prefer: "return=representation",
    },
    body: JSON.stringify(row),
  }).then((res) => res.json()).catch(() => []);

  return Array.isArray(data) ? data[0] : null;
}

export async function updateAgentSession(
  sessionId: string,
  token: string,
  patch: Partial<Omit<AgentSessionRow, "id" | "user_id" | "created_at">>,
) {
  if (!hasForumStorageConfig() || !sessionId || !token) return null;
  const data = await fetch(
    `${SB_URL}/rest/v1/agent_sessions?id=eq.${encodeURIComponent(sessionId)}&user_id=eq.${encodeURIComponent(token)}`,
    {
      method: "PATCH",
      headers: {
        ...headers(),
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        ...patch,
        updated_at: new Date().toISOString(),
      }),
    },
  ).then((res) => res.json()).catch(() => []);

  return Array.isArray(data) ? data[0] : null;
}

export async function insertAgentObservation(
  row: Omit<AgentObservationRow, "id" | "created_at">,
) {
  if (!hasForumStorageConfig()) return null;
  const data = await fetch(`${SB_URL}/rest/v1/agent_observations`, {
    method: "POST",
    headers: {
      ...headers(),
      Prefer: "return=representation",
    },
    body: JSON.stringify(row),
  }).then((res) => res.json()).catch(() => []);

  return Array.isArray(data) ? data[0] : null;
}
