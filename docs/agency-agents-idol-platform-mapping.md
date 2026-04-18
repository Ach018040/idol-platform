# agency-agents x idol-platform 對照表

| idol-platform 角色 | 來源 agent | 類別 | 最適用場景 | 為何適合 |
| --- | --- | --- | --- | --- |
| Ranking Analyst | `product/product-trend-researcher.md` | Product | 解釋榜單、掉榜、排名跳動 | 擅長把資料變化翻成趨勢敘事，適合回答「為何現在排這樣」 |
| Formula Architect | `engineering/engineering-ai-engineer.md` | Engineering | 拆公式、權重、可信度 | 適合把 v2 / mixed freshness 這類規則做成可解釋系統 |
| Data Pipeline Operator | `engineering/engineering-data-engineer.md` | Engineering | 抓取流程、欄位缺失、重跑策略 | 最適合處理 social activity、last_post_at、增量更新 |
| Platform Architect | `engineering/engineering-backend-architect.md` | Engineering | crawler -> supabase -> api -> frontend | 可把單點問題拉回整體資料流與部署層判斷 |
| Database Optimizer | `engineering/engineering-database-optimizer.md` | Engineering | Supabase schema、policy、索引 | 適合 watchlist、alerts、forum runtime 的持久化設計 |
| Product Strategist | `product/product-manager.md` | Product | v4 路線圖、功能排序、定位 | 適合把平台從榜單站推進成 Bloomberg for idols |
| Market Researcher | `product/product-trend-researcher.md` | Product | 本週社群焦點、市場摘要、brain 索引 | 可把 insights / brain 轉成策略內容，而非純資料轉述 |
| Social Intelligence Strategist | `marketing/marketing-social-media-strategist.md` | Marketing | followers、engagement、views、內容型態 | 最接近你要的社群可信度補強方向 |

## 適配原則

1. 不直接把 `agency-agents` 當成 runtime 引擎。
2. 只吸收它的角色切分、回答視角與任務邊界。
3. 角色真正使用的平台資料仍以 `idol-platform` 本地 JSON / API / brain / insights 為主。
4. 角色定義同步落到 `prompts/agents/*.md` 與 schema，便於後續接 OpenAI / Claude provider。
