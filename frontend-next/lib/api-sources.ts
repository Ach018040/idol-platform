export type ApiSourceCategory = 'Social' | 'Events' | 'News' | 'Open Data' | 'Weather' | 'Finance'

export type ApiSourceStatus = 'candidate' | 'reviewing' | 'approved' | 'blocked' | 'deprecated'

export type ApiRiskLevel = 'low' | 'medium' | 'high'

export type ApiSource = {
  id: string
  name: string
  category: ApiSourceCategory
  description: string
  auth_type: string
  https_supported: boolean
  cors_status: 'Yes' | 'No' | 'Unknown'
  source_url: string
  use_case: string
  platform_fit: string[]
  risk_level: ApiRiskLevel
  status: ApiSourceStatus
  created_at?: string
  updated_at?: string
}

export type ApiSourceWithScore = ApiSource & {
  suitability_score: number
  score_breakdown: {
    relevance: number
    technical_feasibility: number
    cost_accessibility: number
    stability: number
    product_value: number
  }
}

function clampScore(value: number) {
  return Math.max(1, Math.min(5, value))
}

export function calculateApiSuitabilityScore(source: ApiSource): ApiSourceWithScore['score_breakdown'] {
  const highFit = source.platform_fit.length >= 3
  const authEasy = source.auth_type === 'No' || source.auth_type.toLowerCase() === 'none'
  const hasKey = source.auth_type.toLowerCase().includes('apikey')
  const hasOauth = source.auth_type.toLowerCase().includes('oauth')

  const relevance = clampScore(
    source.category === 'Social' || source.category === 'Events' || source.category === 'News' ? 5 : highFit ? 4 : 3
  )
  const technical_feasibility = clampScore(
    (source.https_supported ? 2 : 0)
      + (source.cors_status === 'Yes' ? 2 : source.cors_status === 'Unknown' ? 1 : 0)
      + (authEasy || hasKey ? 1 : 0)
  )
  const cost_accessibility = clampScore(authEasy ? 5 : hasKey ? 4 : hasOauth ? 3 : 2)
  const stability = clampScore(source.risk_level === 'low' ? 5 : source.risk_level === 'medium' ? 4 : 2)
  const product_value = clampScore(
    source.use_case.includes('熱度') || source.use_case.includes('活動') || source.use_case.includes('風險') ? 5 : 4
  )

  return {
    relevance,
    technical_feasibility,
    cost_accessibility,
    stability,
    product_value,
  }
}

export function enrichApiSource(source: ApiSource): ApiSourceWithScore {
  const score_breakdown = calculateApiSuitabilityScore(source)
  const suitability_score = Object.values(score_breakdown).reduce((sum, value) => sum + value, 0)
  return {
    ...source,
    suitability_score,
    score_breakdown,
  }
}
