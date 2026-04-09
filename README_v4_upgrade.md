# 🚀 Idol Platform v4 Upgrade

This document integrates the full v4 scoring system into the existing idol-platform repo.

## ✅ What is added
- Python scoring engine (v4)
- Supabase schema (normalized)
- Next.js API routes
- Cron scoring pipeline

---

## 🧠 Architecture (v4)

Crawler → Supabase (raw)
→ Python scoring
→ member_social_scores
→ API → Dashboard

---

## 📦 New folders

```
lib/scoring/
scripts/
supabase/
app/api/scores/
```

---

## ⚙️ Setup

1. Run schema.sql
2. Insert member + social data
3. Run:
```
python scripts/score_members.py
```

---

## 🔥 Key Improvements

- Real engagement modeling
- Momentum detection
- Anti-spam penalty
- Reliability scoring

---

## 📊 New APIs

- /api/scores/leaderboard
- /api/scores/trending
- /api/scores/member/[id]

---

## 🚀 Next Step

- Connect crawler
- Build dashboard UI
- Add AI prediction

