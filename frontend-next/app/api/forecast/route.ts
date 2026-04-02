import { NextRequest, NextResponse } from "next/server";

const SB_URL = "https://ziiagdrrytyrmzoeegjk.supabase.co";
const SB_ANON = "sb_publishable_PtKb4LIJeJN3cECUJllW7w_UFRVTbTv";

// GET /api/forecast?entity_type=member&entity_name=xxx
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const entity_type = searchParams.get("entity_type") || "member";
  const entity_name = searchParams.get("entity_name") || "";

  if (!entity_name) {
    return NextResponse.json({ forecast: null, error: "entity_name required" }, { status: 400 });
  }

  try {
    const url = `${SB_URL}/rest/v1/forecasts?entity_type=eq.${entity_type}&entity_name=eq.${encodeURIComponent(entity_name)}&order=forecast_at.desc&limit=1`;
    const res = await fetch(url, {
      headers: { apikey: SB_ANON, Accept: "application/json" },
      next: { revalidate: 3600 }, // cache 1 hour
    });
    if (!res.ok) return NextResponse.json({ forecast: null });
    const rows = await res.json();
    if (!rows?.length) return NextResponse.json({ forecast: null });
    return NextResponse.json({ forecast: rows[0] });
  } catch {
    return NextResponse.json({ forecast: null });
  }
}
