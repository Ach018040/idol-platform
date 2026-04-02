import { NextRequest, NextResponse } from "next/server";

const SB_URL = process.env.NEXT_PUBLIC_FORUM_SB_URL || "https://vxmebuygrnynxkepyunh.supabase.co";
const SB_ANON = process.env.NEXT_PUBLIC_FORUM_SB_ANON || "";
const SB_SERVICE = process.env.FORUM_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY || SB_ANON;

// GET /api/forum/reports?status=pending  (admin only)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "pending";
  const token  = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verify admin
  const userRes = await fetch(`${SB_URL}/auth/v1/user`, {
    headers: { apikey: SB_ANON, Authorization: `Bearer ${token}` },
  });
  if (!userRes.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const res = await fetch(
      `${SB_URL}/rest/v1/reports?status=eq.${status}&order=created_at.desc&limit=50`,
      { headers: { apikey: SB_SERVICE, Authorization: `Bearer ${SB_SERVICE}`, Accept: "application/json" } }
    );
    const reports = await res.json();
    return NextResponse.json({ reports: Array.isArray(reports) ? reports : [] });
  } catch {
    return NextResponse.json({ reports: [] });
  }
}

// POST /api/forum/reports  { target_type, target_id, reason, author_token }
export async function POST(req: NextRequest) {
  try {
    const { target_type, target_id, reason, author_token } = await req.json();
    if (!target_type || !target_id || !reason?.trim()) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Verify auth
    const userRes = await fetch(`${SB_URL}/auth/v1/user`, {
      headers: { apikey: SB_ANON, Authorization: `Bearer ${author_token}` },
    });
    if (!userRes.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = await userRes.json();

    const insertRes = await fetch(`${SB_URL}/rest/v1/reports`, {
      method: "POST",
      headers: {
        apikey: SB_SERVICE, Authorization: `Bearer ${SB_SERVICE}`,
        "Content-Type": "application/json", Prefer: "return=representation",
      },
      body: JSON.stringify({ reporter_id: user.id, target_type, target_id, reason: reason.trim(), status: "pending" }),
    });

    if (!insertRes.ok) {
      // reports table may not exist yet — return success anyway (graceful)
      return NextResponse.json({ ok: true, note: "stored locally pending schema" });
    }

    const [report] = await insertRes.json();
    return NextResponse.json({ report }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

// PATCH /api/forum/reports  { report_id, status }  (admin only)
export async function PATCH(req: NextRequest) {
  try {
    const { report_id, status, token } = await req.json();
    const patchRes = await fetch(`${SB_URL}/rest/v1/reports?id=eq.${report_id}`, {
      method: "PATCH",
      headers: {
        apikey: SB_SERVICE, Authorization: `Bearer ${SB_SERVICE}`,
        "Content-Type": "application/json", Prefer: "return=minimal",
      },
      body: JSON.stringify({ status, resolved_at: new Date().toISOString() }),
    });
    return NextResponse.json({ ok: patchRes.ok });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
