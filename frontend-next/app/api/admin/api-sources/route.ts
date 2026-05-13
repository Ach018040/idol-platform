import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { ApiSource, enrichApiSource } from '@/lib/api-sources'

function readSeedSources(): ApiSource[] {
  const candidates = [
    path.join(process.cwd(), 'public', 'data', 'api_sources.json'),
    path.join(process.cwd(), '..', 'public', 'data', 'api_sources.json'),
  ]
  for (const filePath of candidates) {
    try {
      if (fs.existsSync(filePath)) {
        return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as ApiSource[]
      }
    } catch {
      return []
    }
  }
  return []
}

async function fetchSupabaseSources(): Promise<ApiSource[] | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) return null

  const url = new URL('/rest/v1/api_sources', supabaseUrl)
  url.searchParams.set('select', '*')
  url.searchParams.set('order', 'category.asc,name.asc')

  const response = await fetch(url.toString(), {
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      Accept: 'application/json',
    },
    cache: 'no-store',
  })

  if (!response.ok) return null
  return (await response.json()) as ApiSource[]
}

export async function GET() {
  const supabaseSources = await fetchSupabaseSources().catch(() => null)
  const sources = supabaseSources && supabaseSources.length ? supabaseSources : readSeedSources()

  return NextResponse.json({
    ok: true,
    source: supabaseSources && supabaseSources.length ? 'supabase' : 'mock',
    data: sources.map(enrichApiSource),
  })
}
