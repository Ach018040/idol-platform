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
    if (!ok) {
      return NextResponse.json({ error: "無法更新管理員身分" }, { status: 500 });
    }

    const updated = await fetchUserProfile(token);
    return NextResponse.json({ ok: true, profile: updated });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
