export type MaturityLevel = {
  level: string;
  title: string;
  goal: string;
  current: "pass" | "partial" | "gap";
  evidence: string;
  nextAction: string;
};

export const FRONTEND_MATURITY_LEVELS: MaturityLevel[] = [
  {
    level: "L0",
    title: "原型可行性",
    goal: "頁面可開啟，核心 UI 存在。",
    current: "pass",
    evidence: "首頁、Forum、Agent、Design Studio、Creative Studio routes 已可 build。",
    nextAction: "維持 smoke test。",
  },
  {
    level: "L1",
    title: "迭代驗證",
    goal: "每次調整可重跑 typecheck / build。",
    current: "pass",
    evidence: "目前 npm run typecheck 與 npm run build 可通過。",
    nextAction: "把核心流程加入 CI smoke checklist。",
  },
  {
    level: "L2",
    title: "與人工／傳統 baseline 比較",
    goal: "比較人工查排行、人工產素材、人工整理活動的時間與品質。",
    current: "gap",
    evidence: "尚未記錄人工 baseline。",
    nextAction: "建立 5 個任務的人工完成時間與錯誤率。",
  },
  {
    level: "L3",
    title: "場景區塊測試",
    goal: "首頁排行、Forum、Agent、Design Studio、Creative Studio 分別測試。",
    current: "partial",
    evidence: "已有可操作模組，但尚未逐場景打分。",
    nextAction: "用 MVP 測試任務逐項記錄結果。",
  },
  {
    level: "L4",
    title: "選擇偏誤控制",
    goal: "避免只測高分、熱門、資料完整的偶像。",
    current: "gap",
    evidence: "尚未固定測試樣本抽樣規則。",
    nextAction: "加入熱門、冷門、solo、團體、低資料量樣本。",
  },
  {
    level: "L5",
    title: "樣本外測試",
    goal: "用未參與開發調整的新資料測試。",
    current: "gap",
    evidence: "尚未定義樣本外資料集。",
    nextAction: "每週保留 5 位新成員與 3 個新活動作 holdout。",
  },
  {
    level: "L6",
    title: "跨情境分層測試",
    goal: "依使用者角色與裝置分層測試。",
    current: "gap",
    evidence: "尚未分粉絲、管理員、研究者、商業使用者測。",
    nextAction: "桌機與手機各測一次核心任務。",
  },
  {
    level: "L7",
    title: "資料洩漏與評估污染",
    goal: "避免用開發過程已看過的案例評估。",
    current: "gap",
    evidence: "尚未建立 contamination log。",
    nextAction: "測試表加入資料是否曾被調參使用欄位。",
  },
  {
    level: "L8",
    title: "機率化效能評估",
    goal: "重複生成與互動測試穩定性。",
    current: "gap",
    evidence: "Mock provider 尚未跑多次成功率。",
    nextAction: "每個生成模式跑 10 次，記錄成功率與輸出可用率。",
  },
  {
    level: "L9",
    title: "真實效益檢定",
    goal: "證明節省時間、提升理解或提高轉換。",
    current: "gap",
    evidence: "尚未有真實使用者效益數據。",
    nextAction: "記錄完成時間、滿意度、下次使用意願。",
  },
  {
    level: "L10",
    title: "MVP / Pilot 小規模上線測試",
    goal: "小批使用者試用並形成回饋閉環。",
    current: "gap",
    evidence: "尚未正式 pilot。",
    nextAction: "邀 3-5 位使用者跑 MVP 任務並整理問題。",
  },
];

export const MVP_TEST_TASKS = [
  "查出某成員為何上榜，並能說明主要分數來源。",
  "管理員進入論壇後台並完成一個管理操作。",
  "用 Agent 問排名差異，確認回答對應問題而非泛用回答。",
  "用 Design Studio 建立活動頁，完成預覽與 HTML / ZIP 匯出。",
  "用 Creative Studio 選成員產生社群文案，保存到素材庫並匯出。",
];
