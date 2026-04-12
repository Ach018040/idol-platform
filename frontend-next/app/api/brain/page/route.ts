import { NextRequest, NextResponse } from "next/server";

import { BRAIN_HEADERS, BRAIN_SB_URL } from "@/lib/supabase-brain";

async function fetchJson(path: string) {
  const res = await fetch(`${BRAIN_SB_URL}${path}`, {
    headers: BRAIN_HEADERS,
    cache: "no-store",
  });
  if (!res.ok) {
    return null;
  }
  return res.json();
}

export async function GET(request: NextRequest) {
  const slug = (request.nextUrl.searchParams.get("slug") || "").trim();

  if (!slug) {
    return NextResponse.json({ page: null, links: [], error: "slug required" }, { status: 400 });
  }

  if (!BRAIN_HEADERS.apikey) {
    return NextResponse.json({ page: null, links: [], error: "BRAIN_SUPABASE_ANON_NOT_CONFIGURED" });
  }

  try {
    const pageRows = await fetchJson(
      `/rest/v1/brain_pages?select=slug,type,title,compiled_truth,timeline_md,tags,frontmatter,updated_at&slug=eq.${encodeURIComponent(
        slug
      )}&limit=1`
    );

    const page = Array.isArray(pageRows) ? pageRows[0] || null : null;
    if (!page) {
      return NextResponse.json({ page: null, links: [] });
    }

    const linkRows = await fetchJson(
      `/rest/v1/brain_links?select=to_slug,link_type&from_slug=eq.${encodeURIComponent(slug)}`
    );

    const links = Array.isArray(linkRows) ? linkRows : [];
    return NextResponse.json({ page, links });
  } catch (error) {
    return NextResponse.json({ page: null, links: [], error: String(error) }, { status: 200 });
  }
}
