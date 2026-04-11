"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const SB_URL = "https://ziiagdrrytyrmzoeegjk.supabase.co";
const SB_KEY = "sb_publishable_PtKb4LIJeJN3cECUJllW7w_UFRVTbTv";
const SB_HEADERS = {
  apikey: SB_KEY,
  Accept: "application/json",
  "Accept-Profile": "public",
};

type GroupRow = {
  id: string;
  name: string;
};

type MemberRow = {
  id: string;
  name: string;
  instagram?: string;
  facebook?: string;
  x?: string;
  photo_url?: string;
  maid_url?: string;
  updated_at?: string;
};

type HistoryRow = {
  member_id: string;
  group_id: string;
};

type RankedMember = {
  id: string;
  name: string;
  group: string;
  score: number;
  freshness: number;
};

type RankedGroup = {
  id: string;
  name: string;
  memberCount: number;
  score: number;
};

type HomeData = {
  marketTemperature: number;
  activeGroups: number;
  topGroup: string;
  topMember: string;
  topGroups: RankedGroup[];
  topMembers: RankedMember[];
};

function badge(rank: number) {
  if (rank === 1) return "01";
  if (rank === 2) return "02";
  if (rank === 3) return "03";
  return String(rank).padStart(2, "0");
}

function computeMemberScore(member: MemberRow) {
  const hasInstagram = (member.instagram || "").startsWith("http");
  const hasFacebook = (member.facebook || "").startsWith("http");
  const hasX = (member.x || "").startsWith("http");
  const hasPhoto = (member.photo_url || "").startsWith("http");
  const hasMaid = (member.maid_url || "").startsWith("http");
  const updatedAt = member.updated_at ? new Date(member.updated_at).getTime() : 0;
  const daysSinceUpdate = updatedAt ? (Date.now() - updatedAt) / 86400000 : 365;
  const freshness = Math.max(0, Math.round(30 * Math.exp(-daysSinceUpdate / 30)));
  const socialBase =
    (hasInstagram ? 18 : 0) +
    (hasFacebook ? 14 : 0) +
    (hasX ? 14 : 0) +
    (hasPhoto ? 16 : 0) +
    (hasMaid ? 8 : 0);
  const score = Math.min(100, Number((socialBase + freshness).toFixed(1)));

  return { score, freshness };
}

async function sbFetch<T>(path: string, params: Record<string, string>): Promise<T[]> {
  const url = new URL(`${SB_URL}/rest/v1/${path}`);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  const response = await fetch(url.toString(), {
    headers: SB_HEADERS,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`${path} 載入失敗 (${response.status})`);
  }

  return response.json();
}

async function loadHomeData(): Promise<HomeData> {
  const [members, groups, history] = await Promise.all([
    sbFetch<MemberRow>("members", {
      select: "id,name,instagram,facebook,x,photo_url,maid_url,updated_at",
      order: "updated_at.desc",
      limit: "500",
    }),
    sbFetch<GroupRow>("groups", {
      select: "id,name",
      order: "name.asc",
      limit: "300",
    }),
    sbFetch<HistoryRow>("history", {
      select: "member_id,group_id",
      order: "joined_at.desc",
      limit: "2000",
    }),
  ]);

  const groupMap = new Map(groups.map((group) => [group.id, group.name]));
  const memberGroup = new Map<string, string>();

  history.forEach((row) => {
    if (!memberGroup.has(row.member_id)) {
      memberGroup.set(row.member_id, groupMap.get(row.group_id) || "未分組");
    }
  });

  const rankedMembers = members
    .filter((member) => member.name)
    .map((member) => {
      const { score, freshness } = computeMemberScore(member);
      return {
        id: member.id,
        name: member.name,
        group: memberGroup.get(member.id) || "未分組",
        score,
        freshness,
      };
    })
    .sort((left, right) => right.score - left.score);

  const rankedGroups = groups
    .filter((group) => group.name)
    .map((group) => {
      const relatedMembers = rankedMembers.filter((member) => member.group === group.name);
      const averageScore = relatedMembers.length
        ? Number(
            (
              relatedMembers.reduce((sum, member) => sum + member.score, 0) /
              relatedMembers.length
            ).toFixed(1),
          )
        : 0;

      return {
        id: group.id,
        name: group.name,
        memberCount: relatedMembers.length,
        score: averageScore,
      };
    })
    .filter((group) => group.memberCount > 0)
    .sort((left, right) => right.score - left.score);

  const topMembers = rankedMembers.slice(0, 8);
  const topGroups = rankedGroups.slice(0, 8);
  const marketTemperature = topMembers.length
    ? Number((topMembers.reduce((sum, member) => sum + member.score, 0) / topMembers.length).toFixed(1))
    : 0;

  return {
    marketTemperature,
    activeGroups: rankedGroups.length,
    topGroup: topGroups[0]?.name || "尚無資料",
    topMember: topMembers[0]?.name || "尚無資料",
    topGroups,
    topMembers,
  };
}

