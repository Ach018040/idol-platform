import { NextResponse } from "next/server";
import { analyzeEmotion } from "@/lib/emotion-core";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = analyzeEmotion(body);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }
}
