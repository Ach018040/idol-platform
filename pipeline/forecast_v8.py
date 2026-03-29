"""
forecast_v8.py
==============
讀取 trend_snapshots.json，對每個團體用線性回歸
預測未來 7 天的 v7_index，輸出 v8_forecast.json。

需要：pip install scikit-learn numpy
需要：trend_snapshots.json 有 ≥ 7 天資料（至少 7 筆 / 每個團體）

用法：
    python pipeline/forecast_v8.py
"""

import json
import os
from datetime import date

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "public", "data")

# 最少需要幾天才啟動預測（規格要求 7 天；正式版建議 10 天以上）
MIN_DAYS = 7


def forecast_group_7d(
    trend_file: str = None,
    out_file: str = None,
):
    trend_file = trend_file or os.path.join(DATA_DIR, "trend_snapshots.json")
    out_file = out_file or os.path.join(DATA_DIR, "v8_forecast.json")

    try:
        import numpy as np
        from sklearn.linear_model import LinearRegression
    except ImportError:
        print("⚠️  需要安裝：pip install scikit-learn numpy")
        return

    with open(trend_file, encoding="utf-8") as f:
        snaps = json.load(f)

    # 按團體分組
    groups: dict[str, list] = {}
    for s in snaps:
        name = s.get("entity_name", "")
        if name not in groups:
            groups[name] = []
        groups[name].append(s)

    results = []

    for name, records in groups.items():
        records = sorted(records, key=lambda x: x.get("date", ""))

        if len(records) < MIN_DAYS:
            # 資料不足：仍輸出，但 direction=flat, confidence=0
            last = records[-1]["v7_index"] if records else 0
            results.append({
                "entity_name": name,
                "last_index": round(last, 2),
                "forecast_7d": [round(last, 2)] * 7,
                "direction": "flat",
                "confidence": 0.0,
                "data_days": len(records),
                "note": f"資料不足（{len(records)} 天），需要 ≥{MIN_DAYS} 天",
            })
            continue

        y = [r["v7_index"] for r in records]
        X = np.arange(len(y)).reshape(-1, 1)
        y_arr = np.array(y)

        model = LinearRegression().fit(X, y_arr)

        future_X = np.arange(len(y), len(y) + 7).reshape(-1, 1)
        y_pred = model.predict(future_X)

        last = y_arr[-1]

        # 方向判斷（±5% 門檻）
        if y_pred[-1] > last * 1.05:
            direction = "up"
        elif y_pred[-1] < last * 0.95:
            direction = "down"
        else:
            direction = "flat"

        # 信心分數：用係數絕對值 / 標準差（越穩定越高）
        std = float(np.std(y_arr))
        coef = float(model.coef_[0])
        confidence = round(abs(coef) / (std + 1e-6), 3)
        confidence = min(confidence, 1.0)  # 上限 1.0

        results.append({
            "entity_name": name,
            "last_index": round(float(last), 2),
            "forecast_7d": [round(float(v), 2) for v in y_pred],
            "direction": direction,
            "confidence": confidence,
            "data_days": len(records),
        })

    # 依預測值排序（最高在前）
    results.sort(key=lambda x: x["forecast_7d"][-1], reverse=True)

    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    up_count = sum(1 for r in results if r["direction"] == "up")
    down_count = sum(1 for r in results if r["direction"] == "down")
    print(f"🚀 v8_forecast.json updated — {len(results)} groups (↑{up_count} ↓{down_count} →{len(results)-up_count-down_count})")


if __name__ == "__main__":
    forecast_group_7d()
