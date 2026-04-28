import { NextRequest, NextResponse } from "next/server";

import { composeDesignStudioPrompt, renderDesignArtifact } from "@/lib/design/prompts";
import type { DesignProjectInput } from "@/lib/design/schemas";
import {
  createDesignArtifact,
  createDesignGeneration,
  createDesignProject,
  finishDesignGeneration,
  finishDesignProject,
} from "@/lib/design/storage";

function coerceProjectInput(body: unknown): DesignProjectInput | null {
  const input = (body as { project?: DesignProjectInput })?.project;
  if (!input?.title || !input.templateId || !input.skillId || !input.designSystemId) return null;
  return input;
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const input = coerceProjectInput(body);
  const ownerId = typeof body?.ownerId === "string" ? body.ownerId : null;
  const provider = typeof body?.provider === "string" ? body.provider : "local-template";

  if (!input) {
    return NextResponse.json({ error: "project input required" }, { status: 400 });
  }

  const prompt = composeDesignStudioPrompt(input);
  const artifact = renderDesignArtifact(input);
  const project = await createDesignProject(input, ownerId);
  const projectId = project?.id ?? `local-${Date.now()}`;
  const generation = project?.id ? await createDesignGeneration(project.id, input, prompt, provider) : null;
  const htmlArtifact = project?.id
    ? await createDesignArtifact(project.id, generation?.id ?? null, "html", input.title, artifact.html, prompt, {
        templateId: input.templateId,
        skillId: input.skillId,
        visualDirectionId: input.visualDirectionId,
        policyVersion: "idol-design-policy-v1",
      })
    : null;
  const markdownArtifact = project?.id
    ? await createDesignArtifact(project.id, generation?.id ?? null, "markdown", `${input.title} Brief`, artifact.markdown, prompt, {
        templateId: input.templateId,
        skillId: input.skillId,
        policyVersion: "idol-design-policy-v1",
      })
    : null;

  await finishDesignGeneration(generation?.id, "succeeded");
  await finishDesignProject(project?.id, "ready");

  return NextResponse.json({
    projectId,
    generationId: generation?.id ?? null,
    artifactId: htmlArtifact?.id ?? null,
    markdownArtifactId: markdownArtifact?.id ?? null,
    persisted: Boolean(project?.id && htmlArtifact?.id),
    provider,
    policyVersion: "idol-design-policy-v1",
    generatedAt: new Date().toISOString(),
    prompt,
    artifact,
  });
}
