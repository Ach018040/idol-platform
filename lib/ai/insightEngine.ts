// v7 AI Insight Engine
export function generateInsight(member:any){
  const growth = member.trend_score || 0;
  const activity = member.social_activity || 0;

  let stage = "stable";
  if(growth > 80) stage = "exploding";
  else if(growth > 50) stage = "rising";
  else if(growth < 20) stage = "declining";

  return {
    stage,
    summary: `This idol is currently ${stage} with activity score ${activity}`,
    recommendation: stage === 'exploding' ? 'High priority booking' : 'Monitor growth'
  };
}
