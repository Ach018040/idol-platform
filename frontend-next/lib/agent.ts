import { promises as fs } from "fs";
import path from "path";

type MemberRecord = {
  rank?: number;
  id?: string;
  name: string;
  group?: string;
  social_activity?: number;
  temperature_index?: number;
  temperature_index_v2?: number;
  days_since_update?: number;
  freshness_score?: number;
  data_confidence?: number;
  instagram?: string;
  facebook?: string;
  twitter?: string;
  threads?: string;
};

type GroupRecord = {
  rank?: number;
  group?: string;
  display_name?: string;
  member_count?: number;
  member_names?: string;
  social_activity?: number;
  temperature_index?: number;
  group_temperature_index_v2?: number;
  days_since_update?: number;
  last_group_snapshot_at?: string | null;
};

type InsightRecord = {
  slug: string;
  title: string;
  summary: string;
  category: string;
  date: string;
  content: string[];
};

type BrainRecord = {
  slug: string;
  type: string;
  title: string;
  compiled_truth: string;
  tags: string[];
  updated_at: string;
};

export type AgentEvidence = {
  type: "member" | "group" | "insight" | "brain" | "market";
  title: string;
  snippet: string;
  href?: string;
};

export type AgentToolTrace = {
  tool: string;
  input: string;
  hits: number;
};

export type AgentResult = {
  answer: string;
  summary: string;
  evidence: AgentEvidence[];
  traces: AgentToolTrace[];
  suggestedQuestions: string[];
};

const DATA_ROOT = path.join(process.cwd(), "public", "data");

