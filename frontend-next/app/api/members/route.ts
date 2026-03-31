import { NextResponse } from 'next/server'
import { getMembers } from '@/lib/data'

export async function GET() {
  const data = getMembers()
  return NextResponse.json({ ok: true, data, meta: { count: data.length } })
}
