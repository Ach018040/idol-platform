export type CreativeMode = "image" | "poster" | "mv-storyboard" | "social-post";

export type CreativeStyle =
  | "stage-neon"
  | "strawberry-idol"
  | "cinematic-mv"
  | "otome-character"
  | "gallery-exhibition";

export type CreativeAsset = {
  id: string;
  mode: CreativeMode;
  title: string;
  memberName: string;
  theme: string;
  style: CreativeStyle;
  prompt: string;
  socialCopy: string;
  mockPreview: {
    headline: string;
    subline: string;
    palette: string[];
    format: string;
  };
  policyVersion: "idol-creative-policy-v1";
  provider: "mock";
  createdAt: string;
};

export type CreativeRunInput = {
  memberName: string;
  memberColor: string;
  memberTags: string[];
  mode: CreativeMode;
  style: CreativeStyle;
  eventTheme: string;
  outfitStyle: string;
  stageMood: string;
};
