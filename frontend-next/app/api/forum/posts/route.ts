import { NextRequest, NextResponse } from "next/server";

const SB_URL = "https://ziiagdrrytyrmzoeegjk.supabase.co";
const SB_ANON = "sb_publishable_PtKb4LIJeJN3cECUJllW7w_UFRVTbTv";
const SB_SERVICE = process.env.SUPABASE_SERVICE_KEY || SB_ANON;

// GET /api/forum/posts?thread_id=xxx&page=1
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const threadId = searchParams.get("thread_id");
  const page  = parseInt(searchParams.get("page") || "1");
  const limit = 30;
  const offset = (page - 1) * limit;

  if (!threadId) return NextResponse.json({ error: "thread_id required" }, { status: 400 });

  try {
    const res = await fetch(
      `${SB_URL}/rest/v1/posts?thread_id=eq.${threadId}&order=created_at.asc&limit=${limit}&offset=${offset}`,
      { headers: { apikey: SB_ANON, Accept: "application/json", "Accept-Profile": "public" }, next: { revalidate: 30 } }
    );
    if (!res.ok) return NextResponse.json({ posts: [] });
    const posts = await res.json();
    return NextResponse.json({ posts });
  } catch {
    return NextResponse.json({ posts: [] });
  }
}

// POST /api/forum/posts  { thread_id, body, author_token }
export async function POST(req: NextRequest) {
  try {
    const { thread_id, body, author_token } = await req.json();
    if (!thread_id || !body?.trim()) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    // Verify auth
    const userRes = await fetch(`${SB_URL}/auth/v1/user`, {
      headers: { apikey: SB_ANON, Authorization: `Bearer ${author_token}` },
    });
    if (!userRes.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = await userRes.json();

    // Insert post
    const insertRes = await fetch(`${SB_URL}/rest/v1/posts`, {
      method: "POST",
      headers: {
        apikey: SB_SERVICE,
        Authorization: `Bearer ${SB_SERVICE}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
        "Content-Profile": "public",
      },
      body: JSON.stringify({ thread_id, author_id: user.id, body: body.trim(), likes_count: 0 }),
    });

    if (!insertRes.ok) return NextResponse.json({ error: await insertRes.text() }, { status: 500 });
    const [post] = await insertRes.json();

    // Increment thread replies_count
    await fetch(`${SB_URL}/rest/v1/rpc/increment_replies`, {
      method: "POST",
      headers: { apikey: SB_SERVICE, Authorization: `Bearer ${SB_SERVICE}`, "Content-Type": "application/json" },
      body: JSON.stringify({ thread_id }),
    }).catch(() => {});

    return NextResponse.json({ post }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
