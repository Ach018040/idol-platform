export const BRAIN_SB_URL =
  process.env.NEXT_PUBLIC_BRAIN_SB_URL ||
  process.env.NEXT_PUBLIC_FORUM_SB_URL ||
  "https://vxmebuygrnynxkepyunh.supabase.co";

export const BRAIN_SB_ANON =
  process.env.NEXT_PUBLIC_BRAIN_SB_ANON ||
  process.env.NEXT_PUBLIC_FORUM_SB_ANON ||
  "";

export const BRAIN_HEADERS = {
  apikey: BRAIN_SB_ANON,
  Accept: "application/json",
  "Content-Type": "application/json",
};

export type BrainPage = {
  slug: string;
  type: string;
  title: string;
  compiled_truth: string;
  timeline_md: string;
  tags: string[];
  frontmatter: Record<string, unknown>;
  updated_at: string;
};
