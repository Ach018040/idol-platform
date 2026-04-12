import { BRAIN_HEADERS, BRAIN_SB_URL, type BrainPage } from "./supabase-brain";

export async function searchBrainPages(query = "", type = "", limit = 8): Promise<BrainPage[]> {
  if (!BRAIN_HEADERS.apikey) return [];

  const params = new URLSearchParams({
    select: "slug,type,title,compiled_truth,timeline_md,tags,frontmatter,updated_at",
    order: "updated_at.desc",
    limit: String(limit),
  });

  if (type) params.set("type", `eq.${type}`);
  if (query) {
    params.set(
      "or",
      `(title.ilike.*${query}*,compiled_truth.ilike.*${query}*,slug.ilike.*${query}*)`
    );
  }

  try {
    const res = await fetch(`${BRAIN_SB_URL}/rest/v1/brain_pages?${params.toString()}`, {
      headers: BRAIN_HEADERS,
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? (data as BrainPage[]) : [];
  } catch {
    return [];
  }
}

export async function getBrainPage(slug: string): Promise<BrainPage | null> {
  if (!BRAIN_HEADERS.apikey || !slug) return null;

  try {
    const res = await fetch(
      `${BRAIN_SB_URL}/rest/v1/brain_pages?select=slug,type,title,compiled_truth,timeline_md,tags,frontmatter,updated_at&slug=eq.${encodeURIComponent(
        slug
      )}&limit=1`,
      {
        headers: BRAIN_HEADERS,
        cache: "no-store",
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data) ? ((data[0] as BrainPage) || null) : null;
  } catch {
    return null;
  }
}
