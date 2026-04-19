"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

const ICS_API = "/api/ical";
const ACTIVE_WINDOW_DAYS = 90;

type Member = {
  rank: number;
  id: string;
  name: string;
  group?: string;
  instagram?: string;
  facebook?: string;
  twitter?: string;
  threads?: string;
  photo_url?: string;
  updated_at?: string;
  days_since_update?: number;
  social_activity: number;
  freshness_score?: number;
  temperature_index: number;
  temperature_index_v2?: number;
  conversion_score: number;
  conversion_score_v2?: number;
  reach_score?: number | null;
  engagement_score?: number | null;
  view_quality_score?: number | null;
  content_consistency_score?: number | null;
  data_confidence?: number | null;
};

type Group = {
  rank: number;
  display_rank?: number;
  group: string;
  display_name: string;
  color: string;
  photo_url?: string;
  member_count: number;
  member_names: string;
  social_activity: number;
  temperature_index: number;
  temperature_index_v2?: number;
  conversion_score: number;
  conversion_score_v2?: number;
  instagram?: string;
  facebook?: string;
  twitter?: string;
  youtube?: string;
  is_solo?: boolean;
  days_since_update?: number;
  member_average_temperature_v2?: number;
  member_top_temperature_v2?: number;
  group_social_coverage_score?: number;
  group_content_diversity_score?: number;
  active_member_count?: number;
  last_group_snapshot_at?: string | null;
  group_temperature_index_v2?: number;
  group_conversion_score_v2?: number;
};

type CalEvent = { date: string; time: string; summary: string; dtRaw: Date };

type Insights = {
  market_temperature: number;
  market_temperature_v2?: number;
  active_groups: number;
  formula_version?: string;
  data_coverage?: {
    instagram?: number;
    threads?: number;
    audience_insights?: number;
    commercial_insights?: number;
    views?: number;
  };
  weekly_highlights: {
    top_group: string;
    social_king: string;
    social_focus?: string;
  };
  rising_stars: string[];
  events: CalEvent[];
};

function fmt(value: number | null | undefined, digits = 1) {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n.toFixed(digits) : "0";
}

function getRankBadge(rank: number) {
  if (rank === 1) return "TOP 1";
  if (rank === 2) return "TOP 2";
  if (rank === 3) return "TOP 3";
  return `#${rank}`;
}

function getInitial(name: string) {
  return [...name][0] ?? "?";
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, value));
}

function hashColor(name: string) {
  let h = 0x811c9dc5;
  for (let i = 0; i < name.length; i += 1) {
    h = (Math.imul(h ^ name.charCodeAt(i), 0x01000193)) >>> 0;
  }
  return `hsl(${h % 360},${55 + ((h >> 8) % 30)}%,${45 + ((h >> 16) % 20)}%)`;
}

function dotColor(group: Group) {
  const color = group.color || "#888888";
  return color !== "#e879a0" && color !== "#888888" && color !== "#ffffff"
    ? color
    : hashColor(group.display_name || group.group);
}

function pickSocialKing(members: Member[]) {
  if (members.length === 0) return null;
  return members.reduce((best, current) => {
    if (current.social_activity !== best.social_activity) {
      return current.social_activity > best.social_activity ? current : best;
    }
    const currentTemp = current.temperature_index_v2 ?? current.temperature_index;
    const bestTemp = best.temperature_index_v2 ?? best.temperature_index;
    if (currentTemp !== bestTemp) {
      return currentTemp > bestTemp ? current : best;
    }
    return current.rank < best.rank ? current : best;
  }, members[0]);
}

function activeLabel(daysSinceUpdate?: number) {
  if ((daysSinceUpdate ?? 365) <= 10) return { text: "活躍", cls: "text-emerald-400" };
  if ((daysSinceUpdate ?? 365) <= 30) return { text: "近期", cls: "text-yellow-400" };
  return { text: "待更新", cls: "text-zinc-500" };
}

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) throw new Error(`${path} ${response.status}`);
  return response.json();
}

