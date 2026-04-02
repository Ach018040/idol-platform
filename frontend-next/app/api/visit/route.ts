import { NextRequest, NextResponse } from "next/server";

const SB_URL = "https://ziiagdrrytyrmzoeegjk.supabase.co";
const SB_KEY = "sb_publishable_PtKb4LIJeJN3cECUJllW7w_UFRVTbTv";
const SB_H   = { apikey: SB_KEY, "Content-Type": "application/json", Accept: "application/json", "Accept-Profile": "public", "Content-Profile": "public" };

// GET /api/visit  — 取得目前總造訪次數
export async function GET() {
  try {
    const res = await fetch(`${SB_URL}/rest/v1/site_stats?select=value&key=eq.total_visits`, {
      headers: { ...SB_H }, next: { revalidate: 10 }
    });
    if (!res.ok) return NextResponse.json({ total: 0 });
    const rows = await res.json();
    const total = rows?.[0]?.value ?? 0;
    return NextResponse.json({ total });
  } catch {
    return NextResponse.json({ total: 0 });
  }
}

// POST /api/visit  — 造訪 +1，回傳最新總數
export async function POST(_req: NextRequest) {
  try {
    // Upsert: 若無資料則建立，若有則 +1
    const rpcRes = await fetch(`${SB_URL}/rest/v1/rpc/increment_visit_count`, {
      method: "POST",
      headers: { ...SB_H },
      body: JSON.stringify({}),
    });

    if (!rpcRes.ok) {
      // RPC 不存在時 fallback — 直接嘗試 upsert
      await fetch(`${SB_URL}/rest/v1/site_stats`, {
        method: "POST",
        headers: { ...SB_H, Prefer: "resolution=merge-duplicates" },
        body: JSON.stringify({ key: "total_visits", value: 1 }),
      });
    }

    // 取最新值
    const res = await fetch(`${SB_URL}/rest/v1/site_stats?select=value&key=eq.total_visits`, {
      headers: { ...SB_H }, cache: "no-store"
    });
    const rows = await res.json();
    const total = rows?.[0]?.value ?? 1;
    return NextResponse.json({ total });
  } catch {
    return NextResponse.json({ total: 0 });
  }
}
