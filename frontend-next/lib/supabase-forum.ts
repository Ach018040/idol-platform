// ─── Supabase Forum Client ────────────────────────────────────────────────────
export const SB_URL = process.env.NEXT_PUBLIC_FORUM_SB_URL || "https://vxmebuygrnynxkepyunh.supabase.co";
export const SB_KEY = process.env.NEXT_PUBLIC_FORUM_SB_ANON || "";

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

// ─── Fallback（真實 API 無資料時使用）──────────────────────────────────────────
export const MOCK_FORUMS: Forum[] = [
  { slug:"general", title:"💬 綜合討論", description:"各種話題", icon:"💬", sort_order:1, thread_count:0 },
  { slug:"groups",  title:"🎤 團體討論", description:"各團體相關", icon:"🎤", sort_order:2, thread_count:0 },
  { slug:"members", title:"⭐ 成員討論", description:"成員話題", icon:"⭐", sort_order:3, thread_count:0 },
  { slug:"events",  title:"🎵 活動心得", description:"演出分享", icon:"🎵", sort_order:4, thread_count:0 },
  { slug:"photo",   title:"📸 拍照物販", description:"攝影周邊", icon:"📸", sort_order:5, thread_count:0 },
  { slug:"news",    title:"📢 新聞公告", description:"最新消息", icon:"📢", sort_order:6, thread_count:0 },
  { slug:"misc",    title:"🌸 雜談",     description:"其他", icon:"🌸", sort_order:7, thread_count:0 },
];

export const MOCK_THREADS: Thread[] = [];

// ─── Helpers ───────────────────────────────────────────────────────────────────
export function getTrendingTag(thread: Thread): "hot" | "new" | "rising" | null {
  const hoursOld = (Date.now() - new Date(thread.created_at).getTime()) / 3600000;
  if (thread.trending_score > 12 && hoursOld < 72) return "hot";
  if (hoursOld < 24 && (thread.replies_count || 0) < 5) return "new";
  if (thread.trending_score > 8) return "rising";
  return null;
}

export function formatRelativeTime(dateStr?: string): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 2) return "剛剛";
  if (mins < 60) return mins + " 分鐘前";
  if (hours < 24) return hours + " 小時前";
  if (days < 7) return days + " 天前";
  return new Date(dateStr).toLocaleDateString("zh-TW");
}
