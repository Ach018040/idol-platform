import type { DesignArtifactKind, DesignProjectInput } from "./schemas";

const SB_URL = process.env.NEXT_PUBLIC_FORUM_SB_URL || "https://vxmebuygrnynxkepyunh.supabase.co";
const SB_ANON = process.env.NEXT_PUBLIC_FORUM_SB_ANON || "";

type DesignProjectRow = {
  id: string;
  title: string;
  template_id: string | null;
  design_system_id: string | null;
  data_source: string;
  visual_direction: string;
  source_payload: unknown;
  policy_version?: string;
  policy_acknowledged_at?: string | null;
  status: string;
};

type DesignGenerationRow = {
  id: string;
  project_id: string;
  skill_id: string;
  provider: string;
  prompt: string;
  status: string;
};

type DesignArtifactRow = {
  id: string;
  project_id: string;
  generation_id: string | null;
  kind: DesignArtifactKind;
  title: string;
  content: string | null;
  prompt?: string | null;
  generated_at?: string;
  policy_version?: string;
  metadata: unknown;
};

function headers() {
  return {
    apikey: SB_ANON,
    Authorization: `Bearer ${SB_ANON}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  };
}

export function hasDesignStorageConfig() {
  return Boolean(SB_URL && SB_ANON);
}

async function postRow<T>(table: string, row: Record<string, unknown>): Promise<T | null> {
  if (!hasDesignStorageConfig()) return null;

  const data = await fetch(`${SB_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      ...headers(),
      Prefer: "return=representation",
    },
    body: JSON.stringify(row),
  })
    .then((res) => (res.ok ? res.json() : null))
    .catch(() => null);

  return Array.isArray(data) ? data[0] ?? null : null;
}

async function patchRow<T>(table: string, id: string, patch: Record<string, unknown>): Promise<T | null> {
  if (!hasDesignStorageConfig() || !id) return null;

  const data = await fetch(`${SB_URL}/rest/v1/${table}?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: {
      ...headers(),
      Prefer: "return=representation",
    },
    body: JSON.stringify({ ...patch, updated_at: new Date().toISOString() }),
  })
    .then((res) => (res.ok ? res.json() : null))
    .catch(() => null);

  return Array.isArray(data) ? data[0] ?? null : null;
}

export async function createDesignProject(input: DesignProjectInput, ownerId?: string | null) {
  return postRow<DesignProjectRow>("design_projects", {
    owner_id: ownerId || null,
    title: input.title,
    template_id: input.templateId,
    design_system_id: input.designSystemId,
    data_source: input.dataSource,
    visual_direction: input.visualDirectionId,
    source_payload: input,
    policy_acknowledged_at: new Date().toISOString(),
    policy_version: "idol-design-policy-v1",
    status: "generating",
  });
}

export async function createDesignGeneration(projectId: string, input: DesignProjectInput, prompt: string, provider: string) {
  return postRow<DesignGenerationRow>("design_generations", {
    project_id: projectId,
    skill_id: input.skillId,
    provider,
    prompt,
    status: "running",
    started_at: new Date().toISOString(),
  });
}

export async function finishDesignGeneration(generationId: string | null | undefined, status: "succeeded" | "failed", error?: string) {
  if (!generationId) return null;
  return patchRow<DesignGenerationRow>("design_generations", generationId, {
    status,
    error: error || null,
    completed_at: new Date().toISOString(),
  });
}

export async function finishDesignProject(projectId: string | null | undefined, status: "ready" | "draft") {
  if (!projectId) return null;
  return patchRow<DesignProjectRow>("design_projects", projectId, { status });
}

export async function createDesignArtifact(
  projectId: string,
  generationId: string | null,
  kind: DesignArtifactKind,
  title: string,
  content: string,
  prompt: string,
  metadata: Record<string, unknown> = {},
) {
  return postRow<DesignArtifactRow>("design_artifacts", {
    project_id: projectId,
    generation_id: generationId,
    kind,
    title,
    content,
    prompt,
    generated_at: new Date().toISOString(),
    policy_version: "idol-design-policy-v1",
    metadata,
  });
}

export async function createExportJob(projectId: string, artifactId: string | null, exportType: Exclude<DesignArtifactKind, "social-card">) {
  return postRow<{ id: string; status: string }>("export_jobs", {
    project_id: projectId,
    artifact_id: artifactId,
    export_type: exportType,
    status: exportType === "html" || exportType === "markdown" || exportType === "zip" ? "succeeded" : "queued",
  });
}
