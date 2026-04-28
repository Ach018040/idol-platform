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

type AgentIntent =
  | "ranking_reason"
  | "formula_explain"
  | "freshness_explain"
  | "group_vs_member"
  | "data_quality"
  | "market_insight"
  | "general";

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

export type IdolAgentDelegateResult = {
  role: IdolAgentRoleId;
  roleLabel: string;
  sourceAgentName: string;
  answer: string;
  summary: string;
  evidence: IdolAgentEvidence[];
  traces: IdolAgentTrace[];
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
  delegates: IdolAgentDelegateResult[];
  orchestratedBy: "idol-agent-v2";
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
  if (/(pipeline|資料管線|更新失敗|抓取|json|threads|instagram|threads)/.test(q)) return "data_quality";
  if (/(insight|趨勢|市場|觀察|內容方向|brain)/.test(q)) return "market_insight";
  if (/(freshness|更新|多久|停滯|最後發文|last post)/.test(q)) return "freshness_explain";
  if (/(公式|權重|score|分數|v2|temperature|溫度)/.test(q)) return "formula_explain";
  if (/(團體榜|成員榜|group|member|團體.*成員|成員.*團體)/.test(q)) return "group_vs_member";
  if (/(為何上榜|為什麼上榜|為何掉榜|排名|top 10|排行)/.test(q)) return "ranking_reason";
  return "general";
}

function entityEvidence(entity: V4Entity): IdolAgentEvidence {
  const platformCount = Object.values(entity.socialLinks).filter(Boolean).length;
  return {
    type: entity.kind,
    title: entity.name,
    snippet: `${entity.subtitle} · V2 ${entity.score.toFixed(1)} · 最近更新約 ${Math.round(
      entity.freshnessDays,
    )} 天前 · 社群平台 ${platformCount} 個`,
    href:
      entity.kind === "member"
        ? `/members/${encodeURIComponent(entity.name)}`
        : `/groups/${encodeURIComponent(entity.name)}`,
  };
}

function insightEvidence(item: InsightRecord): IdolAgentEvidence {
  return {
    type: "insight",
    title: item.title || item.slug,
    snippet: item.summary || item.category || "市場觀察內容",
    href: `/insights/${encodeURIComponent(item.slug)}`,
  };
}

function brainEvidence(item: BrainRecord): IdolAgentEvidence {
  return {
    type: "brain",
    title: item.title || item.slug,
    snippet: item.compiled_truth || item.type || "Brain 知識頁",
    href: `/brain/${String(item.slug || "")
      .split("/")
      .map(encodeURIComponent)
      .join("/")}`,
  };
}

