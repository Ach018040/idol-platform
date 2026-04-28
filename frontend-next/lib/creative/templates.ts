import type { CreativeMode, CreativeRunInput, CreativeStyle } from "./schemas";

export const CREATIVE_MODES: { id: CreativeMode; label: string; description: string }[] = [
  { id: "image", label: "成員主視覺", description: "偶像主視覺、展場大圖、形象照方向。" },
  { id: "poster", label: "活動海報", description: "活動主視覺、售票 CTA、限動尺寸延伸。" },
  { id: "mv-storyboard", label: "MV 分鏡", description: "短影片、MV、Reels / Shorts 分鏡腳本。" },
  { id: "social-post", label: "社群貼文", description: "SNS 宣傳圖、貼文文案、CTA 與 Hashtag。" },
];

export const CREATIVE_STYLES: { id: CreativeStyle; label: string; palette: string[]; description: string }[] = [
  { id: "stage-neon", label: "舞台霓虹", palette: ["#0f172a", "#22d3ee", "#f472b6", "#facc15"], description: "高能演出、雷射燈、夜場ライブ。" },
  { id: "strawberry-idol", label: "草莓偶像", palette: ["#fff1f5", "#fb7185", "#f9a8d4", "#3b1020"], description: "可愛、甜點、生日祭、粉絲應援。" },
  { id: "cinematic-mv", label: "電影 MV", palette: ["#111827", "#e5e7eb", "#dc2626", "#f59e0b"], description: "戲劇光影、故事感、MV 分鏡。" },
  { id: "otome-character", label: "乙女角色", palette: ["#28123a", "#c084fc", "#f9a8d4", "#fff7ed"], description: "角色卡、語音口播、收藏式資產。" },
  { id: "gallery-exhibition", label: "白盒展場", palette: ["#f8fafc", "#0f172a", "#38bdf8", "#f97316"], description: "虛擬展場、資料牆、沉浸式展示。" },
];

export const DEFAULT_CREATIVE_INPUT: CreativeRunInput = {
  memberName: "桜野杏理",
  memberColor: "草莓粉",
  memberTags: ["甜點", "恐怖遊戲", "鬼故事", "可愛活潑"],
  mode: "poster",
  style: "strawberry-idol",
  eventTheme: "生日祭與粉絲應援活動",
  outfitStyle: "草莓粉舞台洋裝、蝴蝶結、甜點小物",
  stageMood: "可愛但帶一點神秘感，像恐怖遊戲直播前的甜點派對",
};

export function getCreativeStyle(id: CreativeStyle) {
  return CREATIVE_STYLES.find((style) => style.id === id) ?? CREATIVE_STYLES[0];
}

export function getCreativeMode(id: CreativeMode) {
  return CREATIVE_MODES.find((mode) => mode.id === id) ?? CREATIVE_MODES[0];
}