async function loadData() {
  const [membersRaw, groupsRaw, insightsRaw, icalJson] = await Promise.all([
    fetchJson<Member[]>("/data/member_rankings.json"),
    fetchJson<Group[]>("/data/v7_rankings.json"),
    fetchJson<Omit<Insights, "events">>("/data/insights.json"),
    fetch(ICS_API).then((res) => (res.ok ? res.json() : { events: [] })).catch(() => ({ events: [] })),
  ]);

  const now = Date.now();
  const memberData = membersRaw
    .map((member) => ({
      ...member,
      temperature_index: member.temperature_index_v2 ?? member.temperature_index,
      conversion_score: member.conversion_score_v2 ?? member.conversion_score,
    }))
    .sort((a, b) => b.temperature_index - a.temperature_index)
    .map((member, index) => ({ ...member, rank: index + 1 }));

  const normalizedGroups = groupsRaw.map((group) => ({
    ...group,
    temperature_index: group.group_temperature_index_v2 ?? group.temperature_index_v2 ?? group.temperature_index,
    conversion_score: group.group_conversion_score_v2 ?? group.conversion_score_v2 ?? group.conversion_score,
    days_since_update:
      group.days_since_update ??
      (group.last_group_snapshot_at
        ? Math.max(0, (now - new Date(group.last_group_snapshot_at).getTime()) / 86400000)
        : 365),
  }));

  const soloGroups = memberData
    .filter((member) => !member.group)
    .map<Group>((member) => ({
      rank: 0,
      group: member.name,
      display_name: member.name,
      color: "#888888",
      member_count: 1,
      member_names: member.name,
      photo_url: member.photo_url,
      social_activity: member.social_activity,
      temperature_index: member.temperature_index,
      conversion_score: member.conversion_score,
      instagram: member.instagram,
      facebook: member.facebook,
      twitter: member.twitter || member.threads,
      is_solo: true,
      days_since_update: member.days_since_update ?? 365,
      member_average_temperature_v2: member.temperature_index,
      member_top_temperature_v2: member.temperature_index,
      group_social_coverage_score: member.reach_score ?? member.social_activity,
      group_content_diversity_score: member.content_consistency_score ?? 0,
      active_member_count: 1,
    }));

  const groupData = [...normalizedGroups, ...soloGroups]
    .sort((a, b) => b.temperature_index - a.temperature_index)
    .map((group, index) => ({ ...group, rank: index + 1 }));

  const events: CalEvent[] = (icalJson.events || []).map((event: { date: string; time: string; summary: string }) => ({
    ...event,
    dtRaw: new Date(),
  }));

  const activeRankableGroups = groupData.filter(
    (group) => !group.is_solo && group.member_count > 0 && (group.days_since_update ?? 365) <= ACTIVE_WINDOW_DAYS,
  );

  const socialKing = pickSocialKing(memberData);
  const insights: Insights = {
    ...insightsRaw,
    market_temperature: insightsRaw.market_temperature_v2 ?? insightsRaw.market_temperature,
    weekly_highlights: {
      top_group: activeRankableGroups[0]?.display_name || insightsRaw.weekly_highlights?.top_group || "N/A",
      social_king: socialKing?.name || insightsRaw.weekly_highlights?.social_king || "N/A",
      social_focus: insightsRaw.weekly_highlights?.social_focus || socialKing?.name || "N/A",
    },
    active_groups: activeRankableGroups.length,
    events,
  };

  return { memberData, groupData, insights };
}

