import { NextRequest, NextResponse } from "next/server";

import { runIdolPlatformAgent } from "@/lib/idol-agent";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const question = String(body?.question || "").trim();
    const role = body?.role == null ? null : String(body.role);

    if (!question) {
      return NextResponse.json({ error: "question required" }, { status: 400 });
    }

    const result = await runIdolPlatformAgent({ question, role });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
