import insightPostsData from "../public/data/insight_posts.json";

export type InsightPost = {
  slug: string;
  title: string;
  summary: string;
  category: string;
  date: string;
  content: string[];
};

export const insightPosts = insightPostsData as InsightPost[];

export function getInsightBySlug(slug: string) {
  return insightPosts.find((post) => post.slug === slug);
}
