export type WorkState = "backlog" | "ready" | "running" | "human-review" | "done" | "blocked";

export type WorkKind = "frontend" | "crawler" | "studio" | "validation" | "forum" | "data";

export type WorkItem = {
  id: string;
  title: string;
  kind: WorkKind;
  state: WorkState;
  owner: string;
  goal: string;
  successCriteria: string[];
  proofRequired: string[];
  risk: "low" | "medium" | "high";
};

export type AgentRun = {
  id: string;
  workItemId: string;
  title: string;
  state: WorkState;
  workspace: string;
  agentRole: string;
  startedAt: string;
  proof: string[];
  handoff: string;
};

export const WORK_STATES: { id: WorkState; label: string; description: string }[] = [
  { id: "backlog", label: "Backlog", description: "已記錄，但尚未準備執行。" },
  { id: "ready", label: "Ready", description: "需求清楚、無阻塞，可交給 agent run。" },
  { id: "running", label: "Running", description: "已有獨立工作區與執行紀錄。" },
  { id: "human-review", label: "Human Review", description: "等待人工驗收 proof-of-work。" },
  { id: "done", label: "Done", description: "已完成、驗證並可合併或上線。" },
  { id: "blocked", label: "Blocked", description: "缺少權限、資料、API key 或決策。" },
];

export const ORCHESTRATION_WORK_ITEMS: WorkItem[] = [
  {
    id: "work-design-studio-export",
    title: "Design Studio exporter 完整化",
    kind: "studio",
    state: "ready",
    owner: "design-agent",
    goal: "將 PDF / PPTX exporter 從 queued stub 升級為可下載輸出。",
    successCriteria: ["HTML / Markdown / ZIP 不回歸", "PDF job 有可驗證輸出", "PPTX job 有可驗證輸出"],
    proofRequired: ["npm run typecheck", "npm run build", "匯出檔案 smoke test"],
    risk: "medium",
  },
  {
    id: "work-creative-provider",
    title: "Creative Studio 接真 provider 前置",
    kind: "studio",
    state: "ready",
    owner: "creative-agent",
    goal: "定義 Muapi / Replicate / Fal / OpenAI Images / self-hosted SD 的 provider adapter 介面。",
    successCriteria: ["mock provider 不破壞", "provider 設定有成本與安全 guardrails", "prompt_run 保留 provider 與時間"],
    proofRequired: ["typecheck", "provider config review", "policy checklist"],
    risk: "high",
  },
  {
    id: "work-event-crawler",
    title: "Scrapling 活動來源調校",
    kind: "crawler",
    state: "blocked",
    owner: "crawler-agent",
    goal: "增加可信活動來源並提升 event_discovery.json 命中率。",
    successCriteria: ["至少 3 個來源", "活動時間與場地可抽取", "信心分數 >= 0.7 的資料可人工驗收"],
    proofRequired: ["python pipeline/event_crawler.py", "event_discovery.json diff", "來源授權檢查"],
    risk: "medium",
  },
  {
    id: "work-validation-l3",
    title: "前端 L3 場景區塊測試",
    kind: "validation",
    state: "ready",
    owner: "qa-agent",
    goal: "把首頁排行、Forum、Agent、Design Studio、Creative Studio 五條流程測到 L3。",
    successCriteria: ["五條 MVP 任務都有完成率", "每條任務有卡點紀錄", "形成 Go/Pivot 建議"],
    proofRequired: ["validation page review", "manual smoke notes", "build status"],
    risk: "low",
  },
  {
    id: "work-forum-admin-smoke",
    title: "Forum 管理員權限 smoke test",
    kind: "forum",
    state: "human-review",
    owner: "forum-agent",
    goal: "確認正式站 /forum/admin 權限與管理操作仍可用。",
    successCriteria: ["可登入後台", "可看到管理操作", "非管理員不可執行管理操作"],
    proofRequired: ["manual screenshot", "admin API response", "RLS policy note"],
    risk: "medium",
  },
];

export function createRunForWorkItem(item: WorkItem): AgentRun {
  const now = new Date().toISOString();
  return {
    id: `run-${item.id}-${Date.now()}`,
    workItemId: item.id,
    title: item.title,
    state: "running",
    workspace: `workspaces/${item.id}`,
    agentRole: item.owner,
    startedAt: now,
    proof: item.proofRequired,
    handoff: "完成後需附上 proof-of-work，並移交 Human Review。",
  };
}
