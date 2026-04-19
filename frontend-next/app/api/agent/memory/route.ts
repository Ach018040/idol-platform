import { NextRequest, NextResponse } from "next/server";

import {
  createAgentSession,
  ensureUserProfile,
  getAgentSession,
  insertAgentObservation,
  listAgentObservations,
  updateAgentSession,
} from "@/lib/forum-storage";

function coerceEntityKind(value: unknown): "member" | "group" | null {
  return value === "group" ? "group" : value === "member" ? "member" : null;
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") || "";
  const limit = Number(request.nextUrl.searchParams.get("limit") || "8");

  if (!token) {
    return NextResponse.json({ items: [], latestSessionId: null, persisted: false }, { status: 400 });
  }

  const items = await listAgentObservations(token, limit);
  return NextResponse.json({
    items,
    latestSessionId: items[0]?.session_id || null,
    persisted: true,
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const token = String(body?.token || "").trim();
  const displayName = String(body?.displayName || "Agent User").trim();
  const roleId = String(body?.roleId || "").trim();
  const question = String(body?.question || "").trim();
  const answer = String(body?.answer || "").trim();
  const summary = String(body?.summary || "").trim();
  const intent = String(body?.intent || "").trim() || null;
  const provider = String(body?.provider || "").trim() || null;
  const mode = String(body?.mode || "").trim() || null;
  const entityId = String(body?.entityId || "").trim() || null;
  const entityKind = coerceEntityKind(body?.entityKind);
  const entityName = String(body?.entityName || "").trim() || null;
  const evidence = Array.isArray(body?.evidence) ? body.evidence : [];
  const traces = Array.isArray(body?.traces) ? body.traces : [];
  const suggestedQuestions = Array.isArray(body?.suggestedQuestions) ? body.suggestedQuestions : [];
  const requestedSessionId = String(body?.sessionId || "").trim();

  if (!token || !roleId || !question || !answer) {
    return NextResponse.json(
      { error: "token, roleId, question and answer required" },
      { status: 400 },
    );
  }

  await ensureUserProfile(token, displayName);

  let session = requestedSessionId ? await getAgentSession(token, requestedSessionId) : null;
  if (!session) {
    session = await createAgentSession({
      user_id: token,
      role_id: roleId,
      last_question: question,
      last_intent: intent,
      summary: summary || null,
      entity_id: entityId,
      entity_kind: entityKind,
      entity_name: entityName,
    });
  } else {
    session = await updateAgentSession(session.id, token, {
      role_id: roleId,
      last_question: question,
      last_intent: intent,
      summary: summary || null,
      entity_id: entityId,
      entity_kind: entityKind,
      entity_name: entityName,
    });
  }

  const item = await insertAgentObservation({
    session_id: session?.id || null,
    user_id: token,
    role_id: roleId,
    question,
    answer,
    summary: summary || null,
    intent,
    provider,
    mode,
    entity_id: entityId,
    entity_kind: entityKind,
    entity_name: entityName,
    evidence,
    traces,
    suggested_questions: suggestedQuestions,
  });

  return NextResponse.json({
    item,
    sessionId: session?.id || null,
    persisted: Boolean(item),
  });
}