export default function HomePage() {
  const [data, setData] = useState<HomeData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHomeData()
      .then((result) => {
        setData(result);
        setError(null);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "首頁資料暫時無法載入");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <main className="min-h-screen overflow-hidden bg-[#07111f] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_28%),radial-gradient(circle_at_80%_20%,rgba(244,114,182,0.18),transparent_22%),radial-gradient(circle_at_bottom,rgba(59,130,246,0.12),transparent_36%)]" />
      <div className="relative mx-auto max-w-7xl px-4 py-8 md:px-6 lg:px-8">
        <header className="rounded-[36px] border border-white/10 bg-white/5 px-6 py-6 shadow-[0_30px_120px_rgba(0,0,0,0.35)] backdrop-blur-xl md:px-8 md:py-8">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-4 inline-flex items-center rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-[11px] font-semibold tracking-[0.28em] text-cyan-100">
                IDOL PLATFORM
              </div>
              <h1 className="max-w-3xl text-4xl font-black leading-tight text-white md:text-6xl">
                用繁體中文追蹤
                <span className="block bg-gradient-to-r from-cyan-300 via-sky-200 to-pink-300 bg-clip-text text-transparent">
                  偶像團體熱度與成員動態
                </span>
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300 md:text-lg">
                這裡把團體、成員與社群公開資料整理成一個容易閱讀的首頁。
                你可以先看本週熱度，再進一步點進團體頁、成員頁、論壇與活動頁面。
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/rankings"
                  className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-5 py-3 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-300/20"
                >
                  查看排行
                </Link>
                <Link
                  href="/events"
                  className="rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
                >
                  近期活動
                </Link>
                <Link
                  href="/forum"
                  className="rounded-full border border-pink-300/25 bg-pink-300/10 px-5 py-3 text-sm font-semibold text-pink-100 transition hover:bg-pink-300/20"
                >
                  進入論壇
                </Link>
              </div>
            </div>

            <div className="grid min-w-full grid-cols-2 gap-3 sm:min-w-[340px]">
              <MetricCard label="市場熱度" value={data ? data.marketTemperature.toFixed(1) : "--"} />
              <MetricCard label="活躍團體" value={data ? String(data.activeGroups) : "--"} />
              <MetricCard label="本週團體" value={data ? data.topGroup : "--"} />
              <MetricCard label="焦點成員" value={data ? data.topMember : "--"} />
            </div>
          </div>
        </header>

        <section className="mt-8 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[32px] border border-white/10 bg-[#0b1628]/80 p-6 backdrop-blur-xl">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">首頁焦點</h2>
                <p className="mt-1 text-sm leading-6 text-slate-400">
                  先看整體熱度，再往下延伸到你想追的團體與成員。
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                {loading ? "資料載入中" : error ? "資料暫時無法更新" : "資料已成功更新"}
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <SpotlightCard
                title="快速看榜單"
                body="團體與成員的首頁排行榜會先提供一個高層次視角，適合快速掌握目前關注焦點。"
              />
              <SpotlightCard
                title="探索個別頁面"
                body="每筆排行都可以再點進詳細頁，往下追成員資料、分組狀態與相關內容。"
              />
              <SpotlightCard
                title="延伸到論壇與活動"
                body="如果你想看討論氛圍或行程資訊，論壇與活動頁面可以接著補完整個使用情境。"
              />
            </div>
          </div>

          <div className="rounded-[32px] border border-cyan-400/15 bg-cyan-400/10 p-6 backdrop-blur-xl">
            <h2 className="text-2xl font-bold text-white">使用方式</h2>
            <div className="mt-4 space-y-4 text-sm leading-7 text-cyan-50/90">
              <p>先從首頁看市場熱度與本週焦點，決定要追團體還是成員。</p>
              <p>如果你在意互動與內容深度，可以直接跳到論壇頁面看最新討論。</p>
              <p>若想安排追星行程，活動頁面會比首頁更適合當作下一步入口。</p>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <RankingPanel
            title="團體熱度排行"
            subtitle="以成員整體表現估算本週團體熱度"
            emptyMessage={error || "暫時沒有團體資料"}
            items={
              data?.topGroups.map((group, index) => ({
                key: group.id,
                href: `/groups/${encodeURIComponent(group.name)}`,
                rank: index + 1,
                title: group.name,
                meta: `${group.memberCount} 位成員`,
                value: group.score.toFixed(1),
              })) || []
            }
          />
          <RankingPanel
            title="成員熱度排行"
            subtitle="結合社群存在感與資料新鮮度"
            emptyMessage={error || "暫時沒有成員資料"}
            items={
              data?.topMembers.map((member, index) => ({
                key: member.id,
                href: `/members/${encodeURIComponent(member.name)}`,
                rank: index + 1,
                title: member.name,
                meta: `${member.group} · 新鮮度 ${member.freshness}`,
                value: member.score.toFixed(1),
              })) || []
            }
          />
        </section>
      </div>
    </main>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-slate-950/55 p-4">
      <div className="text-[11px] uppercase tracking-[0.24em] text-slate-400">{label}</div>
      <div className="mt-3 line-clamp-2 text-2xl font-bold leading-tight text-white">{value}</div>
    </div>
  );
}

function SpotlightCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-slate-300">{body}</p>
    </div>
  );
}

function RankingPanel({
  title,
  subtitle,
  items,
  emptyMessage,
}: {
  title: string;
  subtitle: string;
  items: Array<{
    key: string;
    href: string;
    rank: number;
    title: string;
    meta: string;
    value: string;
  }>;
  emptyMessage: string;
}) {
  return (
    <section className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
      <div className="mb-5">
        <h2 className="text-2xl font-bold text-white">{title}</h2>
        <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
      </div>
      {items.length === 0 ? (
        <div className="rounded-[24px] border border-white/10 bg-slate-950/40 p-5 text-sm text-slate-400">
          {emptyMessage}
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className="flex items-center gap-4 rounded-[24px] border border-white/10 bg-slate-950/45 p-4 transition hover:border-cyan-300/30 hover:bg-slate-900/75"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-300/10 text-sm font-bold text-cyan-100">
                {badge(item.rank)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-base font-semibold text-white">{item.title}</div>
                <div className="truncate text-sm text-slate-400">{item.meta}</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-cyan-300">{item.value}</div>
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500">score</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
