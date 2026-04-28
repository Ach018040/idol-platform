export type DesignArtifactKind = "html" | "pdf" | "pptx" | "zip" | "markdown" | "social-card";

export type DesignSkillId =
  | "idol-profile"
  | "idol-event-page"
  | "idol-virtual-exhibition"
  | "idol-market-report"
  | "idol-pitch-deck";

export type DesignTemplateId =
  | "member-profile"
  | "event-landing"
  | "birthday-campaign"
  | "cheki-merch-report"
  | "weekly-market-report"
  | "virtual-exhibition-home"
  | "investment-pitch-deck";

export type VisualDirectionId =
  | "strawberry-pop"
  | "stage-neon"
  | "editorial-data"
  | "otome-card"
  | "gallery-white";

export type IdolDesignSource = "member" | "group" | "event" | "market" | "manual";

export type DesignProjectInput = {
  title: string;
  templateId: DesignTemplateId;
  skillId: DesignSkillId;
  dataSource: IdolDesignSource;
  designSystemId: string;
  visualDirectionId: VisualDirectionId;
  brief: string;
  member?: {
    name: string;
    nickname?: string;
    color?: string;
    symbol?: string;
    tags?: string[];
  };
  event?: {
    name?: string;
    date?: string;
    venue?: string;
    groups?: string;
    price?: string;
    timetable?: string;
  };
};

export type DesignArtifact = {
  id: string;
  projectId: string;
  kind: DesignArtifactKind;
  title: string;
  html: string;
  markdown: string;
  createdAt: string;
};

export const EXPORT_FORMATS: DesignArtifactKind[] = ["html", "pdf", "pptx", "zip", "markdown"];
