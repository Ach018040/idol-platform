import { NextRequest, NextResponse } from "next/server";
import {
  createUserProfile,
  fetchUserProfile,
  updateUserProfile,
} from "../../../../../lib/user-role";

const ADMIN_SECRET =
  process.env.FORUM_ADMIN_SECRET ||
  process.env.NEXT_PUBLIC_ADMIN_TOKEN ||
  "idol-admin-2026";

function buildAdminFallbackProfile(token: string, displayName = "論壇管理員") {
  const now = new Date().toISOString();
  return {
    id: token,
    token,
    display_name: displayName,
    role: "admin" as const,
    bio: "",
    avatar_url: "",
    banner_color: "#7c3aed",
    post_count: 0,
    is_banned: false,
    banned_until: null,
    created_at: now,
    updated_at: now,
  };
}

export async function POST(request: NextRequest) {
  try {
    const { token, adminSecret } = await request.json();

    if (!token || !adminSecret) {
      return NextResponse.json({ error: "缺少 token 或管理員密碼" }, { status: 400 });
    }

    if (adminSecret !== ADMIN_SECRET) {
      return NextResponse.json({ error: "管理員密碼錯誤" }, { status: 403 });
    }

    let profile = await fetchUserProfile(token);
    if (!profile) {
      profile = await createUserProfile(token, "論壇管理員");
    }

    const ok = await updateUserProfile(token, { role: "admin" as const });
    const updated = await fetchUserProfile(token);
    const fallback = buildAdminFallbackProfile(token, profile?.display_name || "論壇管理員");

    if (!ok && !updated) {
      return NextResponse.json({
        ok: true,
        profile: fallback,
        persisted: false,
        warning: "論壇管理員身分尚未寫回資料庫，已先以本機權限模式開啟後台。",
      });
    }

    return NextResponse.json({
      ok: true,
      profile: updated ?? fallback,
      persisted: Boolean(updated),
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
