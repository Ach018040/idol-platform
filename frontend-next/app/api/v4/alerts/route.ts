import { NextRequest, NextResponse } from "next/server";

import { deleteAlertRule, ensureUserProfile, insertAlertRule, listAlertRules } from "@/lib/forum-storage";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") || "";
  if (!token) return NextResponse.json({ items: [], persisted: false }, { status: 400 });
  const items = await listAlertRules(token);
  return NextResponse.json({ items, persisted: true });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const token = String(body?.token || "").trim();
  const displayName = String(body?.displayName || "Agent User").trim();
  const entityId = String(body?.entityId || "").trim();
  const entityKind = body?.entityKind === "group" ? "group" : "member";
  const entityName = String(body?.entityName || "").trim();
  const ruleType = String(body?.ruleType || "").trim();
  const threshold =
    body?.threshold == null || body?.threshold === "" ? null : Number(body.threshold);

  if (!token || !entityId || !entityName || !ruleType) {
    return NextResponse.json({ error: "token, entityId, entityName, ruleType required" }, { status: 400 });
  }

  await ensureUserProfile(token, displayName);
  const item = await insertAlertRule({
    user_id: token,
    entity_id: entityId,
    entity_kind: entityKind,
    entity_name: entityName,
    rule_type: ruleType,
    threshold: Number.isFinite(threshold as number) ? threshold : null,
  });

  return NextResponse.json({ item, persisted: Boolean(item) });
}

export async function DELETE(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") || "";
  const id = request.nextUrl.searchParams.get("id") || "";
  if (!token || !id) {
    return NextResponse.json({ error: "token and id required" }, { status: 400 });
  }

  const ok = await deleteAlertRule(token, id);
  return NextResponse.json({ ok });
}
