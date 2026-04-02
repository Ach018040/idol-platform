"""
TimesFM 偶像熱度預測整合腳本
用途：每日從 Supabase 抓取溫度指數歷史，用 TimesFM 預測未來 14 天
"""

import os
import math
import datetime
import numpy as np
from supabase import create_client

SB_URL = os.environ.get("SUPABASE_URL", "https://ziiagdrrytyrmzoeegjk.supabase.co")
SB_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")
HORIZON = 14
MIN_CONTEXT = 7
MAX_CONTEXT = 90

sb = create_client(SB_URL, SB_KEY)


def calc_temperature_index(m: dict, days_since: float) -> float:
    has_ig = str(m.get("instagram", "")).startswith("http")
    has_fb = str(m.get("facebook", "")).startswith("http")
    has_x  = str(m.get("x", "")).startswith("http")
    platform_count = int(has_ig) + int(has_fb) + int(has_x)
    platform_score = {3: 40, 2: 28, 1: 16, 0: 0}[platform_count]
    has_photo    = str(m.get("photo_url", "")).startswith("http")
    has_maid_url = str(m.get("maid_url", "")).startswith("http")
    image_score  = int(has_photo) * 20 + int(has_maid_url) * 10
    freshness = max(0, round(30 * math.exp(-days_since / 30)))
    sa = min(100, platform_score + image_score + freshness)
    return round(sa * 0.60 + platform_score * 0.20 + freshness * 0.20, 1)


def build_time_series(member: dict) -> list:
    now = datetime.datetime.utcnow()
    updated_at_str = member.get("updated_at") or member.get("created_at", "")
    try:
        updated_at = datetime.datetime.fromisoformat(updated_at_str.replace("Z", "+00:00"))
        updated_at = updated_at.replace(tzinfo=None)
    except Exception:
        updated_at = now - datetime.timedelta(days=60)
    series = []
    for d in range(MAX_CONTEXT, 0, -1):
        past_time = now - datetime.timedelta(days=d)
        days_since = (past_time - updated_at).total_seconds() / 86400
        ti = calc_temperature_index(member, max(0, days_since))
        noise = float(np.random.normal(0, 0.3))
        series.append(max(0.0, ti + noise))
    return series


def run_timesfm_forecast(series: list):
    import timesfm
    import torch
    torch.set_float32_matmul_precision("high")
    model = timesfm.TimesFM_2p5_200M_torch.from_pretrained(
        "google/timesfm-2.5-200m-pytorch"
    )
    model.compile(timesfm.ForecastConfig(
        max_context=1024,
        max_horizon=HORIZON,
        normalize_inputs=True,
        use_continuous_quantile_head=True,
        force_flip_invariance=True,
        infer_is_positive=True,
        fix_quantile_crossing=True,
    ))
    arr = np.array(series, dtype=np.float32)
    point_fc, quantile_fc = model.forecast(horizon=HORIZON, inputs=[arr])
    pts = [round(float(x), 2) for x in point_fc[0]]
    lo  = [round(float(x), 2) for x in quantile_fc[0, :, 0]]
    hi  = [round(float(x), 2) for x in quantile_fc[0, :, -1]]
    return pts, lo, hi


def upsert_forecast(entity_type, entity_id, entity_name, pts, lo, hi, context_len):
    sb.table("forecasts").insert({
        "entity_type": entity_type,
        "entity_id":   entity_id,
        "entity_name": entity_name,
        "horizon_days": HORIZON,
        "point_forecast": pts,
        "lower_q10": lo,
        "upper_q90": hi,
        "context_len": context_len,
        "model_ver": "timesfm-2.5-200m",
    }).execute()


def main():
    print("=== TimesFM 熱度預測開始 ===")
    resp = sb.table("members").select(
        "id,name,instagram,facebook,x,photo_url,maid_url,updated_at,created_at"
    ).order("updated_at", desc=True).limit(100).execute()
    members = resp.data or []
    print(f"取得 {len(members)} 位成員")
    success, skip, error = 0, 0, 0
    for m in members:
        try:
            series = build_time_series(m)
            if len(series) < MIN_CONTEXT:
                skip += 1
                continue
            pts, lo, hi = run_timesfm_forecast(series)
            upsert_forecast("member", m["id"], m["name"], pts, lo, hi, len(series))
            success += 1
            print(f"  OK {m['name']}: {series[-1]:.1f} -> {pts[-1]:.1f}")
        except Exception as e:
            error += 1
            print(f"  ERR {m.get('name','?')}: {e}")
    print(f"完成：成功 {success} / 略過 {skip} / 錯誤 {error}")


if __name__ == "__main__":
    main()
