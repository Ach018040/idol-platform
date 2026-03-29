# Idol Temperature Platform — 部署說明

## 專案結構

```
idol-platform/
├── pipeline/                  ← Python 資料處理
│   ├── seed_data.py           ← 第一次用：生成假資料
│   ├── build_trend_snapshots.py ← 每日快照
│   ├── forecast_v8.py         ← AI 7 日預測
│   ├── build_insights.py      ← 洞察 / Rising Star
│   └── run_pipeline.py        ← 一鍵跑全部
├── public/data/               ← JSON 資料（前端讀這裡）
│   ├── v7_rankings.json
│   ├── member_rankings.json
│   ├── trend_snapshots.json
│   ├── v8_forecast.json
│   └── insights.json
├── frontend-next/             ← Next.js 前端
│   ├── app/page.tsx
│   ├── app/layout.tsx
│   ├── package.json
│   └── next.config.ts
├── .github/workflows/
│   └── pipeline.yml           ← GitHub Actions 每日自動跑
├── vercel.json                ← Vercel 部署設定
└── SETUP.md                   ← 你正在看的這份
```

---

## 第一次部署（約 15 分鐘）

### Step 1：建立 GitHub repo

```bash
git init
git add .
git commit -m "init: idol platform v8.1"

# 在 GitHub 建立新 repo，然後：
git remote add origin https://github.com/你的帳號/idol-platform.git
git push -u origin main
```

### Step 2：生成初始資料

```bash
# 安裝 Python 相依
pip install pandas numpy scikit-learn

# 生成假資料（第一次）
python pipeline/seed_data.py

# 跑完整 pipeline（確認沒有 error）
python pipeline/run_pipeline.py

# commit 資料
git add public/data/
git commit -m "chore: add initial data"
git push
```

### Step 3：部署到 Vercel

1. 去 https://vercel.com → New Project
2. Import 你的 GitHub repo
3. **Root Directory** 設成 `frontend-next`
4. Framework 選 **Next.js**
5. Build Command 留空（Vercel 自動偵測）
6. 點 Deploy

> ✅ 部署完成後你會拿到一個 `.vercel.app` 網址

### Step 4：設定 GitHub Actions 自動更新

GitHub Actions 不需要任何 Secret 就能自動跑（用內建的 `GITHUB_TOKEN`）。

確認 `.github/workflows/pipeline.yml` 已 push 到 repo，
每天台灣時間 04:00 就會自動執行並 push 新資料，
Vercel 偵測到 push 後自動重新部署。

**如需手動觸發：**
GitHub repo → Actions → "Idol Platform — Daily Data Pipeline" → Run workflow

---

## 之後更新真實資料

把你的真實 CSV 轉成以下格式，放到 `public/data/`：

### v7_rankings.json（必要欄位）
```json
[
  {
    "rank": 1,
    "entity_name": "團體名稱",
    "entity_type": "group",
    "member_count": 6,
    "color": "#ff4d8d",
    "social_activity": 100.0,
    "v7_index": 30.0,
    "live_frequency": 90.0,
    "social_reach": 80.0,
    "growth_momentum": 0.5,
    "stability": 0.8,
    "momentum_acceleration": 0.05,
    "conversion_score": 70.0,
    "temperature_index": 30.0
  }
]
```

### member_rankings.json（必要欄位）
```json
[
  {
    "rank": 1,
    "id": "uuid-or-any-string",
    "name": "成員名",
    "nickname": "暱稱",
    "group": "所屬團體",
    "color": "#fefb41",
    "photo_url": "https://...",
    "instagram": "https://www.instagram.com/...",
    "social_activity": 100.0,
    "temperature_index": 30.0,
    "conversion_score": 50.0
  }
]
```

更新完成後執行：
```bash
python pipeline/run_pipeline.py
git add public/data/ && git commit -m "update data" && git push
```

---

## 常見問題

**Q: Vercel build 失敗說找不到 JSON？**
確認 `public/data/` 目錄有 5 個 JSON 檔案並已 commit 到 repo。

**Q: GitHub Actions 說 permission denied？**
確認 repo Settings > Actions > General > Workflow permissions 設成 "Read and write permissions"。

**Q: 要怎麼換成真實資料？**
直接替換 `public/data/` 裡的 JSON，或修改 `pipeline/seed_data.py` 讓它讀你的 CSV。
