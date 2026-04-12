import type { BrainPage } from "./supabase-brain";

export type BrainLink = {
  from_slug: string;
  to_slug: string;
  link_type: string;
};

export const LOCAL_BRAIN_PAGES: BrainPage[] = [
  {
    slug: "projects/idol-platform",
    type: "project",
    title: "idol-platform",
    compiled_truth:
      "idol-platform 是面向台灣地下偶像的數據情報平台，整合成員與團體排行榜、論壇、近期活動、觀察內容與可搜尋知識頁。平台目前使用 Next.js、Supabase、Vercel 與 Python pipeline 維護資料與前端體驗。",
    timeline_md:
      "- 2025：靜態排行榜原型上線\n- 2026-04-11：論壇管理後台修復並改走 server API\n- 2026-04-12：溫度公式 v2、mixed freshness 與社群抓取接入 production\n- 2026-04-12：Secbrain 風格 knowledge base 併入 idol-platform",
    tags: ["idol-platform", "ranking", "forum", "insights", "knowledge-base"],
    frontmatter: {
      product_area: "idol analytics",
      deployment: "vercel",
      formula_version: "v2-mixed-freshness",
    },
    updated_at: "2026-04-12T00:00:00Z",
  },
  {
    slug: "concepts/idol-temperature-index-v2",
    type: "concept",
    title: "偶像溫度指數 v2",
    compiled_truth:
      "v2 公式以成員為核心，綜合社群覆蓋、資料完整度、mixed freshness 與團體關聯，再將成員表現彙整成團體排行。freshness 不再只看資料表更新時間，而是保留與真實社群發文時間混合計分的能力。",
    timeline_md:
      "- 2026-04-12：結構化 v2 ranking schema 上線\n- 2026-04-12：mixed freshness 導入\n- 2026-04-12：Instagram 最後發文時間抓取開始成為 freshness 訊號之一",
    tags: ["formula", "temperature-index", "freshness", "ranking"],
    frontmatter: {
      member_formula: "temperature_index_v2",
      group_formula: "group_temperature_index_v2",
      freshness_mode: "mixed",
    },
    updated_at: "2026-04-12T00:00:00Z",
  },
  {
    slug: "tech/secbrain-integration",
    type: "tech",
    title: "Secbrain 整合紀錄",
    compiled_truth:
      "Secbrain 整合讓 idol-platform 擁有可搜尋的知識庫層，能保存公式版本、每週市場摘要、產品研究、推薦說明與論壇管理規範。這層資料同時可被 /brain、/about、未來的推薦流程與 AI 摘要共用。",
    timeline_md:
      "- 2026-04-12：brain schema 與基礎 seed page 建立\n- 2026-04-12：/api/brain/search 與 /api/brain/page 上線\n- 2026-04-12：/brain、/brain/[...slug] 與 /about 開始讀取 brain 內容",
    tags: ["secbrain", "supabase", "api", "knowledge-base"],
    frontmatter: {
      integration_phase: "phase-1",
      first_surface: "/brain",
    },
    updated_at: "2026-04-12T00:00:00Z",
  },
  {
    slug: "reports/weekly-market-digest",
    type: "source",
    title: "本週市場摘要",
    compiled_truth:
      "本頁整理 idol-platform 目前資料產出的週市場摘要，包含市場溫度、領先團體、焦點成員與近期上升觀察。這份內容會作為後續 AI 摘要與知識頁的共同基礎來源。",
    timeline_md:
      "- 2026-04-12：weekly market digest 併入 brain runtime seed\n- 2026-04-12：/about 與 /brain 開始引用這類摘要內容",
    tags: ["weekly-digest", "market", "insights", "source"],
    frontmatter: {
      source: "pipeline/sync_brain.py",
      generated_mode: "runtime-seed",
    },
    updated_at: "2026-04-12T00:00:00Z",
  },
  {
    slug: "insights/weekly-idol-market-observation-01",
    type: "source",
    title: "每週偶像市場觀察：排行榜與波動",
    compiled_truth:
      "排行榜能提供市場觀察的切面，但真正值得注意的是分數變動背後的來源，例如資料補全、社群更新、團體結構與近期活動節奏。這類 insight 用來幫使用者理解名次變化，而不是只看單一分數。",
    timeline_md: "- 2026-04-10：insight 發布\n- 類別：市場觀察",
    tags: ["insight", "market-observation", "ranking"],
    frontmatter: {
      category: "市場觀察",
      published_at: "2026-04-10",
    },
    updated_at: "2026-04-10T00:00:00Z",
  },
  {
    slug: "insights/oshi-activity-and-fan-engagement",
    type: "source",
    title: "推活活動與粉絲互動",
    compiled_truth:
      "偶像熱度不能只看帳號存在與否，粉絲互動、更新頻率、活動參與與內容節奏都會影響真實熱度感知。這篇 insight 主要討論為何未來需要把社群互動率與更新密度逐步接入公式。",
    timeline_md: "- 2026-04-10：insight 發布\n- 類別：粉絲互動",
    tags: ["insight", "fan-engagement", "activity"],
    frontmatter: {
      category: "粉絲互動",
      published_at: "2026-04-10",
    },
    updated_at: "2026-04-10T00:00:00Z",
  },
  {
    slug: "insights/how-data-platforms-help-idol-discovery",
    type: "source",
    title: "資料平台如何幫助偶像被看見",
    compiled_truth:
      "資料平台的價值不只是做榜單，而是幫助使用者更快發現新團體、新成員與值得追蹤的動態。當排行榜、近期活動、論壇與知識頁能互相串接時，平台就不只是查資料工具，而是完整的探索入口。",
    timeline_md: "- 2026-04-10：insight 發布\n- 類別：產品思考",
    tags: ["insight", "product", "discovery"],
    frontmatter: {
      category: "產品思考",
      published_at: "2026-04-10",
    },
    updated_at: "2026-04-10T00:00:00Z",
  },
];

export const LOCAL_BRAIN_LINKS: BrainLink[] = [
  {
    from_slug: "projects/idol-platform",
    to_slug: "concepts/idol-temperature-index-v2",
    link_type: "depends_on",
  },
  {
    from_slug: "projects/idol-platform",
    to_slug: "tech/secbrain-integration",
    link_type: "uses",
  },
  {
    from_slug: "tech/secbrain-integration",
    to_slug: "reports/weekly-market-digest",
    link_type: "supports",
  },
  {
    from_slug: "concepts/idol-temperature-index-v2",
    to_slug: "insights/oshi-activity-and-fan-engagement",
    link_type: "explained_by",
  },
];

function includesText(value: string | string[] | undefined, query: string) {
  if (!value) return false;
  if (Array.isArray(value)) {
    return value.join(" ").toLowerCase().includes(query);
  }
  return value.toLowerCase().includes(query);
}

export function searchLocalBrainPages(query = "", type = "", limit = 8): BrainPage[] {
  const q = query.trim().toLowerCase();
  return LOCAL_BRAIN_PAGES.filter((page) => {
    const typeMatches = !type || page.type === type;
    if (!typeMatches) return false;
    if (!q) return true;
    return (
      includesText(page.title, q) ||
      includesText(page.slug, q) ||
      includesText(page.compiled_truth, q) ||
      includesText(page.tags, q)
    );
  })
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
    .slice(0, limit);
}

export function getLocalBrainPage(slug: string): BrainPage | null {
  return LOCAL_BRAIN_PAGES.find((page) => page.slug === slug) || null;
}

export function getLocalBrainLinks(slug: string): BrainLink[] {
  return LOCAL_BRAIN_LINKS.filter((link) => link.from_slug === slug);
}
