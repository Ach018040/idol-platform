import { NextRequest, NextResponse } from "next/server";

const SB_URL = process.env.NEXT_PUBLIC_FORUM_SB_URL || "https://vxmebuygrnynxkepyunh.supabase.co";
const SB_ANON = process.env.NEXT_PUBLIC_FORUM_SB_ANON || "";
const H_R = { apikey: SB_ANON, Accept: "application/json" };
const H_W = {
  apikey: SB_ANON,
  Authorization: `Bearer ${SB_ANON}`,
  "Content-Type": "application/json",
  Prefer: "return=representation",
};

// GET /api/forum/replies?thread_id=xxx&limit=50
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const thread_id = searchParams.get("thread_id");
  const limit = searchParams.get("limit") || "50";
  if (!thread_id) return NextResponse.json({ posts: [] });
  if (!SB_ANON) return NextResponse.json({ posts: [] });
  try {
    const res = await fetch(
      `${SB_URL}/rest/v1/posts?select=*&thread_id=eq.${thread_id}&order=created_at.asc&limit=${limit}`,
      { headers: H_R, cache: "no-store" }
    );
    if (!res.ok) return NextResponse.json({ posts: [] });
    const posts = await res.json();
    return NextResponse.json({ posts: Array.isArray(posts) ? posts : [] });
  } catch {
    return NextResponse.json({ posts: [] });
  }
}

// POST /api/forum/replies
export async function POST(req: NextRequest) {
  try {
    const { thread_id, body, author_token, author_name: clientName } = await req.json();
    if (!thread_id || !body?.trim()) {
      return NextResponse.json({ error: "缺少必填欄位" }, { status: 400 });
    }
    if (!SB_ANON) {
      return NextResponse.json({ error: "forum_anon_key_not_set" }, { status: 500 });
    }
    const author_name = clientName || "匿名用戶";
    // 插入回覆
    const insertRes = await fetch(`${SB_URL}/rest/v1/posts`, {
      method: "POST",
      headers: H_W,
      body: JSON.stringify({
        thread_id,
        body: body.trim(),
        author_name,
        likes_count: 0,
        edited: false,
      }),
    });
    if (!insertRes.ok) {
      const err = await insertRes.text();
      return NextResponse.json({ error: err.substring(0, 200) }, { status: insertRes.status });
    }
    const [post] = await insertRes.json();
    // 更新討論串的 replies_count 和 last_reply_at
    await fetch(
      `${SB_URL}/rest/v1/threads?id=eq.${thread_id}`,
      {
        method: "PATCH",
        headers: { ...H_W, Prefer: "return=minimal" },
        body: JSON.stringify({
          replies_count: undefined, // 用 RPC 計算更準確，先略過
          last_reply_at: new Date().toISOString(),
        }),
      }
    );
    return NextResponse.json({ post }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
