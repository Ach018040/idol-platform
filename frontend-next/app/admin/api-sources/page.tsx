'use client'

import { useEffect, useMemo, useState } from 'react'
import { ApiSourceCategory, ApiSourceStatus, ApiSourceWithScore } from '@/lib/api-sources'

const categories: Array<'All' | ApiSourceCategory> = ['All', 'Social', 'Events', 'News', 'Open Data', 'Weather', 'Finance']
const statuses: Array<'All' | ApiSourceStatus> = ['All', 'candidate', 'reviewing', 'approved', 'blocked', 'deprecated']

function scoreColor(score: number) {
  if (score >= 22) return 'from-emerald-400 to-cyan-300'
  if (score >= 18) return 'from-amber-300 to-orange-400'
  return 'from-rose-400 to-red-500'
}

function riskClass(risk: string) {
  if (risk === 'low') return 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200'
  if (risk === 'medium') return 'border-amber-400/30 bg-amber-400/10 text-amber-200'
  return 'border-rose-400/30 bg-rose-400/10 text-rose-200'
}

function statusClass(status: string) {
  if (status === 'approved') return 'border-cyan-400/30 bg-cyan-400/10 text-cyan-200'
  if (status === 'blocked' || status === 'deprecated') return 'border-rose-400/30 bg-rose-400/10 text-rose-200'
  if (status === 'reviewing') return 'border-violet-400/30 bg-violet-400/10 text-violet-200'
  return 'border-white/15 bg-white/10 text-zinc-200'
}

