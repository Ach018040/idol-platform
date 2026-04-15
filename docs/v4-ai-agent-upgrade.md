# v4 AI Agent Upgrade

## 整合方向

本次不是另外做一個獨立 AI 專案，而是把 AI Agent 直接建在 `idol-platform` 現有資料鏈上：

- `member_rankings.json`
- `v7_rankings.json`
- `insight_posts.json`
- `brain_pages_fallback.json`

這樣做的好處是：

- 回答可直接引用平台自己的排行與知識頁
- 沒有外部模型時也能提供可部署的 deterministic agent
- 之後若要接 OpenAI / Claude，只需升級 answerer 層，不需要重做檢索層

## 參考來源

### `andrej-karpathy-skills`
- 強調技能模組化、能力拆分、以明確任務處理工具為核心
- 對應到本專案的做法是把 agent 拆成：
  - `search_members`
  - `search_groups`
  - `search_insights`
  - `search_brain`

### `claude-cookbooks`
- 強調 retrieval、tool use、traceability、可解釋輸出
- 對應到本專案的做法是：
  - 保留 evidence
  - 保留 traces
  - 保留 suggestedQuestions

## 已上線內容

- `/agent`
- `/api/agent/query`
- `frontend-next/lib/agent.ts`

## 下一步

1. 接入真實 LLM provider
2. 加入 forum / events / pricing 等更多工具
3. 加入 agent memory 與 session history
4. 將 `/agent` 接到首頁主導航