async function readJson<T>(filename: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(path.join(DATA_ROOT, filename), "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function normalizeText(value: string | undefined | null) {
  return (value || "").toLowerCase();
}

function scoreMatch(query: string, values: Array<string | undefined | null>) {
  const q = normalizeText(query).trim();
  if (!q) return 0;
  let score = 0;
  for (const value of values) {
    const normalized = normalizeText(value);
    if (!normalized) continue;
    if (normalized === q) score += 10;
    else if (normalized.includes(q)) score += 5;
  }
  return score;
}

function fmt(value: number | undefined | null, digits = 1) {
  const num = Number(value ?? 0);
  return Number.isFinite(num) ? num.toFixed(digits) : "0";
}

function freshnessText(days: number | undefined | null) {
  const d = Number(days ?? 365);
  if (d <= 10) return "近期有更新";
  if (d <= 30) return "近況更新";
  if (d <= 90) return "已一段時間未更新";
  return "超過 90 天未更新";
}

function topMembersSummary(members: MemberRecord[]) {
  return members
    .slice(0, 3)
    .map((member, index) => `${index + 1}. ${member.name} ${fmt(member.temperature_index_v2 ?? member.temperature_index)}`)
    .join("；");
}

function topGroupsSummary(groups: GroupRecord[]) {
  return groups
    .slice(0, 3)
    .map((group, index) => `${index + 1}. ${group.display_name || group.group} ${fmt(group.group_temperature_index_v2 ?? group.temperature_index)}`)
    .join("；");
}

function buildEvidenceFromMember(member: MemberRecord): AgentEvidence {
  return {
    type: "member",
    title: member.name,
    snippet: `溫度 ${fmt(member.temperature_index_v2 ?? member.temperature_index)}，社群覆蓋 ${fmt(
      member.social_activity,
      0
    )}，${freshnessText(member.days_since_update)}`,
    href: `/members/${encodeURIComponent(member.name)}`,
  };
}

function buildEvidenceFromGroup(group: GroupRecord): AgentEvidence {
  const name = group.display_name || group.group || "未知團體";
  return {
    type: "group",
    title: name,
    snippet: `溫度 ${fmt(group.group_temperature_index_v2 ?? group.temperature_index)}，成員 ${
      group.member_count ?? 0
    } 人，${freshnessText(group.days_since_update)}`,
    href: `/groups/${encodeURIComponent(name)}`,
  };
}

function buildEvidenceFromInsight(insight: InsightRecord): AgentEvidence {
  return {
    type: "insight",
    title: insight.title,
    snippet: insight.summary,
    href: `/insights/${encodeURIComponent(insight.slug)}`,
  };
}

function buildEvidenceFromBrain(brain: BrainRecord): AgentEvidence {
  return {
    type: "brain",
    title: brain.title,
    snippet: brain.compiled_truth,
    href: `/brain/${brain.slug.split("/").map(encodeURIComponent).join("/")}`,
  };
}

function buildSuggestedQuestions(query: string) {
  const q = query.trim();
  return [
    `${q} 為何目前分數這樣計算？`,
    `${q} 最近有哪些變動值得注意？`,
    `${q} 在排行榜中的位置合理嗎？`,
  ];
}

export async function runIdolAgent(question: string): Promise<AgentResult> {
  const [members, groups, insights, brain] = await Promise.all([
    readJson<MemberRecord[]>("member_rankings.json", []),
    readJson<GroupRecord[]>("v7_rankings.json", []),
    readJson<InsightRecord[]>("insight_posts.json", []),
    readJson<BrainRecord[]>("brain_pages_fallback.json", []),
  ]);

  const rankedMembers = [...members].sort(
    (a, b) => (b.temperature_index_v2 ?? b.temperature_index ?? 0) - (a.temperature_index_v2 ?? a.temperature_index ?? 0)
  );
  const rankedGroups = [...groups].sort(
    (a, b) =>
      (b.group_temperature_index_v2 ?? b.temperature_index ?? 0) -
      (a.group_temperature_index_v2 ?? a.temperature_index ?? 0)
  );

  const memberHits = rankedMembers
    .map((member) => ({
      item: member,
      score: scoreMatch(question, [member.name, member.group]),
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((entry) => entry.item);

  const groupHits = rankedGroups
    .map((group) => ({
      item: group,
      score: scoreMatch(question, [group.display_name, group.group, group.member_names]),
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((entry) => entry.item);

  const insightHits = insights
    .map((item) => ({
      item,
      score: scoreMatch(question, [item.title, item.summary, item.category, item.content.join(" ")]),
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((entry) => entry.item);

  const brainHits = brain
    .map((item) => ({
      item,
      score: scoreMatch(question, [item.title, item.slug, item.compiled_truth, item.tags.join(" ")]),
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((entry) => entry.item);

  const traces: AgentToolTrace[] = [
    { tool: "search_members", input: question, hits: memberHits.length },
    { tool: "search_groups", input: question, hits: groupHits.length },
    { tool: "search_insights", input: question, hits: insightHits.length },
    { tool: "search_brain", input: question, hits: brainHits.length },
  ];

  const evidence: AgentEvidence[] = [
    ...memberHits.map(buildEvidenceFromMember),
    ...groupHits.map(buildEvidenceFromGroup),
    ...insightHits.map(buildEvidenceFromInsight),
    ...brainHits.map(buildEvidenceFromBrain),
  ].slice(0, 8);

  let answer = "";
  let summary = "";

  if (memberHits.length > 0) {
    const member = memberHits[0];
    answer = `${member.name} 目前分數為 ${fmt(member.temperature_index_v2 ?? member.temperature_index)}。主要受社群覆蓋 ${
      fmt(member.social_activity, 0)
    }、資料完整度與 freshness 影響；就平台現在可見資料來看，${freshnessText(member.days_since_update)}。如果你認知中的社群活躍度更高，通常代表真實貼文更新尚未完整被平台抓進來。`;
    summary = `${member.name} 的名次主要由目前平台可得資料決定，不等同完整社群互動表現。`;
  } else if (groupHits.length > 0) {
    const group = groupHits[0];
    const groupName = group.display_name || group.group || "該團體";
    answer = `${groupName} 目前團體溫度為 ${fmt(
      group.group_temperature_index_v2 ?? group.temperature_index
    )}。團體榜不是單看單一成員，而是綜合成員平均、團內最高分、團體社群覆蓋與更新狀態，所以有時會和成員榜觀感不同。`;
    summary = `${groupName} 的團體名次來自團體綜合公式，不是單兵前 10 的直接投影。`;
  } else {
    answer = `目前我先用平台現有資料為你做整體回答：成員榜前段是 ${topMembersSummary(
      rankedMembers
    )}；團體榜前段是 ${topGroupsSummary(
      rankedGroups
    )}。若你想看某位成員、某個團體、排行跳動原因、公式邏輯或近期市場觀察，我可以再用平台資料往下拆。`;
    summary = "這是一個結合排行榜、insights 與 brain 知識頁的檢索式回答。";
  }

  return {
    answer,
    summary,
    evidence,
    traces,
    suggestedQuestions: buildSuggestedQuestions(question),
  };
}
