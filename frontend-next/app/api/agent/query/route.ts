import { NextRequest, NextResponse } from "next/server";

import { runIdolAgent } from "@/lib/agent";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const question = String(body?.question || "").trim();

    if (!question) {
      return NextResponse.json({ error: "question required" }, { status: 400 });
    }

    const result = await runIdolAgent(question);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
