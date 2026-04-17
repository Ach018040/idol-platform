import { NextRequest, NextResponse } from "next/server";

import { deleteWatchlist, ensureUserProfile, insertWatchlist, listWatchlist } from "@/lib/forum-storage";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") || "";
  if (!token) return NextResponse.json({ items: [], persisted: false }, { status: 400 });
  const items = await listWatchlist(token);
  return NextResponse.json({ items, persisted: true });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const token = String(body?.token || "").trim();
  const displayName = String(body?.displayName || "Agent User").trim();
  const entityId = String(body?.entityId || "").trim();
  const entityKind = body?.entityKind === "group" ? "group" : "member";
  const entityName = String(body?.entityName || "").trim();

  if (!token || !entityId || !entityName) {
    return NextResponse.json({ error: "token, entityId, entityName required" }, { status: 400 });
  }

  await ensureUserProfile(token, displayName);
  const item = await insertWatchlist({
    user_id: token,
    entity_id: entityId,
    entity_kind: entityKind,
    entity_name: entityName,
  });

  return NextResponse.json({ item, persisted: Boolean(item) });
}

export async function DELETE(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") || "";
  const entityId = request.nextUrl.searchParams.get("entityId") || "";
  if (!token || !entityId) {
    return NextResponse.json({ error: "token and entityId required" }, { status: 400 });
  }

  const ok = await deleteWatchlist(token, entityId);
  return NextResponse.json({ ok });
}
