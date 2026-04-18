import brainRaw from "@/public/data/brain_pages_fallback.json";
import insightsRaw from "@/public/data/insight_posts.json";
import membersRaw from "@/public/data/member_rankings.json";
import groupsRaw from "@/public/data/v7_rankings.json";
import { buildGroupEntities, buildMemberEntities, type V4Entity } from "@/lib/v4-entities";
import {
  DEFAULT_AGENT_ROLE_ID,
  getIdolAgentRole,
  type IdolAgentRole,
  type IdolAgentRoleId,
} from "@/lib/idol-agent-roles";

type InsightRecord = {
  slug: string;
  title?: string;
  summary?: string;
  category?: string;
  date?: string;
  content?: string[];
};

type BrainRecord = {
  slug: string;
  type?: string;
  title?: string;
  compiled_truth?: string;
  tags?: string[];
  updated_at?: string;
};

type AgentIntent = "ranking_reason" | "formula_explain" | "freshness_explain" | "group_vs_member" | "general";

export type IdolAgentEvidence = {
  type: "member" | "group" | "insight" | "brain" | "role";
  title: string;
  snippet: string;
  href?: string;
};

export type IdolAgentTrace = {
  tool: string;
  input: string;
  hits: number;
};

export type IdolAgentResult = {
  answer: string;
  summary: string;
  role: IdolAgentRoleId;
  roleLabel: string;
  sourceAgentName: string;
  intent: AgentIntent;
  mode: "local";
  provider: "local";
  evidence: IdolAgentEvidence[];
  traces: IdolAgentTrace[];
  suggestedQuestions: string[];
};

const ENTITY_POOL = [...buildMemberEntities(membersRaw, 160), ...buildGroupEntities(groupsRaw, 80)];
const INSIGHTS = insightsRaw as InsightRecord[];
const BRAIN_PAGES = brainRaw as BrainRecord[];

function normalize(value: string | null | undefined) {
  return String(value || "").toLowerCase().trim();
}

function scoreText(query: string, candidates: Array<string | null | undefined>) {
  const q = normalize(query);
  if (!q) return 0;

  let score = 0;
  for (const candidate of candidates) {
    const value = normalize(candidate);
    if (!value) continue;
    if (value === q) score += 10;
    else if (value.startsWith(q)) score += 6;
    else if (value.includes(q)) score += 4;
  }
  return score;
}

function inferIntent(question: string): AgentIntent {
  const q = normalize(question);
  if (/(freshness|更新|多久|最近|停更|最後發文)/.test(q)) return "freshness_explain";
  if (/(公式|計算|score|權重|v2|temperature|分數怎樣算)/.test(q)) return "formula_explain";
  if (/(團體榜|成員榜|group|member|為何.*不一致|為何.*不同)/.test(q)) return "group_vs_member";
  if (/(為何.*前面|為何.*上榜|為何.*掉榜|排名|排行|top 10)/.test(q)) return "ranking_reason";
  return "general";
}

function entityEvidence(entity: V4Entity): IdolAgentEvidence {
  const platformCount = Object.values(entity.socialLinks).filter(Boolean).length;
  return {
    type: entity.kind,
    title: entity.name,
    snippet: `${entity.subtitle}｜V2 ${entity.score.toFixed(1)}｜更新 ${Math.round(
      entity.freshnessDays,
    )} 天前｜平台 ${platformCount} 個`,
    href: entity.kind === "member" ? `/members/${encodeURIComponent(entity.name)}` : `/groups/${encodeURIComponent(entity.name)}`,
  };
}

function insightEvidence(item: InsightRecord): IdolAgentEvidence {
  return {
    type: "insight",
    title: item.title || item.slug,
    snippet: item.summary || item.category || "Insights 資料",
    href: `/insights/${encodeURIComponent(item.slug)}`,
  };
}

function brainEvidence(item: BrainRecord): IdolAgentEvidence {
  return {
    type: "brain",
    title: item.title || item.slug,
    snippet: item.compiled_truth || item.type || "Brain 知識頁",
    href: `/brain/${String(item.slug || "").split("/").map(encodeURIComponent).join("/")}`,
  };
}

function roleEvidence(role: IdolAgentRole): IdolAgentEvidence {
  return {
    type: "role",
    title: role.label,
    snippet: `${role.sourceAgentName} → ${role.shortLabel}｜${role.mission}`,
  };
}

