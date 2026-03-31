import { NextResponse } from 'next/server'
import { getEvents } from '@/lib/data'

export async function GET() {
  const data = getEvents()
  return NextResponse.json({ ok: true, data, meta: { count: data.length } })
}
