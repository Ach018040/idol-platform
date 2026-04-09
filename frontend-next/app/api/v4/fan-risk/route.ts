import { NextResponse } from "next/server";
import { analyzeEmotion } from "@/lib/emotion-core";

export async function POST(req: Request) {
  const body = await req.json();
  const analysis = analyzeEmotion(body);

  return NextResponse.json({
    risk_level: analysis.riskLevel,
    risk_score: analysis.riskScore,
    emotion: analysis.primaryEmotion,
    signals: analysis.signals,
    action: analysis.guidance,
  });
}
