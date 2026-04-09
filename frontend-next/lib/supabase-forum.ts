// ─── Supabase Forum Client ────────────────────────────────────────────────────
const SB_URL = process.env.NEXT_PUBLIC_FORUM_SB_URL || "https://vxmebuygrnynxkepyunh.supabase.co";
const SB_KEY = process.env.NEXT_PUBLIC_FORUM_SB_ANON || "";

export const SB_HEADERS = {
  apikey: SB_KEY,
  Accept: "application/json",
  "Content-Type": "application/json",
};

// ─── Types ────────────────────────────────────────────────────────────────────
export type Forum = {
  id?: string;
  slug: string;
  title: string;
  description?: string;
  icon?: string;
  sort_order: number;
  thread_count?: number;
};

export type Thread = {
  id: string;
  forum_id?: string;
  forum_slug?: string;
  author_id?: string;
  author_name?: string;
  title: string;
  body: string;
  tags: string[];
  likes_count: number;
  replies_count: number;
  trending_score: number;
  is_pinned: boolean;
  is_locked: boolean;
  last_reply_at?: string;
  created_at: string;
};

export type Post = {
  id: string;
  thread_id: string;
  author_id?: string;
  author_name?: string;
  body: string;
  likes_count: number;
  edited: boolean;
  created_at: string;
};

// ─── Trending + 時間 helpers ──────────────────────────────────────────────────
export function getTrendingTag(thread: Thread): "hot" | "new" | "rising" | null {
  const hoursOld = (Date.now() - new Date(thread.created_at).getTime()) / 3600000;
  if (thread.trending_score > 12 && hoursOld < 72) return "hot";
  if (hoursOld < 24 && thread.replies_count < 5) return "new";
  if (thread.trending_score > 8) return "rising";
  return null;
}

export function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 2) return "剛剛";
  if (mins < 60) return `${mins} 分鐘前`;
  if (hours < 24) return `${hours} 小時前`;
  if (days < 7) return `${days} 天前`;
  return new Date(dateStr).toLocaleDateString("zh-TW");
}
