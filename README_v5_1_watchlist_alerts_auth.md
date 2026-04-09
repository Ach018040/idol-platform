# Idol Platform v5.1 – Watchlist + Alerts + 使用者系統

## 目標
把 v5 的推し分析平台升級成真正可被使用者操作的產品骨架：
- 使用者識別
- Watchlist 收藏推し
- Alerts 規則與通知入口
- 個人化 dashboard 基礎

## 本次新增
- `supabase/v5_1_schema.sql`
- `lib/auth/session.ts`
- `/api/watchlist`
- `/api/alerts`
- `/watchlist`
- `/alerts`
- `/login`

## 設計原則
1. 先完成產品骨架，再接真正 Supabase Auth。
2. 目前以 `x-user-id` header 或 `NEXT_PUBLIC_DEMO_USER_ID` 作為 demo 使用者來源。
3. 所有 watchlist 與 alert 皆綁定 `user_id`。

## Watchlist
每位使用者可收藏多位成員，並集中查看：
- Temperature
- Social Activity
- Momentum
- 推し分析入口

## Alerts
目前提供 rule-based alerts 基礎：
- temperature_above
- momentum_above
- reliability_below

## 真正上線前建議
1. 接 Supabase Auth
2. 用 Row Level Security 綁定 `auth.uid()`
3. 用 cron / worker 執行 alert evaluation
4. 增加 email / in-app notification delivery

## 立即可做
1. 執行 `supabase/v5_1_schema.sql`
2. 設定 `.env` 中的 `NEXT_PUBLIC_DEMO_USER_ID`
3. 開 `/watchlist` 與 `/alerts`
