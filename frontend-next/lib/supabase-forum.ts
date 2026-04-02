// ─── Supabase Forum Client ────────────────────────────────────────────────────
// 使用 idolmaps 的 Supabase（公開唯讀，論壇寫入需要另外設定）
// TODO: 換成論壇專用 Supabase project + service role key

const SB_URL = "https://ziiagdrrytyrmzoeegjk.supabase.co";
const SB_KEY = "sb_publishable_PtKb4LIJeJN3cECUJllW7w_UFRVTbTv";

export const SB_HEADERS = {
  apikey: SB_KEY,
  Accept: "application/json",
  "Content-Type": "application/json",
  "Accept-Profile": "public",
  "Content-Profile": "public",
};

// ─── Types ────────────────────────────────────────────────────────────────────
export type Forum = {
  id: string;
  slug: string;
  title: string;
  description: string;
  icon?: string;
  sort_order: number;
  thread_count?: number;
};

export type Thread = {
  id: string;
  forum_id: string;
  forum_slug?: string;
  author_id: string;
  author_name?: string;
  title: string;
  body: string;
  tags: string[];
  likes_count: number;
  replies_count: number;
  trending_score: number;
  is_pinned: boolean;
  is_locked: boolean;
  last_reply_at: string;
  created_at: string;
};

export type Post = {
  id: string;
  thread_id: string;
  author_id: string;
  author_name?: string;
  body: string;
  likes_count: number;
  edited: boolean;
  created_at: string;
};

// ─── Mock Data (使用前論壇 Supabase 未建立時的測試資料) ──────────────────────
export const MOCK_FORUMS: Forum[] = [
  { id: "1", slug: "general",  title: "綜合討論",     description: "一般話題、閒聊、市場觀察",   icon: "💬", sort_order: 1, thread_count: 42 },
  { id: "2", slug: "groups",   title: "團體討論",     description: "各團體相關討論與消息",       icon: "🎤", sort_order: 2, thread_count: 87 },
  { id: "3", slug: "members",  title: "成員討論",     description: "成員相關話題",               icon: "⭐", sort_order: 3, thread_count: 63 },
  { id: "4", slug: "events",   title: "活動心得",     description: "演出、活動後感與報告",       icon: "🎵", sort_order: 4, thread_count: 34 },
  { id: "5", slug: "goods",    title: "拍照物販交流", description: "物販規則、心得、拍立得推薦", icon: "📸", sort_order: 5, thread_count: 29 },
  { id: "6", slug: "news",     title: "新聞公告",     description: "官方公告與業界新聞",         icon: "📢", sort_order: 6, thread_count: 15 },
  { id: "7", slug: "off-topic","title": "雜談",       description: "其他話題",                   icon: "🌸", sort_order: 7, thread_count: 21 },
];

const now = new Date();
const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600000).toISOString();

export const MOCK_THREADS: Thread[] = [
  { id: "t1", forum_id: "2", forum_slug: "groups", author_id: "u1", author_name: "霓虹追星族", title: "時空Astria 新專輯討論串", body: "最近時空Astria 出了新專輯，大家怎麼看？個人覺得這次走向更成熟了...", tags: ["時空Astria", "新專輯"], likes_count: 34, replies_count: 28, trending_score: 8.2, is_pinned: true, is_locked: false, last_reply_at: hoursAgo(0.5), created_at: hoursAgo(48) },
  { id: "t2", forum_id: "4", forum_slug: "events", author_id: "u2", author_name: "LIVE魂", title: "【心得】宅化祭5 港台偶像場完整報告", body: "這次宅化祭真的超級精彩！整理了各團的演出時間和亮點...", tags: ["宅化祭", "活動心得"], likes_count: 67, replies_count: 45, trending_score: 12.4, is_pinned: false, is_locked: false, last_reply_at: hoursAgo(1), created_at: hoursAgo(72) },
  { id: "t3", forum_id: "5", forum_slug: "goods", author_id: "u3", author_name: "物販研究生", title: "各團拍立得價格整理（2026 Q2 更新）", body: "整理了目前市面上各團的拍立得價格，歡迎補充...", tags: ["物販", "拍立得"], likes_count: 89, replies_count: 52, trending_score: 15.8, is_pinned: true, is_locked: false, last_reply_at: hoursAgo(2), created_at: hoursAgo(168) },
  { id: "t4", forum_id: "1", forum_slug: "general", author_id: "u4", author_name: "溫度觀察員", title: "溫度指數排名變化大討論", body: "這週的排名變化好大，Kamiko 直接衝上第一...", tags: ["排行", "溫度指數"], likes_count: 23, replies_count: 18, trending_score: 6.1, is_pinned: false, is_locked: false, last_reply_at: hoursAgo(3), created_at: hoursAgo(24) },
  { id: "t5", forum_id: "3", forum_slug: "members", author_id: "u5", author_name: "粉絲日記", title: "稲妻莉央 Solo 活動情報彙整", body: "整理稲妻莉央近期的 Solo 活動資訊...", tags: ["稲妻莉央", "Solo"], likes_count: 41, replies_count: 33, trending_score: 9.7, is_pinned: false, is_locked: false, last_reply_at: hoursAgo(4), created_at: hoursAgo(96) },
  { id: "t6", forum_id: "2", forum_slug: "groups", author_id: "u6", author_name: "TUKUYOMI應援", title: "TUKUYOMI IDOL PROJECT 新成員加入！", body: "官方剛公告了新成員，大家來討論一下...", tags: ["TUKUYOMI"], likes_count: 55, replies_count: 41, trending_score: 11.2, is_pinned: false, is_locked: false, last_reply_at: hoursAgo(5), created_at: hoursAgo(36) },
  { id: "t7", forum_id: "4", forum_slug: "events", author_id: "u7", author_name: "場地達人", title: "4月活動懶人包（Phantasy Square / acosta）", body: "統整四月份各大活動資訊，附地圖與交通...", tags: ["活動", "四月"], likes_count: 78, replies_count: 39, trending_score: 13.5, is_pinned: false, is_locked: false, last_reply_at: hoursAgo(6), created_at: hoursAgo(60) },
];

