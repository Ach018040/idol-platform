export type CloudFavorite = {
  user_id: string
  entity_name: string
  entity_type: 'group' | 'member'
  related_group?: string | null
}

export type PersonalRecommendation = {
  name: string
  type: 'group' | 'member'
  score: number
  reason: string
}

export function buildCloudRecommendations(
  favorites: CloudFavorite[],
  topGroups: Array<{ name: string; activityScore: number; events90d: number }>,
  topMembers: Array<{ name: string; relatedGroup?: string; activityScore: number; events90d: number }>,
): PersonalRecommendation[] {
  const favoriteNames = favorites.map((item) => item.entity_name)
  const favoriteGroups = favorites
    .map((item) => item.related_group || item.entity_name)
    .filter(Boolean)

  const memberBased = topMembers.map((item) => {
    const hit = favoriteNames.some((name) => item.name.includes(name))
      || favoriteGroups.some((group) => (item.relatedGroup || '').includes(group))

    return {
      name: item.name,
      type: 'member' as const,
      score: item.activityScore + (hit ? 50 : 0),
      reason: hit ? '依你的收藏偏好加權推薦' : '依整體活躍度推薦',
    }
  })

  const groupBased = topGroups.map((item) => {
    const hit = favoriteGroups.some((group) => item.name.includes(group))
    return {
      name: item.name,
      type: 'group' as const,
      score: item.activityScore + (hit ? 50 : 0),
      reason: hit ? '符合你的團體收藏偏好' : '依整體活躍度推薦',
    }
  })

  return [...groupBased, ...memberBased]
    .sort((a, b) => b.score - a.score)
    .slice(0, 20)
}
