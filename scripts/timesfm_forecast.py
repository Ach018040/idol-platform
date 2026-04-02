"""
TimesFM 偶像熱度預測整合腳本 v2
改進：冷啟動保護 + 分層策略（活躍/一般/冷啟動）
"""

import os, math, datetime
import numpy as np
from supabase import create_client

SB_URL = os.environ.get("SUPABASE_URL", "https://ziiagdrrytyrmzoeegjk.supabase.co")
SB_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")
HORIZON = 14
MIN_TIMESFM = 14
MIN_LINEAR  = 3
MAX_CONTEXT = 90
sb = create_client(SB_URL, SB_KEY)


def calc_ti(m, days_since):
    ig=str(m.get("instagram","")).startswith("http")
    fb=str(m.get("facebook","")).startswith("http")
    x =str(m.get("x","")).startswith("http")
    ps={3:40,2:28,1:16,0:0}[int(ig)+int(fb)+int(x)]
    img=(str(m.get("photo_url","")).startswith("http"))*20+(str(m.get("maid_url","")).startswith("http"))*10
    fr=max(0,round(30*math.exp(-days_since/30)))
    sa=min(100,ps+img+fr)
    return round(sa*0.60+ps*0.20+fr*0.20,1)


def build_series(m):
    now=datetime.datetime.utcnow()
    s=m.get("updated_at") or m.get("created_at","")
    try: ua=datetime.datetime.fromisoformat(s.replace("Z","+00:00")).replace(tzinfo=None)
    except: ua=now-datetime.timedelta(days=60)
    series=[]
    for d in range(MAX_CONTEXT,0,-1):
        pt=now-datetime.timedelta(days=d)
        ds=(pt-ua).total_seconds()/86400
        series.append(max(0.0,calc_ti(m,max(0,ds))+float(np.random.normal(0,0.3))))
    return series


def classify(series):
    if len(series)<MIN_LINEAR: return "skip"
    if len(series)<MIN_TIMESFM: return "linear"
    recent_mean=sum(series[-7:])/7
    overall_mean=sum(series)/len(series)
    if recent_mean>overall_mean*0.9 and recent_mean>20: return "active"
    return "normal"


def linear_fc(series):
    n=len(series); x=list(range(n))
    mx=sum(x)/n; my=sum(series)/n
    slope=sum((xi-mx)*(yi-my) for xi,yi in zip(x,series))/max(sum((xi-mx)**2 for xi in x),0.001)
    pts=[max(0,round(series[-1]+slope*(i+1),2)) for i in range(HORIZON)]
    std=max(1.0,float(np.std(series)))
    return pts,[max(0,round(p-1.28*std,2)) for p in pts],[round(p+1.28*std,2) for p in pts]


def timesfm_fc(series):
    import timesfm, torch
    torch.set_float32_matmul_precision("high")
    model=timesfm.TimesFM_2p5_200M_torch.from_pretrained("google/timesfm-2.5-200m-pytorch")
    model.compile(timesfm.ForecastConfig(max_context=1024,max_horizon=HORIZON,normalize_inputs=True,
        use_continuous_quantile_head=True,force_flip_invariance=True,infer_is_positive=True,fix_quantile_crossing=True))
    arr=np.array(series,dtype=np.float32)
    pf,qf=model.forecast(horizon=HORIZON,inputs=[arr])
    return [round(float(x),2) for x in pf[0]],[round(float(x),2) for x in qf[0,:,0]],[round(float(x),2) for x in qf[0,:,-1]]


def main():
    print("=== TimesFM v2 ===")
    members=(sb.table("members").select("id,name,instagram,facebook,x,photo_url,maid_url,updated_at,created_at")
             .order("updated_at",desc=True).limit(200).execute().data or [])
    print(f"成員數: {len(members)}")
    stats=dict(active=0,normal=0,linear=0,skip=0,error=0)
    for m in members:
        try:
            series=build_series(m)
            tier=classify(series)
            if tier=="skip": stats["skip"]+=1; continue
            elif tier in("active","normal"): pts,lo,hi=timesfm_fc(series); stats[tier]+=1; method="timesfm"
            else: pts,lo,hi=linear_fc(series); stats["linear"]+=1; method="linear"
            sb.table("forecasts").insert({"entity_type":"member","entity_id":m["id"],"entity_name":m["name"],
                "horizon_days":HORIZON,"point_forecast":pts,"lower_q10":lo,"upper_q90":hi,
                "context_len":len(series),"model_ver":f"timesfm-2.5-200m ({method})"}).execute()
            print(f"  [{tier}] {m['name']}: {series[-1]:.1f}→{pts[-1]:.1f}")
        except Exception as e: stats["error"]+=1; print(f"  ERR {m.get('name')}: {e}")
    print(f"完成: {stats}")

if __name__=="__main__": main()
