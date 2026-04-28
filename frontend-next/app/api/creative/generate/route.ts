import { NextRequest, NextResponse } from "next/server";
import { mockGenerateCreativeAsset } from "@/lib/creative/generator";
import type { CreativeRunInput } from "@/lib/creative/schemas";

function isValidInput(value: unknown): value is CreativeRunInput {
  const input = value as CreativeRunInput;
  return Boolean(input?.memberName && input?.mode && input?.style && input?.eventTheme);
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const input = body?.input;
  if (!isValidInput(input)) {
    return NextResponse.json({ error: "creative input required" }, { status: 400 });
  }

  const asset = mockGenerateCreativeAsset(input);
  return NextResponse.json({
    asset,
    persisted: false,
    provider: "mock",
    nextProviders: ["Muapi", "Replicate", "Fal", "OpenAI Images", "self-hosted Stable Diffusion"],
  });
}
