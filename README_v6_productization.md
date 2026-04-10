# Idol Platform v6 – 完整產品化

## 目標
把 v5.2 的 MVP 升級成可對外展示、可持續擴充、可接近正式營運的產品骨架。

## v6 核心模組
- Auth API 與 user profile scaffold
- Notification center
- Alert events schema
- Recommendation v2
- Pricing / SaaS plan page
- Productization docs

## 本次新增
- `supabase/v6_schema.sql`
- `app/api/auth/me/route.ts`
- `app/api/notifications/route.ts`
- `app/notifications/page.tsx`
- `app/pricing/page.tsx`
- `lib/recommendation/advanced.ts`

## 產品化方向
### 1. User System
- user profile
- plan / tier
- notification preferences

### 2. Notification Center
- alert events feed
- unread state
- in-app notification UI

### 3. Recommendation v2
- watchlist-aware ranking
- momentum boost
- reliability guardrail

### 4. Commercialization
- Free / Pro / Enterprise pricing
- API / report / premium analytics

## 下一步
- 真正接 Supabase Auth session
- 啟用 RLS 綁定 auth.uid()
- 通知寄送 worker
- AI explanation layer
