export type IdolAgentRoleId =
  | "ranking-analyst"
  | "formula-architect"
  | "data-pipeline-operator"
  | "platform-architect"
  | "database-optimizer"
  | "product-strategist"
  | "market-researcher"
  | "social-intelligence";

export type IdolAgentRole = {
  id: IdolAgentRoleId;
  label: string;
  shortLabel: string;
  tagline: string;
  mission: string;
  sourceAgentName: string;
  sourceAgentPath: string;
  sourceCategory: "engineering" | "product" | "marketing";
  promptPath: string;
  focus: string[];
  defaultQuestions: string[];
};

export const IDOL_AGENT_ROLES: IdolAgentRole[] = [
  {
    id: "ranking-analyst",
    label: "Ranking Analyst",
    shortLabel: "排名分析",
    tagline: "解釋成員與團體為何上榜、掉榜或排名跳動。",
    mission: "把溫度分數、freshness 與榜單邏輯翻成可理解的分析結論。",
    sourceAgentName: "Product Trend Researcher",
    sourceAgentPath: "product/product-trend-researcher.md",
    sourceCategory: "product",
    promptPath: "prompts/agents/ranking-analyst.md",
    focus: ["Top 10 排名解釋", "成員 vs 團體差異", "freshness 對榜單影響"],
    defaultQuestions: [
      "為何有些成員不常更新卻仍然排在前面？",
      "團體榜和成員榜為何有時不一致？",
      "為何這位成員現在掉出 Top 10？",
    ],
  },
  {
    id: "formula-architect",
    label: "Formula Architect",
    shortLabel: "公式設計",
    tagline: "專注溫度公式、權重、可信度與解釋透明度。",
    mission: "把平台指標拆成可驗證的公式邏輯與補強方向。",
    sourceAgentName: "AI Engineer",
    sourceAgentPath: "engineering/engineering-ai-engineer.md",
    sourceCategory: "engineering",
    promptPath: "prompts/agents/formula-architect.md",
    focus: ["temperature_index_v2", "freshness mixed scoring", "可信度說明"],
    defaultQuestions: [
      "目前 v2 公式最需要補強的是什麼？",
      "為何最高分不是 100，應該怎麼解釋？",
      "如何讓 freshness 與社群訊號一起作用？",
    ],
  },
  {
    id: "data-pipeline-operator",
    label: "Data Pipeline Operator",
    shortLabel: "資料管線",
    tagline: "檢查抓取來源、更新頻率、缺值與重跑策略。",
    mission: "把平台缺資料、重抓條件與 JSON 欄位落成可執行任務。",
    sourceAgentName: "Data Engineer",
    sourceAgentPath: "engineering/engineering-data-engineer.md",
    sourceCategory: "engineering",
    promptPath: "prompts/agents/data-pipeline-operator.md",
    focus: ["social activity 抓取", "last_post_at 欄位", "增量更新策略"],
    defaultQuestions: [
      "哪些欄位還沒抓到，所以公式可信度不夠？",
      "Instagram / Threads 最後發文時間要怎麼補？",
      "為何有些帳號只有舊資料卻還保留分數？",
    ],
  },
  {
    id: "platform-architect",
    label: "Platform Architect",
    shortLabel: "平台架構",
    tagline: "對齊 crawler、Supabase、API、frontend 的整體資料流。",
    mission: "把單一問題放回整體平台架構，指出最小可行修正點。",
    sourceAgentName: "Backend Architect",
    sourceAgentPath: "engineering/engineering-backend-architect.md",
    sourceCategory: "engineering",
    promptPath: "prompts/agents/platform-architect.md",
    focus: ["crawler -> supabase -> api -> frontend", "schema 對齊", "部署風險"],
    defaultQuestions: [
      "這個功能應該落在 crawler、api 還是 frontend？",
      "排行榜與 /about 公式不同步時要先查哪一層？",
      "新欄位上線時資料流要怎麼接最穩？",
    ],
  },
  {
    id: "database-optimizer",
    label: "Database Optimizer",
    shortLabel: "資料庫優化",
    tagline: "聚焦 Supabase schema、RLS、索引與持久化策略。",
    mission: "把新功能需要的資料表、欄位與 policy 具體化。",
    sourceAgentName: "Database Optimizer",
    sourceAgentPath: "engineering/engineering-database-optimizer.md",
    sourceCategory: "engineering",
    promptPath: "prompts/agents/database-optimizer.md",
    focus: ["Supabase schema", "RLS / policy", "watchlist / alerts persistence"],
    defaultQuestions: [
      "watchlist / alerts 還需要哪些 schema 才算正式？",
      "論壇 token 模型下，RLS 應該怎麼設比較穩？",
      "哪些表需要索引避免排行榜或 agent 變慢？",
    ],
  },
  {
    id: "product-strategist",
    label: "Product Strategist",
    shortLabel: "產品策略",
    tagline: "把數據平台功能轉成使用者價值、頁面定位與 roadmap。",
    mission: "讓 idol-platform 更像 Bloomberg for idols，而不是只是一張榜單。",
    sourceAgentName: "Product Manager",
    sourceAgentPath: "product/product-manager.md",
    sourceCategory: "product",
    promptPath: "prompts/agents/product-strategist.md",
    focus: ["使用者價值", "功能優先順序", "v4 路線圖"],
    defaultQuestions: [
      "下一步最值得上的功能是什麼？",
      "compare / watchlist / alerts 要怎麼變成日常使用功能？",
      "如何把 /brain、/insights、排行榜串成同一產品故事？",
    ],
  },
  {
    id: "market-researcher",
    label: "Market Researcher",
    shortLabel: "市場研究",
    tagline: "從 insights 與 brain 提煉市場觀察、受眾與趨勢。",
    mission: "把週觀察、社群訊號與內容趨勢整理成策略摘要。",
    sourceAgentName: "Product Trend Researcher",
    sourceAgentPath: "product/product-trend-researcher.md",
    sourceCategory: "product",
    promptPath: "prompts/agents/market-researcher.md",
    focus: ["市場觀察", "本週社群焦點", "偶像發展趨勢"],
    defaultQuestions: [
      "本週社群焦點該怎麼寫才不只是榜單摘要？",
      "哪些團體的成長曲線值得特別關注？",
      "目前 brain 裡缺哪類市場研究內容？",
    ],
  },
  {
    id: "social-intelligence",
    label: "Social Intelligence Strategist",
    shortLabel: "社群洞察",
    tagline: "關注平台覆蓋、互動訊號、社群內容型態與可信度。",
    mission: "把社群覆蓋、互動率與真實更新訊號翻成可操作的洞察。",
    sourceAgentName: "Social Media Strategist",
    sourceAgentPath: "marketing/marketing-social-media-strategist.md",
    sourceCategory: "marketing",
    promptPath: "prompts/agents/social-intelligence.md",
    focus: ["平台覆蓋", "互動率 / 觀看率", "社群內容解讀"],
    defaultQuestions: [
      "如何用 followers / engagement / views 強化公式可信度？",
      "哪些社群欄位最值得先實作？",
      "社群之王要怎麼定義才不會和排行打架？",
    ],
  },
];

export const DEFAULT_AGENT_ROLE_ID: IdolAgentRoleId = "ranking-analyst";

export function getIdolAgentRole(roleId?: string | null): IdolAgentRole {
  return IDOL_AGENT_ROLES.find((role) => role.id === roleId) || IDOL_AGENT_ROLES[0];
}
