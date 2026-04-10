// 權限系統核心 — user-role.ts
export type UserRole = 'user' | 'moderator' | 'admin';

export interface UserProfile {
  id: string;
  token: string;
  display_name: string;
  role: UserRole;
  bio: string;
  avatar_url: string;
  banner_color: string;
  post_count: number;
  is_banned: boolean;
  banned_until: string | null;
  created_at: string;
  updated_at: string;
}

const SB_URL = process.env.NEXT_PUBLIC_FORUM_SB_URL || 'https://vxmebuygrnynxkepyunh.supabase.co';
const SB_ANON = process.env.NEXT_PUBLIC_FORUM_SB_ANON || '';
const ADMIN_TOKEN = process.env.NEXT_PUBLIC_ADMIN_TOKEN || 'idol-admin-2026';

// 從 Supabase 取 user profile（用 token 查）
export async function fetchUserProfile(token: string): Promise<UserProfile | null> {
  if (!token || !SB_ANON) return null;
  try {
    const res = await fetch(
      `${SB_URL}/rest/v1/user_profiles?token=eq.${token}&select=*&limit=1`,
      { headers: { apikey: SB_ANON, Accept: 'application/json' }, cache: 'no-store' }
    );
    const data = await res.json();
    return Array.isArray(data) && data[0] ? data[0] : null;
  } catch { return null; }
}

// 更新 user profile
export async function updateUserProfile(token: string, updates: Partial<UserProfile>): Promise<boolean> {
  if (!token || !SB_ANON) return false;
  try {
    const res = await fetch(
      `${SB_URL}/rest/v1/user_profiles?token=eq.${token}`,
      {
        method: 'PATCH',
        headers: { apikey: SB_ANON, Authorization: `Bearer ${SB_ANON}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify({ ...updates, updated_at: new Date().toISOString() })
      }
    );
    return res.ok;
  } catch { return false; }
}

// 建立新 user profile（首次加入）
export async function createUserProfile(token: string, display_name: string): Promise<UserProfile | null> {
  if (!token || !SB_ANON) return null;
  const role: UserRole = token === ADMIN_TOKEN ? 'admin' : 'user';
  try {
    const res = await fetch(`${SB_URL}/rest/v1/user_profiles`, {
      method: 'POST',
      headers: { apikey: SB_ANON, Authorization: `Bearer ${SB_ANON}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
      body: JSON.stringify({ token, display_name, role, bio: '', avatar_url: '', banner_color: '#7c3aed', post_count: 0, is_banned: false })
    });
    const data = await res.json();
    return Array.isArray(data) ? data[0] : null;
  } catch { return null; }
}

// 版主管理
export async function setUserRole(targetToken: string, role: UserRole, adminToken: string): Promise<boolean> {
  if (adminToken !== ADMIN_TOKEN) return false;
  return updateUserProfile(targetToken, { role });
}

export async function banUser(targetToken: string, hours: number | null, adminToken: string): Promise<boolean> {
  if (adminToken !== ADMIN_TOKEN) return false;
  const banned_until = hours ? new Date(Date.now() + hours * 3600000).toISOString() : null;
  return updateUserProfile(targetToken, { is_banned: true, banned_until });
}

export async function unbanUser(targetToken: string, adminToken: string): Promise<boolean> {
  if (adminToken !== ADMIN_TOKEN) return false;
  return updateUserProfile(targetToken, { is_banned: false, banned_until: null });
}

// 權限檢查
export const canModerate = (role: UserRole) => role === 'moderator' || role === 'admin';
export const isAdmin = (role: UserRole) => role === 'admin';
export const roleLabel = (role: UserRole) => ({ user: '用戶', moderator: '版主', admin: '管理員' }[role]);
export const roleBadgeColor = (role: UserRole) => ({ user: 'text-zinc-400', moderator: 'text-blue-400', admin: 'text-amber-400' }[role]);
