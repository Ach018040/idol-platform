# Idol Temperature Platform v8.1

地下偶像市場即時監測平台。從零開始，今天就能部署。

---

## 專案結構

```
idol-platform/
├── pipeline/                    # Python 資料處理
│   ├── seed_data.py             # ① 第一次初始化資料（只跑一次）
│   ├── build_trend_snapshots.py # ② 每日快照（每天自動執行）
│   ├── forecast_v8.py           # ③ 7 日預測（每天自動執行）
│   ├── build_insights.py        # ④ 洞察 + 週報（每天自動執行）
│   └── run_pipeline.py          # 統一入口（GitHub Actions 呼叫這支）
│
├── public/data/                 # JSON 資料（Vercel 靜態檔案）
│   ├── v7_rankings.json         # 團體排行
│   ├── trend_snapshots.json     # 每日歷史快照
│   ├── v8_forecast.json         # 7 日預測
│   └── weekly_report.json       # 本週市場報告
│
├── frontend-next/               # Next.js 15 前端
│   ├── app/
│   │   ├── layout.tsx
│   │   └── page.tsx             # 首頁（讀取 JSON）
│   ├── package.json
│   └── next.config.ts
│
├── .github/workflows/
│   └── pipeline.yml             # GitHub Actions 每日自動執行
│
├── vercel.json                  # Vercel 部署設定
├── requirements.txt             # Python 相依套件
└── README.md
```

---

## 快速開始（從零到部署）

### 步驟 1：初始化本機資料

```bash
# 安裝 Python 相依套件
pip install -r requirements.txt

# 產生初始資料（第一次只跑這個）
python pipeline/seed_data.py
```

完成後 `public/data/` 會出現四個 JSON 檔。

---

### 步驟 2：本機啟動前端

```bash
cd frontend-next
npm install
npm run dev
```

瀏覽 `http://localhost:3000`，看到排行榜即成功。

---

### 步驟 3：推上 GitHub

```bash
git init
git add .
git commit -m "init: idol platform v8.1"

# 建立一個新的 GitHub repo，然後：
git remote add origin https://github.com/你的帳號/idol-platform.git
git push -u origin main
```

---

### 步驟 4：連結 Vercel（免費）

1. 前往 [vercel.com](https://vercel.com)，用 GitHub 帳號登入
2. 點「Add New Project」→ 選你剛推上去的 repo
3. Framework 選 **Next.js**
4. Root Directory 填 `frontend-next`
5. 點「Deploy」

Vercel 會自動：
- 建置 Next.js
- 把 `public/data/*.json` 當靜態檔案提供
- 每次你 push 就自動重新部署

部署完成會給你一個 `https://你的專案.vercel.app` 網址。

---

### 步驟 5：設定 GitHub Actions 自動執行

GitHub Actions 每天台灣時間 04:00 會自動：
1. 執行 Python pipeline（snapshots → forecast → insights）
2. Commit 更新後的 JSON 回 repo
3. Vercel 偵測到 push，自動重新部署

**不需要額外設定 Secret**，預設的 `GITHUB_TOKEN` 就夠用了。

如果你要強制觸發 Vercel 重新部署（可選）：
1. 到 Vercel 帳號 → Settings → Tokens → 建立一個 token
2. 到 GitHub repo → Settings → Secrets → 新增 `VERCEL_TOKEN`

---

### 步驟 6：之後每天手動測試（可選）

```bash
# 本機跑一次完整 pipeline
python pipeline/run_pipeline.py

# 或在 GitHub 頁面：Actions → Daily Pipeline → Run workflow
```

---

## 接入真實資料

目前 `seed_data.py` 使用假資料。當你有真實 CSV 時：

### 方法 A：修改 seed_data.py

把 `GROUPS_SEED` 替換成從 CSV 讀取：

```python
import pandas as pd

df = pd.read_csv("你的資料.csv")
GROUPS_SEED = df.to_dict(orient="records")
```

### 方法 B：直接寫入 v7_rankings.json

確保欄位名稱正確：

```json
[
  {
    "entity_name": "團體名稱",
    "member_count": 6,
    "live_frequency": 92.0,
    "social_reach": 100.0,
    "growth_momentum": 0.14,
    "stability": 0.88,
    "momentum_acceleration": 0.05,
    "v7_index": 58.4
  }
]
```

接入後，重新執行 `python pipeline/run_pipeline.py` 即可。

---

## v7 指數公式

```
v7_public =
  0.30 × live_frequency
+ 0.25 × social_reach
+ 0.20 × growth_momentum × 100
+ 0.15 × stability × 100
+ 0.10 × momentum_acceleration × 100
```

---

## 商業化路線

| 層級 | 內容 | 收費 |
|------|------|------|
| Free | Top 10、本週戰神、Rising Star 部分 | 免費 |
| Pro | 深度分析、7 日預測、週報 | NT$1,499/月 |
| Enterprise | API 授權、客製報告、選角建議 | NT$8,000+/月 |

---

## 常見問題

**Q：Vercel 免費方案夠用嗎？**  
A：夠，靜態 Next.js + JSON 資料完全在免費額度內。

**Q：GitHub Actions 免費嗎？**  
A：公開 repo 免費，私有 repo 每月 2,000 分鐘免費額度。每天 pipeline 約 2-3 分鐘，綽綽有餘。

**Q：v8 預測何時啟動？**  
A：`forecast_v8.py` 需要至少 7 天歷史資料才會產生預測（`MIN_DAYS = 7`）。seed_data.py 已預填 7 天假歷史，所以第一天就能看到預測。

**Q：如何修改排程時間？**  
A：編輯 `.github/workflows/pipeline.yml` 裡的 `cron: "0 20 * * *"`（UTC 時間）。
