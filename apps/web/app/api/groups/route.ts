import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET() {
  const { data, error } = await supabase
    .from('group_metrics_daily')
    .select(`v4_index, group_id, groups(name, slug, region)`)
    .order('v4_index', { ascending: false })
    .limit(10);

  if (error) {
    return NextResponse.json({ ok: false, error });
  }

  return NextResponse.json({ ok: true, data });
}
