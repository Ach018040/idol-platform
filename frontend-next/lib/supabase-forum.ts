export const SB_HEADERS = {
  apikey: process.env.NEXT_PUBLIC_FORUM_SB_ANON || "",
  Accept: "application/json",
  "Content-Type": "application/json",
};

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

export const MOCK_FORUMS: Forum[] = [
  { slug: "general", title: "💬 綜合討論", description: "自由討論與新手提問", icon: "💬", sort_order: 1, thread_count: 0 },
  { slug: "groups", title: "🎤 團體討論", description: "集中聊各團體近況", icon: "🎤", sort_order: 2, thread_count: 0 },
  { slug: "members", title: "🌟 成員討論", description: "成員焦點與人氣觀察", icon: "🌟", sort_order: 3, thread_count: 0 },
  { slug: "events", title: "📅 活動討論", description: "演出、票務與活動心得", icon: "📅", sort_order: 4, thread_count: 0 },
  { slug: "photo", title: "🖼 圖片分享", description: "照片、周邊與視覺內容", icon: "🖼", sort_order: 5, thread_count: 0 },
  { slug: "news", title: "📰 新聞情報", description: "市場消息與外部資訊", icon: "📰", sort_order: 6, thread_count: 0 },
  { slug: "misc", title: "🧩 其他話題", description: "未分類的延伸討論", icon: "🧩", sort_order: 7, thread_count: 0 },
];

export const MOCK_THREADS: Thread[] = [];
export const MOCK_POSTS: Post[] = [];

export function getTrendingTag(thread: Thread): "hot" | "new" | "rising" | null {
  const hours = (Date.now() - new Date(thread.created_at).getTime()) / 3600000;
  if (thread.trending_score > 12 && hours < 72) return "hot";
  if (hours < 24 && thread.replies_count < 5) return "new";
  if (thread.trending_score > 8) return "rising";
  return null;
}

export function formatRelativeTime(dateStr: string): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 2) return "剛剛";
  if (minutes < 60) return `${minutes} 分鐘前`;
  if (hours < 24) return `${hours} 小時前`;
  if (days < 7) return `${days} 天前`;
  return new Date(dateStr).toLocaleDateString("zh-TW");
}
