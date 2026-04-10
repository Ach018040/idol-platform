# Idol Platform v5.2 – Auth + Alert Engine + 推薦系統

## 目標
把 v5.1 的 SaaS prototype 補齊成可營運產品骨架：
- Auth scaffold
- Alert evaluation engine
- Recommendation API / Page
- Notion Build Pack 同步紀錄

## 本次新增
- `lib/auth/supabaseAuth.ts`
- `app/api/auth/me/route.ts`
- `scripts/evaluate_alerts.py`
- `lib/recommendation/recommend.ts`
- `app/api/recommendations/route.ts`
- `app/recommendations/page.tsx`

## Auth
目前採可銜接 Supabase Auth 的 scaffold：
- 前端/Server 可從 header 或 env 取得 demo user
- 預留未來改成 `auth.uid()` + RLS

## Alert Engine
以 rule-based 條件運作：
- `temperature_above`
- `momentum_above`
- `reliability_below`

評估流程：
1. 讀取 alert rules
2. 讀取 latest score
3. 比較 threshold
4. 寫入 `user_alert_events`

## Recommendation
目前先用 rule-based 推薦：
- 高 temperature
- 高 momentum
- 排除已在 watchlist 的 member
- 優先回傳成長型 / 爆紅型標的

## 下一步
1. 真正接 Supabase Auth
2. 為 watchlist / alerts / recommendations 加 RLS
3. 建立通知 worker（email / in-app）
4. 增加 collaborative filtering / similarity model
