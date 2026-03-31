import { NextResponse } from 'next/server'
import { summarizeActivity } from '@/lib/activity'

export async function GET() {
  const data = summarizeActivity()
  return NextResponse.json({ ok: true, data })
}
