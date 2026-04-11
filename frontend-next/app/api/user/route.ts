import { NextRequest, NextResponse } from "next/server";
import {
  canModerate,
  createUserProfile,
  fetchUserProfile,
  updateUserProfile,
} from "../../../lib/user-role";

function buildFallbackProfile(
  token: string,
  displayName: string,
  role: "user" | "moderator" | "admin" = "user",
) {
  const now = new Date().toISOString();
  return {
    id: token,
    token,
    display_name: displayName,
    role,
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

export async function GET(req: NextRequest) {
  const token = new URL(req.url).searchParams.get("token");
  if (!token) {
    return NextResponse.json({ profile: null }, { status: 400 });
  }

  const profile = await fetchUserProfile(token);
  return NextResponse.json({ profile });
}

export async function POST(req: NextRequest) {
  try {
    const { token, display_name, bio, avatar_url, banner_color } = await req.json();

    if (!token || !display_name?.trim()) {
      return NextResponse.json({ error: "缺少 token 或顯示名稱" }, { status: 400 });
    }

    let profile = await fetchUserProfile(token);
    if (!profile) {
      profile = await createUserProfile(token, display_name.trim());
    } else {
      const updates: Record<string, string> = {};
      if (display_name?.trim()) updates.display_name = display_name.trim();
      if (bio !== undefined) updates.bio = bio;
      if (avatar_url !== undefined) updates.avatar_url = avatar_url;
      if (banner_color !== undefined) updates.banner_color = banner_color;
      if (Object.keys(updates).length > 0) {
        await updateUserProfile(token, updates);
      }
      profile = await fetchUserProfile(token);
    }

    return NextResponse.json(
      {
        profile: profile ?? buildFallbackProfile(token, display_name.trim()),
        persisted: Boolean(profile),
      },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { admin_token, target_token, action, role, hours } = await req.json();
    const adminProfile = await fetchUserProfile(admin_token);

    if (!adminProfile || !canModerate(adminProfile.role)) {
      return NextResponse.json({ error: "沒有管理權限" }, { status: 403 });
    }

    if (action === "set_role") {
      if (adminProfile.role !== "admin") {
        return NextResponse.json({ error: "只有管理員可以調整角色" }, { status: 403 });
      }
      await updateUserProfile(target_token, { role });
    } else if (action === "ban") {
      const banned_until = hours
        ? new Date(Date.now() + hours * 3600000).toISOString()
        : null;
      await updateUserProfile(target_token, { is_banned: true, banned_until });
    } else if (action === "unban") {
      await updateUserProfile(target_token, { is_banned: false, banned_until: null });
    }

    return NextResponse.json({ profile: await fetchUserProfile(target_token) });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
