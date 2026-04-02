import { NextRequest, NextResponse } from "next/server";

const SB_URL = "https://ziiagdrrytyrmzoeegjk.supabase.co";
const SB_ANON = "sb_publishable_PtKb4LIJeJN3cECUJllW7w_UFRVTbTv";
// service key 用於寫入（如未設定則 fallback 到 anon）
const SB_SERVICE = process.env.SUPABASE_SERVICE_KEY || SB_ANON;

const HEADERS_R = { apikey: SB_ANON, Accept: "application/json", "Accept-Profile": "public" };
const HEADERS_W = {
  apikey: SB_SERVICE,
  Authorization: `Bearer ${SB_SERVICE}`,
  "Content-Type": "application/json",
  Accept: "application/json",
  "Content-Profile": "public",
  Prefer: "resolution=merge-duplicates",
};

// GET /api/visit — 取得目前總造訪次數
export async function GET() {
  try {
    const res = await fetch(
      `${SB_URL}/rest/v1/site_stats?select=value&key=eq.total_visits`,
      { headers: HEADERS_R, next: { revalidate: 30 } }
    );
    if (!res.ok) return NextResponse.json({ total: 0 });
    const rows = await res.json();
    return NextResponse.json({ total: rows?.[0]?.value ?? 0 });
  } catch {
    return NextResponse.json({ total: 0 });
  }
}

// POST /api/visit — 造訪 +1
export async function POST(_req: NextRequest) {
  try {
    // 嘗試 RPC increment
    const rpcRes = await fetch(`${SB_URL}/rest/v1/rpc/increment_visit_count`, {
      method: "POST",
      headers: HEADERS_W,
      body: JSON.stringify({}),
    });

    if (rpcRes.ok) {
      const val = await rpcRes.json();
      return NextResponse.json({ total: val ?? 1 });
    }

    // RPC 不存在時：直接 upsert（服務未就緒時 graceful）
    const upsertRes = await fetch(`${SB_URL}/rest/v1/site_stats`, {
      method: "POST",
      headers: HEADERS_W,
      body: JSON.stringify({ key: "total_visits", value: 1 }),
    });

    if (upsertRes.status === 404) {
      // 表不存在 — 靜默失敗，不影響前端
      return NextResponse.json({ total: 0, note: "table not yet created" });
    }

    // 取最新值
    const getRes = await fetch(
      `${SB_URL}/rest/v1/site_stats?select=value&key=eq.total_visits`,
      { headers: HEADERS_R, cache: "no-store" }
    );
    const rows = await getRes.json();
    return NextResponse.json({ total: rows?.[0]?.value ?? 1 });
  } catch {
    return NextResponse.json({ total: 0 });
  }
}
