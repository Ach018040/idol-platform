import { NextResponse } from 'next/server'
import { getGroups } from '@/lib/data'

export async function GET() {
  const data = getGroups()
  return NextResponse.json({ ok: true, data, meta: { count: data.length } })
}
