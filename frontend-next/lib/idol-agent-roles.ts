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
    tagline: "用這個角色快速看懂成員或團體為何上榜、掉榜，還有排名變動背後的原因。",
    mission: "專注解讀排行榜、freshness、分數差距與榜單變化，幫你快速定位誰上升、誰下滑，以及原因是什麼。",
    sourceAgentName: "Product Trend Researcher",
    sourceAgentPath: "product/product-trend-researcher.md",
    sourceCategory: "product",
    promptPath: "prompts/agents/ranking-analyst.md",
    focus: ["Top 10 排名解讀", "成員 vs 團體比較", "freshness 對榜單的影響"],
    defaultQuestions: [
      "為何有些成員不常更新卻仍然排得靠前？",
      "團體榜和成員榜為何有時看起來不一致？",
      "為什麼這位成員目前沒有進入 Top 10？",
    ],
  },
  {
    id: "formula-architect",
    label: "Formula Architect",
    shortLabel: "公式拆解",
    tagline: "用這個角色拆開分數公式，快速看懂每個欄位怎麼影響最終結果。",
    mission: "專注解讀溫度公式、權重、正規化與 freshness 等欄位，幫你確認分數設計是否合理。",
    sourceAgentName: "AI Engineer",
    sourceAgentPath: "engineering/engineering-ai-engineer.md",
    sourceCategory: "engineering",
    promptPath: "prompts/agents/formula-architect.md",
    focus: ["temperature_index_v2", "freshness mixed scoring", "公式正規化"],
    defaultQuestions: [
      "目前 v2 公式最需要補強的是什麼？",
      "為什麼最高分會是這個區間，而不是直接到 100？",
      "freshness 現在到底是怎麼影響最後分數的？",
    ],
  },
  {
    id: "data-pipeline-operator",
    label: "Data Pipeline Operator",
    shortLabel: "資料管線",
    tagline: "用這個角色追資料從哪裡來、多久更新一次，以及哪個環節可能失準。",
    mission: "專注檢查抓取流程、更新頻率、JSON 輸出與缺漏來源，幫你定位資料面出了什麼問題。",
    sourceAgentName: "Data Engineer",
    sourceAgentPath: "engineering/engineering-data-engineer.md",
    sourceCategory: "engineering",
    promptPath: "prompts/agents/data-pipeline-operator.md",
    focus: ["social activity 抓取", "last_post_at 更新", "重抓與保留舊結果"],
    defaultQuestions: [
      "新的社群更新訊號是怎麼抓進資料檔的？",
      "Instagram / Threads 的最後發文時間目前抓得如何？",
      "為什麼有些資料欄位會缺失或更新失敗？",
    ],
  },
  {
    id: "platform-architect",
    label: "Platform Architect",
    shortLabel: "平台架構",
    tagline: "用這個角色看懂 crawler、Supabase、API 與 frontend 是怎麼串起來的。",
    mission: "專注解讀平台架構與資料流，幫你判斷功能應該放在哪一層、哪個模組需要調整。",
    sourceAgentName: "Backend Architect",
    sourceAgentPath: "engineering/engineering-backend-architect.md",
    sourceCategory: "engineering",
    promptPath: "prompts/agents/platform-architect.md",
    focus: ["crawler -> supabase -> api -> frontend", "schema 與路由設計", "功能切分"],
    defaultQuestions: [
      "現在這個功能應該放在 crawler、api 還是 frontend？",
      "為什麼 /about 的公式說明和首頁資料會不同步？",
      "目前平台哪一層最容易造成資料或顯示落差？",
    ],
  },
  {
    id: "database-optimizer",
    label: "Database Optimizer",
    shortLabel: "資料庫設計",
    tagline: "用這個角色檢查 Supabase schema、RLS 與持久化資料是否設計得夠穩。",
    mission: "專注檢查資料表、索引、RLS policy 與持久化邏輯，幫你確認資料是否能安全又穩定地保存。",
    sourceAgentName: "Database Optimizer",
    sourceAgentPath: "engineering/engineering-database-optimizer.md",
    sourceCategory: "engineering",
    promptPath: "prompts/agents/database-optimizer.md",
    focus: ["Supabase schema", "RLS / policy", "watchlist / alerts persistence"],
    defaultQuestions: [
      "watchlist / alerts 目前應該怎麼設計 schema？",
      "論壇 token 的權限和 RLS 現在有哪些風險？",
      "哪些資料適合先存在本機，哪些應該進資料庫？",
    ],
  },
  {
    id: "product-strategist",
    label: "Product Strategist",
    shortLabel: "產品策略",
    tagline: "用這個角色把功能、角色與資料能力整理成更清楚的產品方向。",
    mission: "專注把 idol-platform 往 Bloomberg for idols 的方向收斂，幫你釐清優先順序與下一步產品價值。",
    sourceAgentName: "Product Manager",
    sourceAgentPath: "product/product-manager.md",
    sourceCategory: "product",
    promptPath: "prompts/agents/product-strategist.md",
    focus: ["使用者價值", "功能優先順序", "v4 產品方向"],
    defaultQuestions: [
      "現在平台最值得先補的是哪一個功能？",
      "compare / watchlist / alerts 怎麼做才更像真正可用的產品？",
      "brain 和 insights 應該怎麼接回產品主流程？",
    ],
  },
  {
    id: "market-researcher",
    label: "Market Researcher",
    shortLabel: "市場觀察",
    tagline: "用這個角色把 insights 與 brain 內容整理成可讀的市場觀察結論。",
    mission: "專注整理趨勢、內容題目與市場脈絡，幫你把分散的研究內容收斂成可理解的觀察。",
    sourceAgentName: "Product Trend Researcher",
    sourceAgentPath: "product/product-trend-researcher.md",
    sourceCategory: "product",
    promptPath: "prompts/agents/market-researcher.md",
    focus: ["市場趨勢整理", "內容與觀察摘要", "研究結論"],
    defaultQuestions: [
      "最近有哪些市場變化值得放進平台觀察？",
      "哪些團體或成員的內容訊號最值得關注？",
      "目前 brain 裡有哪些內容可以轉成市場觀察文章？",
    ],
  },
  {
    id: "social-intelligence",
    label: "Social Intelligence Strategist",
    shortLabel: "社群訊號",
    tagline: "用這個角色專注看 followers、engagement、views 等社群訊號代表什麼。",
    mission: "專注解讀社群平台上的追蹤、互動與內容表現，幫你判斷哪些指標最值得納入平台公式。",
    sourceAgentName: "Social Media Strategist",
    sourceAgentPath: "marketing/marketing-social-media-strategist.md",
    sourceCategory: "marketing",
    promptPath: "prompts/agents/social-intelligence.md",
    focus: ["社群平台訊號", "互動率 / 觀看率", "社群資料欄位設計"],
    defaultQuestions: [
      "followers / engagement / views 這些欄位要怎麼接進公式？",
      "哪些社群數據最能反映近期熱度？",
      "社群指標要怎麼設計才不容易被單日波動誤導？",
    ],
  },
];

export const DEFAULT_AGENT_ROLE_ID: IdolAgentRoleId = "ranking-analyst";

export function getIdolAgentRole(roleId?: string | null): IdolAgentRole {
  return IDOL_AGENT_ROLES.find((role) => role.id === roleId) || IDOL_AGENT_ROLES[0];
}
