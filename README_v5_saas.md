# Idol Platform v5 – 推し分析 + SaaS 化

## 目標
將既有 v4.x 排行榜、趨勢圖與 member insights 升級成可持續經營的 SaaS 產品原型。

## v5 核心模組

### 1. 推し分析（Oshi Analytics）
- 成員熱度拆解
- 粉絲互動風格分析
- Momentum / Stability / Reliability 綜合判讀
- AI 解釋文案生成入口

### 2. Watchlist（追蹤名單）
- 使用者可收藏多位成員
- 集中查看熱度變化
- 作為未來通知與個人化推薦基礎

### 3. Alerts（通知）
- 熱度突然升高
- Momentum 連續上升
- 互動率異常放大

### 4. Groups / Portfolio View
- 團體整體表現
- 個人推し組合總覽
- 熱度與穩定性混合比較

## 資料流
Crawler -> Daily Metrics -> Scoring v4 -> Oshi Analysis -> Watchlist / Alerts -> Dashboard / API

## 這次新增
- Oshi analysis helper
- Oshi API route
- Watchlist schema patch
- Watchlist dashboard page
- Oshi member page

## 下一步
- 接入 Supabase Auth
- 加入 usage tiers (Free / Pro)
- 建立 notification worker
- 實作 AI explanation generation using saved score snapshots
