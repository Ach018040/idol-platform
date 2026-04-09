// ─── Supabase Forum Client ────────────────────────────────────────────────────
export const SB_HEADERS = {
  apikey: process.env.NEXT_PUBLIC_FORUM_SB_ANON || "",
  Accept: "application/json",
  "Content-Type": "application/json",
};

export type Forum = {
  id?: string; slug: string; title: string; description?: string;
  icon?: string; sort_order: number; thread_count?: number;
};
export type Thread = {
  id: string; forum_id?: string; forum_slug?: string; author_id?: string;
  author_name?: string; title: string; body: string; tags: string[];
  likes_count: number; replies_count: number; trending_score: number;
  is_pinned: boolean; is_locked: boolean; last_reply_at?: string; created_at: string;
};
export type Post = {
  id: string; thread_id: string; author_id?: string; author_name?: string;
  body: string; likes_count: number; edited: boolean; created_at: string;
};

// Fallback data — MOCK_THREADS/MOCK_POSTS 為空，不顯示假資料
export const MOCK_FORUMS: Forum[] = [
  { slug:"general", title:"💬 綜合討論", description:"各種話題", icon:"💬", sort_order:1, thread_count:0 },
  { slug:"groups",  title:"🎤 團體討論", description:"各團體相關討論", icon:"🎤", sort_order:2, thread_count:0 },
  { slug:"members", title:"⭐ 成員討論", description:"成員相關話題", icon:"⭐", sort_order:3, thread_count:0 },
  { slug:"events",  title:"🎵 活動心得", description:"演出分享", icon:"🎵", sort_order:4, thread_count:0 },
  { slug:"photo",   title:"📸 拍照物販", description:"物販交流", icon:"📸", sort_order:5, thread_count:0 },
  { slug:"news",    title:"📢 新聞公告", description:"官方公告", icon:"📢", sort_order:6, thread_count:0 },
  { slug:"misc",    title:"🌸 雜談",     description:"其他話題", icon:"🌸", sort_order:7, thread_count:0 },
];
export const MOCK_THREADS: Thread[] = [];
export const MOCK_POSTS: Post[] = [];

export function getTrendingTag(thread: Thread): "hot"|"new"|"rising"|null {
  const h = (Date.now() - new Date(thread.created_at).getTime()) / 3600000;
  if (thread.trending_score > 12 && h < 72) return "hot";
  if (h < 24 && thread.replies_count < 5) return "new";
  if (thread.trending_score > 8) return "rising";
  return null;
}

export function formatRelativeTime(dateStr: string): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const m=Math.floor(diff/60000), h=Math.floor(diff/3600000), d=Math.floor(diff/86400000);
  if (m<2) return "剛剛";
  if (m<60) return `${m} 分鐘前`;
  if (h<24) return `${h} 小時前`;
  if (d<7) return `${d} 天前`;
  return new Date(dateStr).toLocaleDateString("zh-TW");
}
