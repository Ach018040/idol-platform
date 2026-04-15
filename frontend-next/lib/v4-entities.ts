export type V4EntityKind = "member" | "group";

export type RawMember = {
  id?: string;
  name?: string;
  group?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  twitter?: string | null;
  threads?: string | null;
  photo_url?: string | null;
  days_since_update?: number | null;
  days_since_social_signal?: number | null;
  social_activity?: number | null;
  freshness_score?: number | null;
  temperature_index?: number | null;
  temperature_index_v2?: number | null;
  data_confidence?: number | null;
  followers_instagram?: number | null;
  avg_engagement_instagram?: number | null;
  avg_views_instagram?: number | null;
};

export type RawGroup = {
  group?: string;
  display_name?: string;
  member_count?: number | null;
  member_names?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  twitter?: string | null;
  youtube?: string | null;
  days_since_update?: number | null;
  last_group_snapshot_at?: string | null;
  group_temperature_index_v2?: number | null;
  temperature_index_v2?: number | null;
  temperature_index?: number | null;
  member_average_temperature_v2?: number | null;
  member_top_temperature_v2?: number | null;
  group_social_coverage_score?: number | null;
  active_member_count?: number | null;
};

export type V4Entity = {
  id: string;
  kind: V4EntityKind;
  name: string;
  subtitle: string;
  score: number;
  freshnessDays: number;
  confidence: number | null;
  socialLinks: {
    instagram?: string;
    facebook?: string;
    x?: string;
    youtube?: string;
  };
  metrics: {
    socialActivity?: number;
    freshnessScore?: number;
    followersInstagram?: number | null;
    avgEngagementInstagram?: number | null;
    avgViewsInstagram?: number | null;
    memberAverage?: number | null;
    memberTop?: number | null;
    socialCoverage?: number | null;
    activeMemberCount?: number | null;
  };
};

export type V4EntityPayload = {
  generatedAt: string;
  schemaVersion: "v4-entity-preview";
  members: V4Entity[];
  groups: V4Entity[];
  suggestedAlerts: Array<{
    id: string;
    label: string;
    condition: string;
  }>;
};

function toNumber(value: unknown, fallback = 0) {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

function ageFromDate(value?: string | null) {
  if (!value) return 365;
  const time = new Date(value).getTime();
  if (!Number.isFinite(time)) return 365;
  return Math.max(0, (Date.now() - time) / 86400000);
}

function cleanLink(value?: string | null) {
  const text = String(value || "").trim();
  return text ? text : undefined;
}

export function buildMemberEntities(rawMembers: RawMember[], limit = 50): V4Entity[] {
  return rawMembers
    .map((member, index): V4Entity => {
      const name = String(member.name || `Member ${index + 1}`);
      return {
        id: `member:${member.id || name}`,
        kind: "member",
        name,
        subtitle: member.group ? String(member.group) : "Solo",
        score: toNumber(member.temperature_index_v2 ?? member.temperature_index),
        freshnessDays: toNumber(member.days_since_social_signal ?? member.days_since_update, 365),
        confidence: member.data_confidence == null ? null : toNumber(member.data_confidence),
        socialLinks: {
          instagram: cleanLink(member.instagram),
          facebook: cleanLink(member.facebook),
          x: cleanLink(member.twitter || member.threads),
        },
        metrics: {
          socialActivity: toNumber(member.social_activity),
          freshnessScore: toNumber(member.freshness_score),
          followersInstagram: member.followers_instagram ?? null,
          avgEngagementInstagram: member.avg_engagement_instagram ?? null,
          avgViewsInstagram: member.avg_views_instagram ?? null,
        },
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function buildGroupEntities(rawGroups: RawGroup[], limit = 30): V4Entity[] {
  return rawGroups
    .map((group, index): V4Entity => {
      const name = String(group.display_name || group.group || `Group ${index + 1}`);
      return {
        id: `group:${group.group || name}`,
        kind: "group",
        name,
        subtitle: `${toNumber(group.member_count)} 位成員`,
        score: toNumber(group.group_temperature_index_v2 ?? group.temperature_index_v2 ?? group.temperature_index),
        freshnessDays: toNumber(group.days_since_update, ageFromDate(group.last_group_snapshot_at)),
        confidence: null,
        socialLinks: {
          instagram: cleanLink(group.instagram),
          facebook: cleanLink(group.facebook),
          x: cleanLink(group.twitter),
          youtube: cleanLink(group.youtube),
        },
        metrics: {
          memberAverage: group.member_average_temperature_v2 ?? null,
          memberTop: group.member_top_temperature_v2 ?? null,
          socialCoverage: group.group_social_coverage_score ?? null,
          activeMemberCount: group.active_member_count ?? null,
        },
      };
    })
    .filter((group) => group.freshnessDays <= 90)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function compareV4Entities(left: V4Entity, right: V4Entity) {
  return {
    scoreDelta: left.score - right.score,
    freshnessDelta: left.freshnessDays - right.freshnessDays,
    stronger: left.score === right.score ? "tie" : left.score > right.score ? left.id : right.id,
    fresher: left.freshnessDays === right.freshnessDays ? "tie" : left.freshnessDays < right.freshnessDays ? left.id : right.id,
  };
}