function SocialLinks(props: {
  instagram?: string;
  twitter?: string;
  facebook?: string;
  youtube?: string;
  threads?: string;
}) {
  const items = [
    { key: "IG", href: props.instagram, cls: "text-pink-400 hover:text-pink-300" },
    { key: "X", href: props.twitter || props.threads, cls: "text-sky-400 hover:text-sky-300" },
    { key: "FB", href: props.facebook, cls: "text-blue-400 hover:text-blue-300" },
    { key: "YT", href: props.youtube, cls: "text-red-400 hover:text-red-300" },
  ].filter((item) => item.href);

  return (
    <div className="flex items-center gap-2">
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            window.open(item.href, "_blank");
          }}
          className={`font-bold text-xs ${item.cls}`}
        >
          {item.key}
        </button>
      ))}
    </div>
  );
}

export default function HomePage() {
  const [data, setData] = useState<{ memberData: Member[]; groupData: Group[]; insights: Insights } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [visitCount, setVisitCount] = useState<number | null>(null);

  const refresh = async () => {
    setLoading(true);
    try {
      const nextData = await loadData();
      setData(nextData);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    try {
      const key = "idol_visit_count";
      const next = parseInt(localStorage.getItem(key) || "0", 10) + 1;
      localStorage.setItem(key, String(next));
      setVisitCount(next);
      fetch("/api/visit", { method: "POST" }).catch(() => {});
    } catch {
      // Ignore client-only storage errors.
    }
  }, []);

  const fmtDateTime = (value: Date) =>
    new Intl.DateTimeFormat("zh-TW", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Asia/Taipei",
    }).format(value);

  if (loading && !data) {
    return (
      <main className="page-shell min-h-screen flex items-center justify-center text-white">
        <div className="space-y-4 text-center">
          <div className="text-4xl animate-spin">◌</div>
          <p className="text-lg text-zinc-300">正在讀取最新平台資料...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="page-shell min-h-screen flex items-center justify-center text-white">
        <div className="space-y-3 text-center">
          <p className="text-red-400">資料載入失敗：{error}</p>
          <button onClick={refresh} className="rounded-xl bg-pink-500 px-4 py-2 text-sm">
            重新整理
          </button>
        </div>
      </main>
    );
  }

  const { memberData, groupData, insights } = data!;
  const groups = groupData
    .filter((group) => !group.is_solo && group.member_count > 0 && (group.days_since_update ?? 365) <= ACTIVE_WINDOW_DAYS)
    .slice(0, 10)
    .map((group, index) => ({ ...group, display_rank: index + 1 }));
  const solos = groupData
    .filter((group) => group.is_solo && (group.days_since_update ?? 365) <= ACTIVE_WINDOW_DAYS)
    .slice(0, 6);
  const members = memberData.slice(0, 10);
  const maxGS = Math.max(...groups.map((group) => group.temperature_index), 1);
  const maxSolo = Math.max(...solos.map((group) => group.temperature_index), 1);
  const maxMS = Math.max(...members.map((member) => member.temperature_index), 1);

  return (
    <main className="page-shell min-h-screen text-white">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 lg:px-8">
        <header className="hero-surface mb-8 p-6 md:p-8">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="eyebrow-chip mb-2 px-3 py-1 text-xs">Idol Temperature Platform v3.8</div>
              <h1 className="text-3xl font-black text-white md:text-5xl">
                台灣地下偶像
                <span className="block bg-gradient-to-r from-pink-400 via-violet-300 to-cyan-300 bg-clip-text text-transparent">
                  市場情報平台
                </span>
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-300">
                排行榜、近期活動、論壇、Agent 與新版 v2 公式都整合在同一個入口。
                現在首頁會分開呈現正式團體、成員與 Solo 區塊，並只顯示近 90 天內仍有更新的資料。
              </p>
            </div>
            <div className="flex items-end gap-2">
              <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-100">
                <div className="mb-1 flex items-center gap-3 text-xs uppercase tracking-widest text-cyan-300/80">
                  <span>Last Update</span>
                  {visitCount !== null ? (
                    <span className="normal-case tracking-normal text-zinc-400">本機造訪 {visitCount.toLocaleString()} 次</span>
                  ) : null}
                </div>
                <div className="font-semibold">{lastUpdated ? fmtDateTime(lastUpdated) : "尚未更新"}</div>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  onClick={refresh}
                  disabled={loading}
                  className="rounded-xl border border-pink-400/20 bg-pink-400/10 px-4 py-2 text-xs text-pink-200 transition-colors hover:bg-pink-400/20 disabled:opacity-50"
                >
                  {loading ? "更新中..." : "立即更新"}
                </button>
                <Link href="/forum" className="rounded-xl border border-violet-400/20 bg-violet-400/10 px-4 py-2 text-center text-xs text-violet-200 transition-colors hover:bg-violet-400/20">
                  前往論壇
                </Link>
                <Link href="/agent" className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-center text-xs text-cyan-200 transition-colors hover:bg-cyan-400/20">
                  AI Agent
                </Link>
              </div>
            </div>
          </div>

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "市場溫度指數", value: fmt(insights.market_temperature), cls: "pink" },
              { label: "近況活躍團體", value: String(insights.active_groups), cls: "cyan" },
              { label: "本週焦點團體", value: insights.weekly_highlights.top_group, cls: "amber" },
              { label: "社群焦點成員", value: insights.weekly_highlights.social_king, cls: "violet" },
            ].map(({ label, value, cls }) => (
              <div key={label} className={`rounded-2xl border border-${cls}-400/20 bg-gradient-to-br from-${cls}-500/15 to-${cls}-500/5 p-5`}>
                <div className={`text-xs uppercase tracking-widest text-${cls}-200/80`}>{label}</div>
                <div className={`mt-2 line-clamp-2 text-3xl font-extrabold text-${cls}-300`}>{value}</div>
              </div>
            ))}
          </section>
        </header>

        <section className="mb-8 grid grid-cols-1 gap-4 xl:grid-cols-3">
          <div className="surface-panel border-emerald-400/20 bg-emerald-500/10 p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold text-emerald-200">Rising Stars</h2>
              <span className="rounded-full border border-emerald-300/20 px-2 py-0.5 text-xs text-emerald-300/70">本週觀察</span>
            </div>
            {insights.rising_stars.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {insights.rising_stars.map((star) => (
                  <span key={star} className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-sm text-emerald-100">
                    {star}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-zinc-400">目前沒有新的 rising stars 資料。</p>
            )}
          </div>

          <div className="surface-panel border-amber-400/20 bg-amber-500/10 p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold text-amber-200">
                <Link href="/events" className="transition-colors hover:text-amber-300">
                  近期活動
                </Link>
              </h2>
              <span className="rounded-full border border-amber-300/20 px-2 py-0.5 text-xs text-amber-300/70">未來 60 天</span>
            </div>
            {insights.events.length > 0 ? (
              <div className="max-h-48 space-y-1.5 overflow-y-auto pr-1">
                {insights.events.slice(0, 15).map((event, index) => (
                  <div key={index} className="flex items-start gap-2 text-xs">
                    <span className="w-20 flex-shrink-0 font-medium text-amber-300">{event.date}</span>
                    <span className="w-10 flex-shrink-0 text-zinc-500">{event.time}</span>
                    <span className="truncate text-zinc-200">{event.summary}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-zinc-400">目前沒有可顯示的活動資料。</p>
            )}
          </div>

          <div className="surface-panel p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">V2 公式摘要</h2>
              <span className="rounded-full border border-white/10 px-2 py-0.5 text-xs text-zinc-400">{insights.formula_version || "v2"}</span>
            </div>
            <div className="space-y-2 text-sm text-zinc-300">
              <p>
                市場溫度指數 <span className="font-bold text-pink-300">{fmt(insights.market_temperature)}</span>，目前以 `temperature_index_v2` 為排序依據。
              </p>
              <p>
                本週焦點團體 <span className="font-semibold text-amber-300">{insights.weekly_highlights.top_group}</span>，
                社群焦點成員 <span className="font-semibold text-violet-300">{insights.weekly_highlights.social_king}</span>。
              </p>
              <p>
                資料覆蓋率：Instagram <span className="font-semibold text-cyan-300">{fmt((insights.data_coverage?.instagram ?? 0) * 100, 0)}%</span>、
                Threads <span className="font-semibold text-cyan-300">{fmt((insights.data_coverage?.threads ?? 0) * 100, 0)}%</span>。
              </p>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="surface-panel p-5 md:p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">團體排行 Top 10</h2>
                <p className="mt-1 text-sm text-zinc-400">依 `group_temperature_index_v2` 排序，僅顯示近 90 天仍有更新的正式團體。</p>
              </div>
              <span className="rounded-full border border-pink-400/20 bg-pink-400/10 px-3 py-1 text-xs text-pink-200">Groups</span>
            </div>
            <div className="space-y-3">
              {groups.map((group) => {
                const pct = clamp((group.temperature_index / maxGS) * 100);
                const dc = dotColor(group);
                return (
                  <Link
                    key={`${group.rank}-${group.group}`}
                    href={`/groups/${encodeURIComponent(group.display_name)}`}
                    className="surface-card block p-4 transition-colors hover:border-pink-400/30 hover:bg-white/10"
                  >
                    <div className="mb-3 flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-sm font-bold">{getRankBadge(group.display_rank ?? group.rank)}</div>
                      <div className="h-4 w-4 flex-shrink-0 rounded-full border border-white/20" style={{ backgroundColor: dc }} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-base font-semibold text-white">{group.display_name}</div>
                        <div className="truncate text-xs text-zinc-400">
                          {group.member_count} 人
                          {group.member_names ? `・${group.member_names.split(" / ").slice(0, 4).join(" / ")}` : ""}
                        </div>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <div className="text-lg font-extrabold text-pink-300">{fmt(group.temperature_index)}</div>
                        <div className="text-[11px] text-zinc-400">V2 溫度</div>
                      </div>
                    </div>
                    <div className="mb-2 h-2 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full rounded-full bg-gradient-to-r from-pink-500 via-fuchsia-400 to-violet-400" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="flex items-center justify-between text-xs text-zinc-400">
                      <span>團體指標 平均 {fmt(group.member_average_temperature_v2)} / 最高 {fmt(group.member_top_temperature_v2)}</span>
                      <SocialLinks instagram={group.instagram} twitter={group.twitter} facebook={group.facebook} youtube={group.youtube} />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="surface-panel p-5 md:p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">成員排行 Top 10</h2>
                <p className="mt-1 text-sm text-zinc-400">依 `temperature_index_v2` 排序，展示目前最值得追蹤的成員。</p>
              </div>
              <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-200">Members</span>
            </div>
            <div className="space-y-3">
              {members.map((member) => {
                const pct = clamp((member.temperature_index / maxMS) * 100);
                const status = activeLabel(member.days_since_update);
                return (
                  <Link
                    key={`${member.rank}-${member.name}`}
                    href={`/members/${encodeURIComponent(member.name)}`}
                    className="surface-card block p-4 transition-colors hover:border-cyan-400/30 hover:bg-white/10"
                  >
                    <div className="mb-3 flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-sm font-bold">{getRankBadge(member.rank)}</div>
                      {member.photo_url ? (
                        <Image src={member.photo_url} alt={member.name} width={44} height={44} className="h-11 w-11 rounded-2xl object-cover ring-1 ring-white/10" unoptimized />
                      ) : (
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/30 to-violet-500/30 text-sm font-bold">
                          {getInitial(member.name)}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-base font-semibold text-white">{member.name}</div>
                        <div className="truncate text-xs text-zinc-400">{member.group || "Solo"}</div>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <div className="text-lg font-extrabold text-cyan-300">{fmt(member.temperature_index)}</div>
                        <div className="text-[11px] text-zinc-400">V2 溫度</div>
                      </div>
                    </div>
                    <div className="mb-2 h-2 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-sky-400 to-violet-400" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="flex items-center justify-between text-xs text-zinc-400">
                      <div className="flex items-center gap-2">
                        <span>社群覆蓋 {fmt(member.social_activity, 0)}</span>
                        <span className={status.cls}>● {status.text}</span>
                        {member.data_confidence != null ? <span>可信度 {fmt(member.data_confidence * 100, 0)}%</span> : null}
                      </div>
                      <SocialLinks instagram={member.instagram} twitter={member.twitter} facebook={member.facebook} threads={member.threads} />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        <section className="mt-6">
          <div className="surface-panel p-5 md:p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">Solo 焦點</h2>
                <p className="mt-1 text-sm text-zinc-400">獨立活動成員會集中顯示在這裡，並同樣套用 90 天更新篩選。</p>
              </div>
              <span className="rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1 text-xs text-violet-200">Solo</span>
            </div>
            {solos.length > 0 ? (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                {solos.map((group) => {
                  const pct = clamp((group.temperature_index / maxSolo) * 100);
                  const dc = dotColor(group);
                  return (
                    <Link
                      key={`solo-${group.group}`}
                      href={`/members/${encodeURIComponent(group.display_name)}`}
                      className="surface-card block p-4 transition-colors hover:border-violet-400/30 hover:bg-white/10"
                    >
                      <div className="mb-3 flex items-center gap-3">
                        {group.photo_url ? (
                          <Image src={group.photo_url} alt={group.display_name} width={44} height={44} className="h-11 w-11 rounded-2xl object-cover ring-1 ring-white/10" unoptimized />
                        ) : (
                          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-sm font-bold">{getInitial(group.display_name)}</div>
                        )}
                        <div className="h-4 w-4 flex-shrink-0 rounded-full border border-white/20" style={{ backgroundColor: dc }} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="truncate text-base font-semibold text-white">{group.display_name}</span>
                            <span className="rounded-full border border-violet-400/30 bg-violet-500/20 px-2 py-0.5 text-[10px] text-violet-300">Solo</span>
                          </div>
                          <div className="truncate text-xs text-zinc-400">近 {Math.round(group.days_since_update ?? 365)} 天內有更新</div>
                        </div>
                        <div className="flex-shrink-0 text-right">
                          <div className="text-lg font-extrabold text-violet-300">{fmt(group.temperature_index)}</div>
                          <div className="text-[11px] text-zinc-400">V2 溫度</div>
                        </div>
                      </div>
                      <div className="mb-2 h-2 overflow-hidden rounded-full bg-white/10">
                        <div className="h-full rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-400 to-pink-400" style={{ width: `${pct}%` }} />
                      </div>
                      <div className="flex items-center justify-between text-xs text-zinc-400">
                        <span>社群覆蓋 {fmt(group.social_activity, 0)}</span>
                        <SocialLinks instagram={group.instagram} twitter={group.twitter} facebook={group.facebook} />
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-zinc-400">目前沒有符合 90 天內更新條件的 Solo 成員。</p>
            )}
          </div>
        </section>
      </div>

      <footer className="mx-auto mt-4 flex max-w-7xl items-center justify-between border-t border-white/5 px-4 py-6 text-xs text-zinc-500">
        <span>Idol Temperature Platform v3.8</span>
        <div className="flex items-center gap-4">
          <Link href="/forum" className="transition-colors hover:text-zinc-300">論壇</Link>
          <Link href="/agent" className="transition-colors hover:text-zinc-300">AI Agent</Link>
          <Link href="/events" className="transition-colors hover:text-zinc-300">活動</Link>
          <Link href="/pricing" className="transition-colors hover:text-zinc-300">方案</Link>
          <a href="https://www.facebook.com/profile.php?id=61573475755166" target="_blank" rel="noopener noreferrer" className="text-blue-400/70 transition-colors hover:text-blue-300">
            Facebook
          </a>
          <Link href="/about" className="transition-colors hover:text-zinc-300">About / 公式</Link>
        </div>
      </footer>
    </main>
  );
}
