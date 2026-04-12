"""
pipeline/run_pipeline.py
主程式：按順序執行全部 Pipeline 步驟
本機測試：  python pipeline/run_pipeline.py
GitHub Actions 也會呼叫這支程式
"""
import subprocess
import sys
from pathlib import Path

PIPELINE = Path(__file__).parent
STEPS = [
    # (描述, 腳本路徑)
    ("📸 Build Trend Snapshots", PIPELINE / "build_trend_snapshots.py"),
    ("🤖 v8 Forecast",           PIPELINE / "forecast_v8.py"),
    ("✨ Build Insights",         PIPELINE / "build_insights.py"),
    ("🧠 Sync Brain Runtime",     PIPELINE / "sync_brain.py"),
]

def run():
    ok = True
    for label, script in STEPS:
        print(f"\n{'─'*50}")
        print(f"  {label}")
        print(f"{'─'*50}")
        result = subprocess.run([sys.executable, str(script)])
        if result.returncode != 0:
            print(f"❌  {label} FAILED (exit {result.returncode})")
            ok = False
        else:
            print(f"✅  {label} done")

    print(f"\n{'═'*50}")
    print("  Pipeline complete" if ok else "  Pipeline had errors — check above")
    print(f"{'═'*50}\n")
    sys.exit(0 if ok else 1)

if __name__ == "__main__":
    run()
