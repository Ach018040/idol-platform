import type { DesignProjectInput, DesignSkillId, DesignTemplateId, VisualDirectionId } from "../schemas";

export type IdolDesignTemplate = {
  id: DesignTemplateId;
  title: string;
  description: string;
  skillId: DesignSkillId;
  output: string;
};

export type VisualDirection = {
  id: VisualDirectionId;
  name: string;
  description: string;
  palette: [string, string, string, string];
};

export const DESIGN_TEMPLATES: IdolDesignTemplate[] = [
  {
    id: "member-profile",
    title: "成員 Profile 頁",
    description: "介紹成員人設、SNS、代表色、粉絲入口與推薦文案。",
    skillId: "idol-profile",
    output: "Landing Page / SNS 宣傳圖",
  },
  {
    id: "event-landing",
    title: "活動 Landing Page",
    description: "整理時間、地點、出演名單、售票 CTA 與粉絲懶人包。",
    skillId: "idol-event-page",
    output: "活動官網頁 / 時間表圖卡",
  },
  {
    id: "birthday-campaign",
    title: "生日祭宣傳頁",
    description: "以成員生日祭為核心，產出故事化宣傳頁與社群圖卡。",
    skillId: "idol-profile",
    output: "生日頁 / 社群圖卡",
  },
  {
    id: "cheki-merch-report",
    title: "チェキ物販分析報告",
    description: "把物販規則、單價、轉換、粉絲行為整理成分析報告。",
    skillId: "idol-market-report",
    output: "PDF / Markdown 報告",
  },
  {
    id: "weekly-market-report",
    title: "偶像市場週報",
    description: "整合排行、活動、社群訊號，產出週報與簡報摘要。",
    skillId: "idol-market-report",
    output: "週報 / 簡報",
  },
  {
    id: "virtual-exhibition-home",
    title: "虛擬展場首頁",
    description: "打造資料入口、團體牆、活動時間軸與粉絲文化展區。",
    skillId: "idol-virtual-exhibition",
    output: "互動展場頁",
  },
  {
    id: "investment-pitch-deck",
    title: "投資 / 提案簡報",
    description: "將 idol-platform v5 包裝成商業提案、產品路線與市場敘事。",
    skillId: "idol-pitch-deck",
    output: "PPTX / PDF / HTML deck",
  },
];

export const VISUAL_DIRECTIONS: VisualDirection[] = [
  {
    id: "strawberry-pop",
    name: "草莓粉 Pop",
    description: "高甜度、可愛活潑、適合成員 profile 與生日祭。",
    palette: ["#ff5c8a", "#ffd1dc", "#fff7fb", "#1f1020"],
  },
  {
    id: "stage-neon",
    name: "舞台霓虹",
    description: "高對比舞台感，適合活動頁與售票轉換。",
    palette: ["#23d5ff", "#ff4fd8", "#ffe66d", "#07111f"],
  },
  {
    id: "editorial-data",
    name: "資料雜誌",
    description: "成熟、可信、資訊密度高，適合市場週報與提案簡報。",
    palette: ["#f7f2e8", "#161616", "#2f6fed", "#c97b2b"],
  },
  {
    id: "otome-card",
    name: "乙女遊戲風",
    description: "角色卡、台詞框、收藏感，適合成員與物販卡片。",
    palette: ["#7c3aed", "#f8c8dc", "#fdf2f8", "#21122e"],
  },
  {
    id: "gallery-white",
    name: "白盒展場",
    description: "乾淨展覽感，適合虛擬展場與資料牆。",
    palette: ["#f8fafc", "#111827", "#38bdf8", "#f59e0b"],
  },
];

export const DEFAULT_PROJECT: DesignProjectInput = {
  title: "桜野杏理 Profile 企劃",
  templateId: "member-profile",
  skillId: "idol-profile",
  dataSource: "member",
  designSystemId: "idol-platform",
  visualDirectionId: "strawberry-pop",
  brief: "成員 Profile 頁、SNS 宣傳圖、生日祭頁面、物販介紹卡、乙女遊戲風角色頁。",
  member: {
    name: "桜野杏理",
    nickname: "あんちゃん",
    color: "草莓粉",
    symbol: "🍓",
    tags: ["甜點", "恐怖遊戲", "鬼故事", "可愛活潑"],
  },
};

export function getTemplate(id: DesignTemplateId) {
  return DESIGN_TEMPLATES.find((template) => template.id === id) ?? DESIGN_TEMPLATES[0];
}

export function getVisualDirection(id: VisualDirectionId) {
  return VISUAL_DIRECTIONS.find((direction) => direction.id === id) ?? VISUAL_DIRECTIONS[0];
}
