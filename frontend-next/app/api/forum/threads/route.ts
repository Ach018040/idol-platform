import { NextRequest, NextResponse } from "next/server";

const SB_URL = "https://ziiagdrrytyrmzoeegjk.supabase.co";
const SB_ANON = "sb_publishable_PtKb4LIJeJN3cECUJllW7w_UFRVTbTv";
const SB_SERVICE = process.env.SUPABASE_SERVICE_KEY || SB_ANON;

// GET /api/forum/threads?forum_slug=groups&sort=trending&page=1
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slug  = searchParams.get("forum_slug") || "";
  const sort  = searchParams.get("sort") || "trending";
  const page  = parseInt(searchParams.get("page") || "1");
  const limit = 20;
  const offset = (page - 1) * limit;

  try {
    const order = sort === "trending"
      ? "trending_score.desc"
      : "last_reply_at.desc";

    let url = `${SB_URL}/rest/v1/threads?select=*&order=${order}&limit=${limit}&offset=${offset}`;
    if (slug) url += `&forum_slug=eq.${slug}`;

    const res = await fetch(url, {
      headers: { apikey: SB_ANON, Accept: "application/json", "Accept-Profile": "public" },
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      // threads table may not exist yet — return empty
      return NextResponse.json({ threads: [], total: 0 });
    }

    const threads = await res.json();
    return NextResponse.json({ threads, total: threads.length });
  } catch {
    return NextResponse.json({ threads: [], total: 0 });
  }
}

// POST /api/forum/threads  { forum_slug, title, body, tags, author_token }
export async function POST(req: NextRequest) {
  try {
    const { forum_slug, title, body, tags, author_token } = await req.json();

    if (!title?.trim() || !body?.trim() || !forum_slug) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify user token via Supabase Auth
    const userRes = await fetch(`${SB_URL}/auth/v1/user`, {
      headers: {
        apikey: SB_ANON,
        Authorization: `Bearer ${author_token}`,
      },
    });

    if (!userRes.ok) {
      return NextResponse.json({ error: "Unauthorized — please sign in" }, { status: 401 });
    }

    const user = await userRes.json();

    // Insert thread
    const insertRes = await fetch(`${SB_URL}/rest/v1/threads`, {
      method: "POST",
      headers: {
        apikey: SB_SERVICE,
        Authorization: `Bearer ${SB_SERVICE}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
        "Content-Profile": "public",
      },
      body: JSON.stringify({
        forum_slug,
        author_id: user.id,
        title: title.trim(),
        body: body.trim(),
        tags: tags || [],
        likes_count: 0,
        replies_count: 0,
        trending_score: 0,
        last_reply_at: new Date().toISOString(),
      }),
    });

    if (!insertRes.ok) {
      const err = await insertRes.text();
      return NextResponse.json({ error: err }, { status: 500 });
    }

    const [thread] = await insertRes.json();
    return NextResponse.json({ thread }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
