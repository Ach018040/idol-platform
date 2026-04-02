import { NextRequest, NextResponse } from "next/server";

const SB_URL = process.env.NEXT_PUBLIC_FORUM_SB_URL || "https://vxmebuygrnynxkepyunh.supabase.co";
const SB_ANON = process.env.NEXT_PUBLIC_FORUM_SB_ANON || "";
// idolmaps anon key 作為 fallback（forum threads 寫入需要 auth）
const SB_KEY = SB_ANON || "sb_publishable_PtKb4LIJeJN3cECUJllW7w_UFRVTbTv";

const H_R = { apikey: SB_KEY, Accept: "application/json" };
const H_W = { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, "Content-Type": "application/json", Prefer: "return=representation" };

// GET /api/forum/threads?forum_slug=general&limit=20
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("forum_slug");
  const limit = searchParams.get("limit") || "20";
  const sort = searchParams.get("sort") || "created_at";

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
    const { forum_slug, title, body, tags, author_token } = await req.json();
    if (!forum_slug || !title?.trim() || !body?.trim()) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 驗證用戶
    const authSB = "https://ziiagdrrytyrmzoeegjk.supabase.co";
    const authKey = "sb_publishable_PtKb4LIJeJN3cECUJllW7w_UFRVTbTv";
    let author_id = null;
    let author_name = "匿名用戶";

    if (author_token) {
      try {
        const userRes = await fetch(`${authSB}/auth/v1/user`, {
          headers: { apikey: authKey, Authorization: `Bearer ${author_token}` }
        });
        if (userRes.ok) {
          const userData = await userRes.json();
          author_id = userData.id;
          author_name = userData.user_metadata?.display_name || userData.email?.split("@")[0] || "用戶";
        }
      } catch {}
    }

    // 計算初始 trending score
    const trending_score = 1.0;

    // 插入 thread
    const insertRes = await fetch(`${SB_URL}/rest/v1/threads`, {
      method: "POST",
      headers: H_W,
      body: JSON.stringify({
        forum_slug,
        title: title.trim(),
        body: body.trim(),
        tags: tags || [],
        author_id,
        author_name,
        trending_score,
        likes_count: 0,
        replies_count: 0,
        is_pinned: false,
        is_locked: false,
      }),
    });

    if (!insertRes.ok) {
      const err = await insertRes.text();
      // Supabase forum schema 未建立時的 graceful fallback
      if (insertRes.status === 404 || err.includes("relation") || err.includes("does not exist")) {
        return NextResponse.json({
          thread: { id: "mock", forum_slug, title: title.trim(), body: body.trim(), author_name, created_at: new Date().toISOString() },
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