export const MOCK_POSTS: Post[] = [
  { id: "p1", thread_id: "t1", author_id: "u8", author_name: "音樂分析師", body: "同意！這次的編曲加入了很多電子元素，感覺是在向日系地下偶像靠攏。", likes_count: 12, edited: false, created_at: hoursAgo(47) },
  { id: "p2", thread_id: "t1", author_id: "u9", author_name: "現場觀察者", body: "上週去看了他們的公演，MV 裡的那首主打曲現場更好聽！推薦大家有機會去現場。", likes_count: 8, edited: false, created_at: hoursAgo(36) },
  { id: "p3", thread_id: "t1", author_id: "u2", author_name: "LIVE魂", body: "我覺得這次的封面設計也很棒，整體視覺概念很完整。", likes_count: 15, edited: true, created_at: hoursAgo(24) },
];

// ─── 計算 Trending 標籤 ──────────────────────────────────────────────────────
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
  if (mins < 60) return `${mins} 分鐘前`;
  if (hours < 24) return `${hours} 小時前`;
  if (days < 7) return `${days} 天前`;
  return new Date(dateStr).toLocaleDateString("zh-TW");
}


// ─── 真實 Supabase 查詢函數 ───────────────────────────────────────────────────
// 當 forum tables 建立後，這些函數會自動取代 Mock 資料

async function sbGet(path: string, params?: Record<string,string>) {
  const url = new URL(`${SB_URL}/rest/v1/${path}`);
  if (params) Object.entries(params).forEach(([k,v]) => url.searchParams.set(k,v));
  const res = await fetch(url.toString(), { headers: SB_HEADERS, cache: "no-store" });
  if (!res.ok) throw new Error(`Forum DB ${path}: ${res.status}`);
  return res.json();
}

export async function fetchForums(): Promise<Forum[]> {
  try {
    const data = await sbGet("forums", { select: "id,slug,title,description,icon,sort_order", order: "sort_order.asc", limit: "20" });
    return data.length > 0 ? data : MOCK_FORUMS;
  } catch {
    return MOCK_FORUMS;
  }
}

export async function fetchThreads(forumSlug?: string, sort: "trending"|"latest" = "trending"): Promise<Thread[]> {
  try {
    const params: Record<string,string> = {
      select: "id,forum_id,author_id,title,body,tags,likes_count,replies_count,trending_score,is_pinned,is_locked,last_reply_at,created_at",
      limit: "30",
    };
    if (forumSlug) params["forum_slug"] = `eq.${forumSlug}`;
    if (sort === "trending") params.order = "trending_score.desc";
    else params.order = "last_reply_at.desc";
    const data = await sbGet("threads", params);
    return data.length > 0 ? data : MOCK_THREADS.filter(t => !forumSlug || t.forum_slug === forumSlug);
  } catch {
    return MOCK_THREADS.filter(t => !forumSlug || t.forum_slug === forumSlug);
  }
}

export async function fetchThread(threadId: string): Promise<Thread | null> {
  try {
    const data = await sbGet("threads", { select: "*", "id": `eq.${threadId}`, limit: "1" });
    return data[0] || MOCK_THREADS.find(t => t.id === threadId) || null;
  } catch {
    return MOCK_THREADS.find(t => t.id === threadId) || null;
  }
}

export async function fetchPosts(threadId: string): Promise<Post[]> {
  try {
    const data = await sbGet("posts", { select: "*", "thread_id": `eq.${threadId}`, order: "created_at.asc", limit: "100" });
    return data.length > 0 ? data : MOCK_POSTS.filter(p => p.thread_id === threadId);
  } catch {
    return MOCK_POSTS.filter(p => p.thread_id === threadId);
  }
}
