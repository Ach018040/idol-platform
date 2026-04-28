import type { CreativeAsset, CreativeRunInput } from "./schemas";
import { getCreativeMode, getCreativeStyle } from "./templates";

export const CREATIVE_POLICY = [
  "僅能使用授權、公開可用、平台自有或已取得同意的素材。",
  "真人偶像生成素材需標註 AI generated。",
  "不得冒用本人發言、官方背書或私人意見。",
  "不得製作未授權 deepfake、換臉、仿聲或身份誤導內容。",
  "不得生成成人化、惡意醜化、侵權、誤導性政治或商業宣傳內容。",
  "所有生成素材需保留 prompt、provider、時間與資料來源紀錄。",
];

export function composeCreativePrompt(input: CreativeRunInput) {
  const mode = getCreativeMode(input.mode);
  const style = getCreativeStyle(input.style);
  return [
    `Create ${mode.label} for idol-platform Creative Studio.`,
    `Idol member: ${input.memberName}. Representative color: ${input.memberColor}.`,
    `Tags: ${input.memberTags.join(", ")}.`,
    `Event theme: ${input.eventTheme}.`,
    `Outfit / costume: ${input.outfitStyle}.`,
    `Stage mood: ${input.stageMood}.`,
    `Visual style: ${style.label} (${style.description}).`,
    `Palette: ${style.palette.join(", ")}.`,
    "Must label output as AI generated when depicting a real idol.",
    "Do not impersonate the idol, create unauthorized deepfake, adultized content, malicious humiliation, or misleading political/commercial propaganda.",
  ].join("\n");
}

export function mockGenerateCreativeAsset(input: CreativeRunInput): CreativeAsset {
  const style = getCreativeStyle(input.style);
  const mode = getCreativeMode(input.mode);
  const createdAt = new Date().toISOString();
  const prompt = composeCreativePrompt(input);
  const socialCopy =
    input.mode === "mv-storyboard"
      ? `${input.memberName} 的 ${input.eventTheme} MV 分鏡草案完成。主軸是「${input.stageMood}」，可延伸成 9:16 Reels / Shorts。#idolplatform #AIgenerated`
      : `${input.memberName}｜${input.eventTheme}\n${input.outfitStyle}\nAI generated draft，不代表本人發言或官方背書。#idolplatform #推し活`;

  return {
    id: `asset-${Date.now()}`,
    mode: input.mode,
    title: `${input.memberName} ${mode.label}`,
    memberName: input.memberName,
    theme: input.eventTheme,
    style: input.style,
    prompt,
    socialCopy,
    mockPreview: {
      headline: input.memberName,
      subline: `${mode.label} · ${style.label}`,
      palette: style.palette,
      format: input.mode === "mv-storyboard" ? "9:16 storyboard" : input.mode === "social-post" ? "1080x1350 SNS" : "poster canvas",
    },
    policyVersion: "idol-creative-policy-v1",
    provider: "mock",
    createdAt,
  };
}
