import { NextRequest, NextResponse } from "next/server";

import { searchLocalBrainPages } from "@/lib/brain-local";
import { BRAIN_HEADERS, BRAIN_SB_URL } from "@/lib/supabase-brain";

function escapeIlike(value: string) {
  return value.replace(/[%*,()]/g, " ").trim();
}

export async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get("q") || "").trim();
  const type = (request.nextUrl.searchParams.get("type") || "").trim();
  const limitRaw = Number(request.nextUrl.searchParams.get("limit") || "8");
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 20) : 8;

  if (!BRAIN_HEADERS.apikey) {
    return NextResponse.json({ pages: searchLocalBrainPages(q, type, limit), fallback: true });
  }

  const params = new URLSearchParams({
    select: "slug,type,title,compiled_truth,tags,frontmatter,updated_at",
    order: "updated_at.desc",
    limit: String(limit),
  });

  if (type) {
    params.set("type", `eq.${type}`);
  }

  if (q) {
    const safe = escapeIlike(q);
    params.set(
      "or",
      `(title.ilike.*${safe}*,compiled_truth.ilike.*${safe}*,slug.ilike.*${safe}*)`
    );
  }

  try {
    const res = await fetch(`${BRAIN_SB_URL}/rest/v1/brain_pages?${params.toString()}`, {
      headers: BRAIN_HEADERS,
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json(
        { pages: searchLocalBrainPages(q, type, limit), error: `SUPABASE_${res.status}`, fallback: true },
        { status: 200 }
      );
    }

    const pages = await res.json();
    const resolved = Array.isArray(pages) && pages.length ? pages : searchLocalBrainPages(q, type, limit);
    return NextResponse.json({ pages: resolved, fallback: !Array.isArray(pages) || !pages.length });
  } catch (error) {
    return NextResponse.json(
      { pages: searchLocalBrainPages(q, type, limit), error: String(error), fallback: true },
      { status: 200 }
    );
  }
}
