"use client";
import { useEffect, useState } from "react";

type ForecastData = {
  point_forecast: number[];
  lower_q10: number[];
  upper_q90: number[];
  forecast_at: string;
  model_ver: string;
  horizon_days: number;
};

function Sparkline({ pts, lo, hi, color = "cyan" }: {
  pts: number[]; lo: number[]; hi: number[]; color?: string;
}) {
  const allVals = [...pts, ...lo, ...hi].filter(Number.isFinite);
  const min = Math.min(...allVals);
  const max = Math.max(...allVals);
  const range = max - min || 1;
  const W = 280, H = 80, PAD = 4;

  const toX = (i: number) => PAD + (i / (pts.length - 1)) * (W - PAD * 2);
  const toY = (v: number) => H - PAD - ((v - min) / range) * (H - PAD * 2);

  const ptPath = pts.map((v, i) => `${i === 0 ? "M" : "L"}${toX(i).toFixed(1)},${toY(v).toFixed(1)}`).join(" ");
  const areaTop = hi.map((v, i) => `${i === 0 ? "M" : "L"}${toX(i).toFixed(1)},${toY(v).toFixed(1)}`).join(" ");
  const areaBot = lo.map((v, i) => `L${toX(i).toFixed(1)},${toY(v).toFixed(1)}`).reverse().join(" ");
  const areaPath = areaTop + " " + areaBot + " Z";

  const colorMap: Record<string, { stroke: string; fill: string; dot: string }> = {
    cyan: { stroke: "#22d3ee", fill: "rgba(34,211,238,0.12)", dot: "#22d3ee" },
    fuchsia: { stroke: "#e879f9", fill: "rgba(232,121,249,0.12)", dot: "#e879f9" },
    amber: { stroke: "#fbbf24", fill: "rgba(251,191,36,0.12)", dot: "#fbbf24" },
  };
  const c = colorMap[color] || colorMap.cyan;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-20">
      <path d={areaPath} fill={c.fill} />
      <path d={ptPath} stroke={c.stroke} strokeWidth="2" fill="none" strokeLinejoin="round" />
      {pts.map((v, i) => i === pts.length - 1 ? (
        <circle key={i} cx={toX(i)} cy={toY(v)} r="3" fill={c.dot} />
      ) : null)}
    </svg>
  );
}

export default function ForecastChart({ entityName, entityType = "member", color = "cyan" }: {
  entityName: string; entityType?: string; color?: string;
}) {
  const [fc, setFc] = useState<ForecastData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/forecast?entity_type=${entityType}&entity_name=${encodeURIComponent(entityName)}`)
      .then(r => r.json())
      .then(d => { if (d.forecast) setFc(d.forecast); })
      .finally(() => setLoading(false));
  }, [entityName, entityType]);

  if (loading) return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4 animate-pulse">
      <div className="h-4 w-24 bg-white/10 rounded mb-3" />
      <div className="h-20 bg-white/5 rounded" />
    </div>
  );

  if (!fc) return (
    <div className="rounded-2xl border border-white/5 bg-black/10 p-4 text-center text-xs text-zinc-600">
      尚無預測資料（每日 12:30 更新）
    </div>
  );

  const last = fc.point_forecast[fc.point_forecast.length - 1];
  const first = fc.point_forecast[0];
  const trend = last > first + 1 ? "↑ 上升" : last < first - 1 ? "↓ 下降" : "→ 持平";
  const trendColor = last > first + 1 ? "text-emerald-400" : last < first - 1 ? "text-rose-400" : "text-zinc-400";
  const fcDate = new Date(fc.forecast_at).toLocaleDateString("zh-TW", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-white">🔮 未來 {fc.horizon_days} 天預測</span>
          <span className={`text-xs font-bold ${trendColor}`}>{trend}</span>
        </div>
        <div className="text-right">
          <div className="text-xs text-zinc-500">{fc.model_ver}</div>
          <div className="text-xs text-zinc-600">{fcDate} 更新</div>
        </div>
      </div>
      <Sparkline pts={fc.point_forecast} lo={fc.lower_q10} hi={fc.upper_q90} color={color} />
      <div className="flex items-center justify-between text-xs text-zinc-500">
        <span>今日 <span className="text-white font-semibold">{first.toFixed(1)}</span></span>
        <span className="text-zinc-600">信心區間（10-90%）</span>
        <span>第 {fc.horizon_days} 天 <span className="text-white font-semibold">{last.toFixed(1)}</span></span>
      </div>
    </div>
  );
}