function searchEntities(question: string) {
  return ENTITY_POOL.map((entity) => ({
    entity,
    score: scoreText(question, [entity.name, entity.subtitle, entity.id]),
  }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

function searchInsights(question: string) {
  return INSIGHTS.map((item) => ({
    item,
    score: scoreText(question, [item.title, item.summary, item.category, (item.content || []).join(" ")]),
  }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

function searchBrain(question: string) {
  return BRAIN_PAGES.map((item) => ({
    item,
    score: scoreText(question, [item.title, item.slug, item.compiled_truth, (item.tags || []).join(" "), item.type]),
  }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

function topEntitySummary() {
  return ENTITY_POOL.slice(0, 5)
    .map((entity, index) => `${index + 1}. ${entity.name} ${entity.score.toFixed(1)}`)
    .join(" / ");
}

function entitySpecificAnswer(role: IdolAgentRole, entity: V4Entity, intent: AgentIntent) {
  const confidenceText = entity.confidence == null ? "未提供可信度" : `可信度 ${Math.round(entity.confidence * 100)}%`;
  const platformCount = Object.values(entity.socialLinks).filter(Boolean).length;
  const base = `${entity.name} 目前屬於 ${entity.kind === "member" ? "成員" : "團體"}資料，V2 溫度 ${
    entity.score
  }，更新訊號約 ${Math.round(entity.freshnessDays)} 天前，社群平台覆蓋 ${platformCount} 個，${confidenceText}。`;

  switch (role.id) {
    case "ranking-analyst":
      return `${base} 以排名分析角度來看，這代表它目前仍靠分數結構中的平台覆蓋、既有社群存在度與最近一次更新訊號維持在前段。若你看到「不常更新卻還在前面」，通常就是 freshness 還沒有衰減到足以讓它掉出榜，或同區間其他對手的資料也不夠新。`;
    case "formula-architect":
      return `${base} 以公式角度來看，應優先拆成 social presence、profile completeness、freshness 與 group/member 關聯去解釋，而不是只看單一更新時間。這個角色會先告訴你目前分數是被哪一個維度撐住。`;
    case "data-pipeline-operator":
      return `${base} 以資料管線角度來看，你要先確認它的 last_social_signal_at、days_since_update 與 followers / engagement 類欄位是否真的有抓到。若這些欄位仍為空，現在分數其實更偏向資料存在度而不是完整社群互動。`;
    case "platform-architect":
      return `${base} 以平台架構角度來看，這個結果反映的是 crawler、Supabase、API 與前端讀取邏輯目前一致輸出的狀態。若覺得不合理，優先檢查抓取層與 JSON 產出，而不是只改前端文案。`;
    case "database-optimizer":
      return `${base} 以資料庫角度來看，如果未來要讓這個解釋更穩，你需要把真實社群訊號、最後發文時間與歷史快照拆成可索引欄位，避免現在所有判斷都擠在單張排行 JSON。`;
    case "product-strategist":
      return `${base} 以產品角度來看，使用者真正想知道的是「為什麼它現在還在榜上」以及「下一步會不會掉」。所以這個角色會把答案轉成平台信任感、可解釋性與後續動作，而不只是一句分數結果。`;
    case "market-researcher":
      return `${base} 以市場研究角度來看，這更像是「仍然保有基本存在度」而不是「爆發成長」。如果要判斷市場熱度，還需要併看近期活動、內容節奏與社群互動資料。`;
    case "social-intelligence":
      return `${base} 以社群洞察角度來看，平台覆蓋數、追蹤基礎與是否仍有真實社群更新，會直接影響你應該怎麼解讀這個分數。單看最後更新天數，常常會低估既有社群盤的影響。`;
  }
}

function generalAnswer(role: IdolAgentRole, intent: AgentIntent, entityHits: ReturnType<typeof searchEntities>) {
  const lead = entityHits[0]?.entity;
  if (lead) return entitySpecificAnswer(role, lead, intent);

  switch (role.id) {
    case "ranking-analyst":
      return `目前先用平台現有資料回答：成員與團體排名本質上是同一組資料模型下的不同視角。若沒有命中到特定成員或團體，我會先用目前前段榜單 ${topEntitySummary()} 作為解釋基準，再告訴你該往 freshness、公式還是資料缺口去追。`;
    case "formula-architect":
      return "這題若沒有命中特定對象，我會先回到公式本身：溫度分數不應被解讀成單一人氣值，而是平台覆蓋、資料完整度、更新新鮮度與上下文關聯的組合。你如果想要更可信，我會優先指出需要補哪些欄位。";
    case "data-pipeline-operator":
      return "這題如果沒有命中到特定偶像，我會先把它拆成資料問題：哪些 JSON 欄位現在有、哪些其實還是空值、哪些抓取流程需要增量重跑，然後再反推為何前端顯示會長成現在這樣。";
    case "platform-architect":
      return "這題我會先用整體資料流來解：crawler 產資料，Supabase / JSON 承接，API 整理，frontend 呈現。若結果看起來怪，通常不是單一頁面的 bug，而是上下游其中一層語意不同步。";
    case "database-optimizer":
      return "這題我會優先從結構面回答：現在哪些狀態只存在 JSON、哪些應該回到 Supabase table、哪些需要 index / policy / history snapshot，才能讓後續 agent、watchlist 與 alerts 真正可持續。";
    case "product-strategist":
      return "這題我會先把它轉成產品問題：使用者想得到什麼決策、目前頁面有沒有把決策所需資訊表達出來、下一步做哪個功能最能提高信任感與留存。";
    case "market-researcher":
      return "這題我會先用市場研究角度整理目前平台可以說清楚的趨勢，再明確標出哪些部分其實還只是資料存在度，不足以等同市場熱度。";
    case "social-intelligence":
      return "這題我會先回到社群資料本身：平台覆蓋、追蹤、互動、觀看與最後發文訊號，哪些已經能用、哪些還在缺值。這樣你會比較知道現在這個分數能信到什麼程度。";
  }
}

function roleSummary(role: IdolAgentRole, intent: AgentIntent) {
  const summaries: Record<AgentIntent, string> = {
    ranking_reason: "這次回答以排名原因為主，優先說明為何上榜、掉榜或停留在前段。",
    formula_explain: "這次回答以公式拆解為主，優先說明哪些分數維度正在主導結果。",
    freshness_explain: "這次回答以資料更新與 freshness 解讀為主，避免把分數誤解成純人氣。",
    group_vs_member: "這次回答以團體榜與成員榜的視角差異為主，說明兩者為何可能不同步。",
    general: "這次回答先從當前角色的專長切入，再指出下一步該追哪個資料面向。",
  };

  return `${role.shortLabel}｜${summaries[intent]}`;
}

function buildSuggestedQuestions(role: IdolAgentRole, question: string) {
  const trimmed = question.trim();
  return [...role.defaultQuestions, `${trimmed} 要先看公式、freshness 還是資料缺口？`].slice(0, 4);
}

export async function runIdolPlatformAgent(input: {
  question: string;
  role?: string | null;
}): Promise<IdolAgentResult> {
  const question = String(input.question || "").trim();
  const role = getIdolAgentRole(input.role || DEFAULT_AGENT_ROLE_ID);
  const intent = inferIntent(question);
  const entityHits = searchEntities(question);
  const insightHits = searchInsights(question);
  const brainHits = searchBrain(question);

  return {
    answer: generalAnswer(role, intent, entityHits),
    summary: roleSummary(role, intent),
    role: role.id,
    roleLabel: role.label,
    sourceAgentName: role.sourceAgentName,
    intent,
    mode: "local",
    provider: "local",
    evidence: [
      roleEvidence(role),
      ...entityHits.map((entry) => entityEvidence(entry.entity)),
      ...insightHits.map((entry) => insightEvidence(entry.item)),
      ...brainHits.map((entry) => brainEvidence(entry.item)),
    ].slice(0, 8),
    traces: [
      { tool: "select_role", input: role.id, hits: 1 },
      { tool: "infer_intent", input: intent, hits: 1 },
      { tool: "search_v4_entities", input: question, hits: entityHits.length },
      { tool: "search_insights", input: question, hits: insightHits.length },
      { tool: "search_brain", input: question, hits: brainHits.length },
    ],
    suggestedQuestions: buildSuggestedQuestions(role, question),
  };
}
