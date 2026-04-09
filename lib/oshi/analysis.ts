export function buildOshiAnalysis(score: any) {
  return {
    summary: score.temperature_index > 80 ? "爆紅成長型" : score.temperature_index > 60 ? "穩定熱門" : "潛力成長",
    risk: score.reliability_score < 40 ? "資料不足" : "穩定",
    momentum_state: score.momentum_score > 70 ? "快速上升" : score.momentum_score > 40 ? "緩升" : "平穩",
    engagement_type: score.engagement_score > 70 ? "高互動粉絲群" : "普通互動",
  };
}
