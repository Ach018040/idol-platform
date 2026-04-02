import { NextRequest, NextResponse } from "next/server";

// idolmetrics Supabase（論壇資料庫）
const SB_URL = process.env.NEXT_PUBLIC_FORUM_SB_URL || "https://vxmebuygrnynxkepyunh.supabase.co";
const SB_ANON = process.env.NEXT_PUBLIC_FORUM_SB_ANON || "";

// idolmaps Supabase（用戶認證）
const AUTH_URL = "https://ziiagdrrytyrmzoeegjk.supabase.co";
const AUTH_KEY = "sb_publishable_PtKb4LIJeJN3cECUJllW7w_UFRVTbTv";

const H_R = { apikey: SB_ANON, Accept: "application/json" };
const H_W = {
  apikey: SB_ANON,
  Authorization: `Bearer ${SB_ANON}`,
  "Content-Type": "application/json",
  Prefer: "return=representation",
};

// GET /api/forum/threads?forum_slug=general&limit=20
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("forum_slug");
  const limit = searchParams.get("limit") || "20";
  const sort = searchParams.get("sort") || "created_at";

  // forum schema 未建立時回傳空列表
  if (!SB_ANON) return NextResponse.json({ threads: [], note: "forum_anon_key_not_set" });

  try {
    let url = `${SB_URL}/rest/v1/threads?select=*&limit=${limit}&order=${sort}.desc`;
    if (slug) url += `&forum_slug=eq.${slug}`;
    const res = await fetch(url, { headers: H_R, cache: "no-store" });
    if (!res.ok) return NextResponse.json({ threads: [] });
    const threads = await res.json();
    return NextResponse.json({ threads: Array.isArray(threads) ? threads : [] });
  } catch {
    return NextResponse.json({ threads: [] });
  }
}

// POST /api/forum/threads
export async function POST(req: NextRequest) {
  try {
    const { forum_slug, title, body, tags, author_token, author_name: clientName } = await req.json();
    if (!forum_slug || !title?.trim() || !body?.trim()) {
      return NextResponse.json({ error: "缺少必填欄位" }, { status: 400 });
    }

    // 解析作者資訊（guest token 或 Supabase token）
    let author_id: string | null = null;
    let author_name = clientName || "匿名用戶";

    // 嘗試驗證 Supabase token（如果是真實帳號）
    if (author_token && !author_token.startsWith("user_") && !author_token.startsWith("anon_")) {
      try {
        const userRes = await fetch(`${AUTH_URL}/auth/v1/user`, {
          headers: { apikey: AUTH_KEY, Authorization: `Bearer ${author_token}` }
        });
        if (userRes.ok) {
          const userData = await userRes.json();
          author_id = userData.id;
          author_name = userData.user_metadata?.display_name || userData.email?.split("@")[0] || author_name;
        }
      } catch {}
    }

    // forum schema 未建立時 graceful fallback
    if (!SB_ANON) {
      return NextResponse.json({
        thread: {
          id: "pending_" + Date.now(),
          forum_slug, title: title.trim(), body: body.trim(),
          tags: tags || [], author_name, created_at: new Date().toISOString(),
          likes_count: 0, replies_count: 0, trending_score: 1.0,
        },
        note: "forum_schema_pending — execute 001_forum_schema.sql in idolmetrics Supabase"
      }, { status: 201 });
    }

    const insertRes = await fetch(`${SB_URL}/rest/v1/threads`, {
      method: "POST",
      headers: H_W,
      body: JSON.stringify({
        forum_slug, title: title.trim(), body: body.trim(),
        tags: tags || [], author_id, author_name,
        trending_score: 1.0, likes_count: 0, replies_count: 0,
        is_pinned: false, is_locked: false,
      }),
    });

    if (!insertRes.ok) {
      const err = await insertRes.text();
      if (insertRes.status === 404 || err.includes("does not exist")) {
        return NextResponse.json({
          thread: { id: "pending_" + Date.now(), forum_slug, title: title.trim(), author_name, created_at: new Date().toISOString() },
          note: "forum_schema_pending"
        }, { status: 201 });
      }
      return NextResponse.json({ error: err.substring(0, 200) }, { status: insertRes.status });
    }

    const [thread] = await insertRes.json();
    return NextResponse.json({ thread }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
