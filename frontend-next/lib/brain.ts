import {
  getLocalBrainLinks,
  getLocalBrainPage,
  searchLocalBrainPages,
  type BrainLink,
} from "./brain-local";
import { BRAIN_HEADERS, BRAIN_SB_URL, type BrainPage } from "./supabase-brain";

export async function searchBrainPages(query = "", type = "", limit = 8): Promise<BrainPage[]> {
  if (!BRAIN_HEADERS.apikey) return searchLocalBrainPages(query, type, limit);

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
    if (!res.ok) return searchLocalBrainPages(query, type, limit);
    const data = await res.json();
    if (!Array.isArray(data) || !data.length) {
      return searchLocalBrainPages(query, type, limit);
    }
    return data as BrainPage[];
  } catch {
    return searchLocalBrainPages(query, type, limit);
  }
}

export async function getBrainPage(slug: string): Promise<BrainPage | null> {
  if (!slug) return null;
  if (!BRAIN_HEADERS.apikey) return getLocalBrainPage(slug);

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
    if (!res.ok) return getLocalBrainPage(slug);
    const data = await res.json();
    return Array.isArray(data) ? ((data[0] as BrainPage) || getLocalBrainPage(slug)) : getLocalBrainPage(slug);
  } catch {
    return getLocalBrainPage(slug);
  }
}

export async function getBrainLinks(slug: string): Promise<BrainLink[]> {
  if (!slug) return [];
  if (!BRAIN_HEADERS.apikey) return getLocalBrainLinks(slug);

  try {
    const res = await fetch(
      `${BRAIN_SB_URL}/rest/v1/brain_links?select=from_slug,to_slug,link_type&from_slug=eq.${encodeURIComponent(
        slug
      )}`,
      {
        headers: BRAIN_HEADERS,
        cache: "no-store",
      }
    );
    if (!res.ok) return getLocalBrainLinks(slug);
    const data = await res.json();
    return Array.isArray(data) ? (data as BrainLink[]) : getLocalBrainLinks(slug);
  } catch {
    return getLocalBrainLinks(slug);
  }
}