function roleEvidence(role: IdolAgentRole): IdolAgentEvidence {
  return {
    type: "role",
    title: role.label,
    snippet: `${role.sourceAgentName} · ${role.shortLabel} · ${role.mission}`,
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

function leadEntityText(entity: V4Entity) {
  const platformCount = Object.values(entity.socialLinks).filter(Boolean).length;
  const confidenceText =
    entity.confidence == null ? "資料可信度尚未提供" : `資料可信度 ${Math.round(entity.confidence * 100)}%`;
  return `${entity.name} 目前屬於${entity.kind === "member" ? "成員" : "團體"}資料，V2 分數 ${
    entity.score
  }，最近更新約 ${Math.round(entity.freshnessDays)} 天前，社群平台 ${platformCount} 個，${confidenceText}。`;
}

function roleFocusedAnswer(
  role: IdolAgentRole,
  intent: AgentIntent,
  entityHits: ReturnType<typeof searchEntities>,
  insightHits: ReturnType<typeof searchInsights>,
  brainHits: ReturnType<typeof searchBrain>,
) {
  const lead = entityHits[0]?.entity;
  const leadText = lead ? leadEntityText(lead) : `目前最前面的資料樣本是 ${topEntitySummary()}。`;
  const insightLead = insightHits[0]?.item?.title || "目前沒有命中的市場觀察文章";
  const brainLead = brainHits[0]?.item?.title || "目前沒有命中的知識頁";

  switch (role.id) {
    case "ranking-analyst":
      return `${leadText} 以排名角度來看，這題最值得先看的是誰因 freshness、社群覆蓋或資料完整度被拉高，以及榜單前後名次是否只是資料更新差造成的短期變動。`;
    case "formula-architect":
      return `${leadText} 以公式角度來看，這題應先拆成平台覆蓋、資料完整度、freshness 與正規化後的分數表現，確認是哪些權重真正主導了最後排名。`;
    case "data-pipeline-operator":
      return `${leadText} 以資料管線角度來看，這題應先檢查更新來源、最後發文時間、JSON 輸出與是否沿用了上次成功抓取結果，才能判斷分數變化是否可信。`;
    case "platform-architect":
      return `${leadText} 以平台架構角度來看，這題通常要分清楚是 crawler、資料表、API 還是前端顯示層造成理解落差，避免把資料問題誤判成 UI 問題。`;
    case "database-optimizer":
      return `${leadText} 以資料庫角度來看，這題要確認持久化欄位是否齊全、schema 是否支援歷史快照，以及 observation / watchlist / alerts 是否能正確關聯到同一個實體。`;
    case "product-strategist":
      return `${leadText} 以產品角度來看，這題最重要的是把分析結果轉成使用者可理解的決策訊號，而不是只停留在分數本身。`;
    case "market-researcher":
      return `${leadText} 以市場觀察角度來看，這題可以對照 insights「${insightLead}」與 brain「${brainLead}」，確認這個變化是不是單點事件，還是反映更廣的市場趨勢。`;
    case "social-intelligence":
      return `${leadText} 以社群訊號角度來看，這題要先分清楚是追蹤數、互動率、觀看率還是更新頻率在主導結果，避免只看單一數值就下結論。`;
  }
}

function roleSummary(role: IdolAgentRole, intent: AgentIntent) {
  const summaryMap: Record<AgentIntent, string> = {
    ranking_reason: "聚焦解釋為何上榜、掉榜，以及哪些訊號正在主導目前排名。",
    formula_explain: "聚焦拆解公式與權重，確認分數是怎麼被計算出來的。",
    freshness_explain: "聚焦資料新鮮度與真實更新訊號，判斷目前分數是否反映近期活動。",
    group_vs_member: "聚焦比較團體榜與成員榜的計算差異與呈現落差。",
    data_quality: "聚焦資料抓取、同步、落檔與更新可信度。",
    market_insight: "聚焦把排行榜與資料訊號轉成市場觀察結論。",
    general: "聚焦先辨識問題重點，再帶出最適合的分析角度。",
  };

  return `${role.shortLabel}：${summaryMap[intent]}`;
}

function pickSupportingRoles(primaryRoleId: IdolAgentRoleId, intent: AgentIntent): IdolAgentRoleId[] {
  switch (intent) {
    case "ranking_reason":
      return [primaryRoleId, "formula-architect", "data-pipeline-operator"];
    case "formula_explain":
      return [primaryRoleId, "ranking-analyst", "database-optimizer"];
    case "freshness_explain":
      return [primaryRoleId, "data-pipeline-operator", "social-intelligence"];
    case "group_vs_member":
      return [primaryRoleId, "ranking-analyst", "formula-architect"];
    case "data_quality":
      return [primaryRoleId, "platform-architect", "database-optimizer"];
    case "market_insight":
      return [primaryRoleId, "ranking-analyst", "social-intelligence"];
    case "general":
    default:
      return [primaryRoleId, "ranking-analyst", "formula-architect"];
  }
}

function uniqueRoles(roleIds: IdolAgentRoleId[]) {
  return [...new Set(roleIds)].slice(0, 3);
}

function buildDelegate(
  roleId: IdolAgentRoleId,
  intent: AgentIntent,
  question: string,
  entityHits: ReturnType<typeof searchEntities>,
  insightHits: ReturnType<typeof searchInsights>,
  brainHits: ReturnType<typeof searchBrain>,
): IdolAgentDelegateResult {
  const role = getIdolAgentRole(roleId);
  return {
    role: role.id,
    roleLabel: role.label,
    sourceAgentName: role.sourceAgentName,
    answer: roleFocusedAnswer(role, intent, entityHits, insightHits, brainHits),
    summary: roleSummary(role, intent),
    evidence: [
      roleEvidence(role),
      ...entityHits.slice(0, 2).map((entry) => entityEvidence(entry.entity)),
      ...insightHits.slice(0, 1).map((entry) => insightEvidence(entry.item)),
      ...brainHits.slice(0, 1).map((entry) => brainEvidence(entry.item)),
    ].slice(0, 5),
    traces: [
      { tool: "delegate_role", input: role.id, hits: 1 },
      { tool: "search_v4_entities", input: question, hits: entityHits.length },
      { tool: "search_insights", input: question, hits: insightHits.length },
      { tool: "search_brain", input: question, hits: brainHits.length },
    ],
  };
}

function buildOrchestratedAnswer(
  intent: AgentIntent,
  delegates: IdolAgentDelegateResult[],
  entityHits: ReturnType<typeof searchEntities>,
) {
  const lead = entityHits[0]?.entity;
  const intro = lead
    ? `${lead.name} 是這題目前最接近的資料對象。`
    : `這題目前沒有精準命中單一成員或團體，我先用整體榜單與資料訊號來解釋。`;

  const lines = delegates
    .map((delegate) => `1. ${delegate.roleLabel}：${delegate.answer}`)
    .join("\n");

  const conclusionMap: Record<AgentIntent, string> = {
    ranking_reason: "整體來看，這題應先判斷排名本身是否合理，再回頭看公式與更新訊號是否一起支持這個結果。",
    formula_explain: "整體來看，這題的重點是不要只看最終分數，而要看每個子分數與正規化步驟是否一致。",
    freshness_explain: "整體來看，這題最關鍵的是區分資料更新和真實社群更新，兩者混在一起時最容易誤判熱度。",
    group_vs_member: "整體來看，團體榜與成員榜使用的資料粒度不同，所以不能直接拿單一榜單結果互相替代。",
    data_quality: "整體來看，這題要先把資料管線與持久化層確認清楚，否則前端看到的結果可能只是暫時狀態。",
    market_insight: "整體來看，這題應把排行榜訊號、公式變化與市場觀察結合起來解讀，才能形成可行結論。",
    general: "整體來看，這題適合先從排名與公式切入，再依需要延伸到資料品質或市場觀察。",
  };

  return `${intro}\n\n${lines}\n\n${conclusionMap[intent]}`;
}

function buildSuggestedQuestions(role: IdolAgentRole, question: string, intent: AgentIntent) {
  const followups: Record<AgentIntent, string> = {
    ranking_reason: "這題如果只看 freshness，結論會有什麼不同？",
    formula_explain: "把這題換成實際分數拆解，會看到哪些欄位差距？",
    freshness_explain: "這題如果改看最近 14 天更新，排行會怎麼變？",
    group_vs_member: "這題如果拆開看成員個別分數，會得到什麼差異？",
    data_quality: "這題對應到哪個資料來源或 JSON 欄位最值得先檢查？",
    market_insight: "這題若整理成一則 insights，應該強調哪個趨勢？",
    general: "這題如果改從公式或 freshness 角度切入，答案會怎麼不同？",
  };

  return [...role.defaultQuestions, `${question.trim()} ${followups[intent]}`].slice(0, 4);
}

export async function runIdolPlatformAgent(input: {
  question: string;
  role?: string | null;
}): Promise<IdolAgentResult> {
  const question = String(input.question || "").trim();
  const primaryRole = getIdolAgentRole(input.role || DEFAULT_AGENT_ROLE_ID);
  const intent = inferIntent(question);
  const entityHits = searchEntities(question);
  const insightHits = searchInsights(question);
  const brainHits = searchBrain(question);
  const delegateRoleIds = uniqueRoles(pickSupportingRoles(primaryRole.id, intent));
  const delegates = delegateRoleIds.map((roleId) =>
    buildDelegate(roleId, intent, question, entityHits, insightHits, brainHits),
  );

  return {
    answer: buildOrchestratedAnswer(intent, delegates, entityHits),
    summary: `${primaryRole.shortLabel} 主導，並整合 ${delegates
      .slice(1)
      .map((delegate) => delegate.roleLabel)
      .join("、")} 的觀點。`,
    role: primaryRole.id,
    roleLabel: primaryRole.label,
    sourceAgentName: primaryRole.sourceAgentName,
    intent,
    mode: "local",
    provider: "local",
    evidence: [
      ...delegates.flatMap((delegate) => delegate.evidence),
      ...entityHits.slice(0, 2).map((entry) => entityEvidence(entry.entity)),
      ...insightHits.slice(0, 1).map((entry) => insightEvidence(entry.item)),
      ...brainHits.slice(0, 1).map((entry) => brainEvidence(entry.item)),
    ].slice(0, 10),
    traces: [
      { tool: "orchestrate_roles", input: delegateRoleIds.join(","), hits: delegates.length },
      { tool: "infer_intent", input: intent, hits: 1 },
      { tool: "search_v4_entities", input: question, hits: entityHits.length },
      { tool: "search_insights", input: question, hits: insightHits.length },
      { tool: "search_brain", input: question, hits: brainHits.length },
    ],
    suggestedQuestions: buildSuggestedQuestions(primaryRole, question, intent),
    delegates,
    orchestratedBy: "idol-agent-v2",
  };
}