export default function ApiSourcesAdminPage() {
  const [sources, setSources] = useState<ApiSourceWithScore[]>([])
  const [dataSource, setDataSource] = useState('mock')
  const [category, setCategory] = useState<'All' | ApiSourceCategory>('All')
  const [status, setStatus] = useState<'All' | ApiSourceStatus>('All')
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadSources() {
      setLoading(true)
      try {
        const response = await fetch('/api/admin/api-sources', { cache: 'no-store' })
        if (!response.ok) throw new Error(`Request failed: ${response.status}`)
        const payload = (await response.json()) as { data?: ApiSourceWithScore[]; source?: string }
        setSources(payload.data ?? [])
        setDataSource(payload.source ?? 'mock')
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }
    loadSources()
  }, [])

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    return sources.filter((source) => {
      const categoryMatch = category === 'All' || source.category === category
      const statusMatch = status === 'All' || source.status === status
      const keywordMatch =
        !keyword ||
        [source.name, source.description, source.use_case, source.category, source.auth_type]
          .join(' ')
          .toLowerCase()
          .includes(keyword) ||
        source.platform_fit.some((fit) => fit.toLowerCase().includes(keyword))
      return categoryMatch && statusMatch && keywordMatch
    })
  }, [category, query, sources, status])

  const averageScore = filtered.length
    ? filtered.reduce((sum, source) => sum + source.suitability_score, 0) / filtered.length
    : 0
  const approvedCount = filtered.filter((source) => source.status === 'approved').length
  const lowRiskCount = filtered.filter((source) => source.risk_level === 'low').length

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.20),_transparent_32%),linear-gradient(180deg,_#070b14_0%,_#101827_100%)] px-4 py-8 text-white md:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="mb-3 inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-200">
                Admin / API Source Catalog
              </p>
              <h1 className="text-3xl font-black tracking-tight md:text-5xl">外部 API 資料源管理模組</h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-300">
                管理未來可串接的社群、活動、新聞、天氣、開放資料與金融 API，先用 suitability score 排出導入優先順序。
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-zinc-300">
              Data source: <span className="font-bold text-cyan-200">{dataSource}</span>
            </div>
          </div>

          <section className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-zinc-400">候選 API</div>
              <div className="mt-2 text-3xl font-black text-white">{filtered.length}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-zinc-400">平均適配分</div>
              <div className="mt-2 text-3xl font-black text-cyan-300">{averageScore.toFixed(1)} / 25</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-zinc-400">低風險 / 已核准</div>
              <div className="mt-2 text-3xl font-black text-emerald-300">
                {lowRiskCount} / {approvedCount}
              </div>
            </div>
          </section>
        </header>

        <section className="mb-6 rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
          <div className="grid gap-3 lg:grid-cols-[1fr_180px_180px]">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜尋名稱、用途、fit tag..."
              className="min-h-11 rounded-2xl border border-white/10 bg-black/30 px-4 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-cyan-300/50"
            />
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value as 'All' | ApiSourceCategory)}
              className="min-h-11 rounded-2xl border border-white/10 bg-black/30 px-4 text-sm text-white outline-none focus:border-cyan-300/50"
            >
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item === 'All' ? '全部分類' : item}
                </option>
              ))}
            </select>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as 'All' | ApiSourceStatus)}
              className="min-h-11 rounded-2xl border border-white/10 bg-black/30 px-4 text-sm text-white outline-none focus:border-cyan-300/50"
            >
              {statuses.map((item) => (
                <option key={item} value={item}>
                  {item === 'All' ? '全部狀態' : item}
                </option>
              ))}
            </select>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
          {loading ? (
            <div className="flex min-h-64 items-center justify-center text-zinc-300">API sources loading...</div>
          ) : error ? (
            <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 p-5 text-rose-100">
              API sources 載入失敗：{error}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1080px] border-separate border-spacing-y-3">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-[0.16em] text-zinc-500">
                    <th className="px-3">API</th>
                    <th className="px-3">Category</th>
                    <th className="px-3">Auth / CORS</th>
                    <th className="px-3">Suitability</th>
                    <th className="px-3">Risk</th>
                    <th className="px-3">Platform Fit</th>
                    <th className="px-3">Status</th>
                    <th className="px-3">Source</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((source) => (
                    <tr key={source.id} className="rounded-2xl bg-black/20 text-sm">
                      <td className="max-w-[280px] rounded-l-2xl border-y border-l border-white/10 px-3 py-4">
                        <div className="font-bold text-white">{source.name}</div>
                        <div className="mt-1 line-clamp-2 text-xs leading-5 text-zinc-400">{source.description}</div>
                        <div className="mt-2 text-xs text-cyan-100/80">{source.use_case}</div>
                      </td>
                      <td className="border-y border-white/10 px-3 py-4 text-zinc-200">{source.category}</td>
                      <td className="border-y border-white/10 px-3 py-4">
                        <div className="text-zinc-200">{source.auth_type}</div>
                        <div className="mt-1 text-xs text-zinc-500">
                          HTTPS {source.https_supported ? 'Yes' : 'No'} / CORS {source.cors_status}
                        </div>
                      </td>
                      <td className="border-y border-white/10 px-3 py-4">
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <span className="font-black text-white">{source.suitability_score}</span>
                          <span className="text-xs text-zinc-500">/ 25</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-white/10">
                          <div
                            className={`h-full rounded-full bg-gradient-to-r ${scoreColor(source.suitability_score)}`}
                            style={{ width: `${(source.suitability_score / 25) * 100}%` }}
                          />
                        </div>
                      </td>
                      <td className="border-y border-white/10 px-3 py-4">
                        <span className={`rounded-full border px-3 py-1 text-xs ${riskClass(source.risk_level)}`}>
                          {source.risk_level}
                        </span>
                      </td>
                      <td className="max-w-[240px] border-y border-white/10 px-3 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {source.platform_fit.map((fit) => (
                            <span key={fit} className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2 py-1 text-[11px] text-cyan-100">
                              {fit}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="border-y border-white/10 px-3 py-4">
                        <span className={`rounded-full border px-3 py-1 text-xs ${statusClass(source.status)}`}>
                          {source.status}
                        </span>
                      </td>
                      <td className="rounded-r-2xl border-y border-r border-white/10 px-3 py-4">
                        <a
                          href={source.source_url}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-xs font-bold text-cyan-200 hover:border-cyan-300/40"
                        >
                          Open
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!filtered.length ? (
                <div className="py-12 text-center text-sm text-zinc-400">沒有符合條件的 API source。</div>
              ) : null}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
