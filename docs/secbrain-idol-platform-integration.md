# Secbrain x idol-platform

## 結合判斷

`chengan-Secbrain` 目前最有價值的部分不是前端，而是它的 Supabase knowledge-base schema：

- `brain_pages`
- `brain_links`
- `brain_timeline_entries`
- `brain_page_versions`

這套資料模型很適合直接變成 `idol-platform` 的共用知識層，用來承接：

- AI 市場摘要的背景知識
- 溫度公式與版本變更記錄
- 推薦理由的可追溯說明
- 論壇管理與產品決策備忘
- 團體 / 成員 / 事件之間的概念連結

## 第一階段整合

本次已先落三件事：

1. Supabase migration
   - 檔案：`supabase/migrations/005_secbrain_knowledge_base.sql`
   - 內容：導入 `brain_*` tables、trigger、index、RLS

2. 初始 seed pages
   - `projects/idol-platform`
   - `concepts/idol-temperature-index-v2`
   - `tech/secbrain-integration`

3. 最小可用讀取 API
   - 路徑：`/api/brain/search`
   - 參數：
     - `q`
     - `type`
     - `limit`

## 推薦的後續接法

### 1. AI 摘要

讓每週 market summary 先查 `brain_pages`：

- 溫度公式版本
- 最近重大改版
- 活動分析詞彙
- 風險模型說明

這樣 AI 輸出會比較穩，也比較能解釋。

### 2. 推薦理由

把推薦頁面的 explainability 改成引用 `brain_pages`：

- 為何某團體被推薦
- 為何某成員熱度上升
- 公式是看哪些訊號

### 3. 論壇管理

把論壇規範、常見違規處理原則、管理員操作準則寫成 brain pages，
未來後台可直接查詢與引用。

### 4. 研究 / 營運知識

把外部資料來源、合作品牌觀察、偶像市場研究、競品紀錄，
都集中到同一層，避免散落在 Notion / README / 對話裡。

## 實作注意

- 目前 `brain` API 預設吃：
  - `NEXT_PUBLIC_BRAIN_SB_URL`
  - `NEXT_PUBLIC_BRAIN_SB_ANON`
- 若未設定，會 fallback 到 forum Supabase 設定
- 若要正式啟用，需先在 Supabase 執行 migration 005

## 建議第二階段

1. 新增 `/api/brain/page?slug=...`
2. 新增 `brain_links` 視圖，做關聯推薦
3. 把 `/about` 的公式說明與 brain page 同步
4. 讓 AI insights pipeline 寫回 `brain_timeline_entries`
