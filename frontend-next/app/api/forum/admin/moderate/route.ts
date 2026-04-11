import { NextRequest, NextResponse } from "next/server";

const SB_URL =
  process.env.NEXT_PUBLIC_FORUM_SB_URL || "https://vxmebuygrnynxkepyunh.supabase.co";
const SB_ANON = process.env.NEXT_PUBLIC_FORUM_SB_ANON || "";
const SB_WRITE =
  process.env.FORUM_SERVICE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.NEXT_PUBLIC_FORUM_SB_ANON ||
  "";
const ADMIN_SECRET =
  process.env.FORUM_ADMIN_SECRET ||
  process.env.NEXT_PUBLIC_ADMIN_TOKEN ||
  "idol-admin-2026";

function writeHeaders(prefer = "return=minimal") {
  return {
    apikey: SB_ANON,
    Authorization: `Bearer ${SB_WRITE}`,
    "Content-Type": "application/json",
    Prefer: prefer,
  };
}

export async function POST(request: NextRequest) {
  try {
    const { adminSecret, action, targetId, value } = await request.json();

    if (!adminSecret || adminSecret !== ADMIN_SECRET) {
      return NextResponse.json({ error: "管理員密碼錯誤" }, { status: 403 });
    }

    if (!SB_URL || !SB_ANON || !SB_WRITE) {
      return NextResponse.json({ error: "論壇資料庫設定不完整" }, { status: 500 });
    }

    let res: Response | null = null;

    if (action === "pin") {
      res = await fetch(`${SB_URL}/rest/v1/threads?id=eq.${targetId}`, {
        method: "PATCH",
        headers: writeHeaders(),
        body: JSON.stringify({ is_pinned: Boolean(value) }),
      });
    } else if (action === "lock") {
      res = await fetch(`${SB_URL}/rest/v1/threads?id=eq.${targetId}`, {
        method: "PATCH",
        headers: writeHeaders(),
        body: JSON.stringify({ is_locked: Boolean(value) }),
      });
    } else if (action === "delete_thread") {
      res = await fetch(`${SB_URL}/rest/v1/threads?id=eq.${targetId}`, {
        method: "DELETE",
        headers: writeHeaders(),
      });
    } else if (action === "delete_post") {
      res = await fetch(`${SB_URL}/rest/v1/posts?id=eq.${targetId}`, {
        method: "DELETE",
        headers: writeHeaders(),
      });
    } else {
      return NextResponse.json({ error: "不支援的管理操作" }, { status: 400 });
    }

    if (!res.ok) {
      const errorText = await res.text().catch(() => "");
      return NextResponse.json(
        {
          error: errorText || "管理操作失敗",
          action,
        },
        { status: res.status || 500 },
      );
    }

    return NextResponse.json({ ok: true, action, targetId });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
