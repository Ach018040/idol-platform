export function recommendMembers(list:any[], watchlist:string[]) {
  return list
    .filter(m => !watchlist.includes(m.member_id))
    .sort((a,b)=> b.temperature_index - a.temperature_index || b.momentum_score - a.momentum_score)
    .slice(0,10);
}
