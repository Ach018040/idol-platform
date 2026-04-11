"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

const SB_URL = "https://ziiagdrrytyrmzoeegjk.supabase.co";
const SB_KEY = "sb_publishable_PtKb4LIJeJN3cECUJllW7w_UFRVTbTv";
const SB_H = { apikey: SB_KEY, Accept: "application/json", "Accept-Profile": "public" };
const ICS_API = "/api/ical";

type Group = { rank: number; group: string; display_name: string; color: string; member_count: number; member_names: string; social_activity: number; temperature_index: number; conversion_score: number; instagram?: string; facebook?: string; twitter?: string; youtube?: string; is_solo?: boolean; };
type Member = { rank: number; id: string; name: string; group?: string; instagram?: string; facebook?: string; twitter?: string; photo_url?: string; maid_url?: string; updated_at?: string; social_activity: number; profile_completeness: number; freshness_score: number; group_affinity_score: number; temperature_index: number; conversion_score: number; platform_count: number; };
type CalEvent = { date: string; time: string; summary: string; dtRaw: Date; };
type Insights = { market_temperature: number; active_groups: number; weekly_highlights: { top_group: string; social_king: string }; rising_stars: string[]; events: CalEvent[]; };

function fmt(v: number | null | undefined, d = 1) { const n = Number(v ?? 0); return Number.isFinite(n) ? n.toFixed(d) : "—"; }
function getRankBadge(r: number) { return r === 1 ? "🥇" : r === 2 ? "🥈" : r === 3 ? "🥉" : `#${r}`; }
function getInitial(name: string) { return [...name][0] ?? "?"; }
function clamp(v: number) { return Math.max(0, Math.min(100, v)); }
function clamp1(v: number) { return +clamp(v).toFixed(1); }
function pickSocialKing(members: Member[]) {
  if (members.length === 0) return null;
  return members.reduce((best, current) => {
    if (current.social_activity !== best.social_activity) {
      return current.social_activity > best.social_activity ? current : best;
    }
    if (current.temperature_index !== best.temperature_index) {
      return current.temperature_index > best.temperature_index ? current : best;
    }
    if (current.freshness_score !== best.freshness_score) {
      return current.freshness_score > best.freshness_score ? current : best;
    }
    return current.rank < best.rank ? current : best;
  }, members[0]);
}
function hashColor(name: string) { let h = 0x811c9dc5; for (let i = 0; i < name.length; i++) { h = (Math.imul(h ^ name.charCodeAt(i), 0x01000193)) >>> 0; } return `hsl(${h % 360},${55 + (h >> 8) % 30}%,${45 + (h >> 16) % 20}%)`; }
function dotColor(g: Group) { const c = g.color || "#888888"; return c !== "#e879a0" && c !== "#888888" && c !== "#ffffff" ? c : hashColor(g.display_name || g.group); }

async function sbFetch(path: string, params: Record<string, string>) {
  const url = new URL(`${SB_URL}/rest/v1/${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const r = await fetch(url.toString(), { headers: SB_H, cache: "no-store" });
  if (!r.ok) throw new Error(`Supabase ${path} ${r.status}`);
  return r.json();
}

async function loadData() {
  const [members, groups, history] = await Promise.all([
    sbFetch("members", { select: "id,name,color,birthdate,instagram,facebook,x,photo_url,maid_url,updated_at,created_at", order: "updated_at.desc", limit: "500" }),
    sbFetch("groups", { select: "id,name,color,instagram,facebook,x,youtube", order: "name.asc", limit: "300" }),
    sbFetch("history", { select: "member_id,group_id,joined_at,left_at,status,role", order: "joined_at.desc", limit: "2000" }),
  ]);

  const SOLO: Record<string, boolean> = {
    "9617d305-12b6-434c-99e9-a31ba8d04f24": true,
    "bb1bba00-446c-4d16-a761-ef8a7794eab6": true,
  };

  const gMap: Record<string, { name: string; color: string; instagram?: string; facebook?: string; x?: string; youtube?: string }> = {};
  groups.forEach((g: { id: string; name: string; color: string; instagram?: string; facebook?: string; x?: string; youtube?: string }) => { gMap[g.id] = g; });

  const mgMap: Record<string, typeof gMap[string]> = {};
  history.forEach((h: { member_id: string; group_id: string }) => {
    if (!mgMap[h.member_id] && h.group_id) mgMap[h.member_id] = gMap[h.group_id] || {};
  });

  const now = Date.now();

  const memberData: Member[] = members.map((m: { id: string; name: string; color?: string; instagram?: string; facebook?: string; x?: string; photo_url?: string; maid_url?: string; updated_at?: string; created_at?: string }) => {
    const hasIG = (m.instagram || "").startsWith("http");
    const hasFB = (m.facebook || "").startsWith("http");
    const hasX  = (m.x || "").startsWith("http");
    const platformCount = +hasIG + +hasFB + +hasX;

    const hasPhoto   = (m.photo_url || "").startsWith("http");
    const hasProfile = Boolean(m.id);

    const updatedAt = m.updated_at ? new Date(m.updated_at).getTime() : 0;
    const daysSinceUpdate = updatedAt ? (now - updatedAt) / 86400000 : 365;
    const freshnessScore = clamp1(20 * Math.exp(-daysSinceUpdate / 60));
    const socialPresence = clamp1(+hasIG * 14 + +hasX * 12 + +hasFB * 8 + Math.max(0, platformCount - 1) * 3);
    const profileCompleteness = clamp1(+hasPhoto * 14 + +hasProfile * 6);

    const g = SOLO[m.id] ? {} : (mgMap[m.id] || {});
    const groupAffinityScore = (g as { name?: string }).name ? 6 : 0;
    const rawTotal = socialPresence + profileCompleteness + freshnessScore + groupAffinityScore;
    const ti = clamp1(rawTotal * (100 / 86));

    return {
      rank: 0, id: m.id, name: m.name || "",
      group: (g as { name?: string }).name || "",
      instagram: hasIG ? m.instagram! : "",
      facebook: hasFB ? m.facebook! : "",
      twitter: hasX ? m.x! : "",
      photo_url: hasPhoto ? m.photo_url! : "",
      maid_url: (m.maid_url || "").startsWith("http") ? m.maid_url! : "",
      updated_at: m.updated_at || "",
      social_activity: socialPresence,
      profile_completeness: profileCompleteness,
      freshness_score: freshnessScore,
      group_affinity_score: groupAffinityScore,
      temperature_index: ti,
      conversion_score: clamp1(ti * 0.6),
      platform_count: platformCount,
    };
  }).sort((a: Member, b: Member) => b.temperature_index - a.temperature_index)
    .map((m: Member, i: number) => ({ ...m, rank: i + 1 }));

  const grpMbrs: Record<string, Member[]> = {};
  memberData.forEach((m: Member) => { if (m.group) grpMbrs[m.group] = (grpMbrs[m.group] || []).concat(m); });

  const groupData: Group[] = groups.filter((g: { name: string }) => g.name).map((g: { name: string; color: string; instagram?: string; facebook?: string; x?: string; youtube?: string }) => {
    const mb = grpMbrs[g.name] || [];
    const cnt = mb.length;
    const memberAverage = cnt ? mb.reduce((s: number, m: Member) => s + m.temperature_index, 0) / cnt : 0;
    const memberDepth = cnt ? Math.min(12, 4 * Math.log2(cnt + 1)) : 0;
    const socialCoverage = clamp1(
      +((g.instagram || "").startsWith("http")) * 9 +
      +((g.x || "").startsWith("http")) * 7 +
      +((g.facebook || "").startsWith("http")) * 5 +
      +((g.youtube || "").startsWith("http")) * 7
    );
    const sa = cnt ? +(mb.reduce((s: number, m: Member) => s + m.social_activity, 0) / cnt).toFixed(1) : 0;
    const ti = clamp1(memberAverage * 0.58 + memberDepth + socialCoverage);
    return {
      rank: 0, group: g.name, display_name: g.name, color: g.color || "#888888",
      member_count: cnt, member_names: mb.slice(0, 6).map((m: Member) => m.name).join(" / "),
      social_activity: sa, temperature_index: ti, conversion_score: clamp1(ti * 0.6),
      instagram: g.instagram || "", facebook: g.facebook || "", twitter: g.x || "", youtube: g.youtube || "",
    };
  });

  memberData.forEach((m: Member) => {
    if (!m.group) groupData.push({ rank: 0, group: m.name, display_name: m.name, color: "#888888", member_count: 1, member_names: m.name, social_activity: m.social_activity, temperature_index: m.temperature_index, conversion_score: m.conversion_score, instagram: m.instagram, is_solo: true });
  });

  groupData.sort((a: Group, b: Group) => {
    if ((a.member_count === 0 && !a.is_solo) !== (b.member_count === 0 && !b.is_solo)) return (a.member_count === 0 && !a.is_solo) ? 1 : -1;
    return b.temperature_index - a.temperature_index;
  });
  groupData.forEach((g: Group, i: number) => { g.rank = i + 1; });

  const scored = memberData.filter((m: Member) => m.temperature_index > 0);
  const mktTemp = scored.length ? +(scored.reduce((s: number, m: Member) => s + m.temperature_index, 0) / scored.length).toFixed(1) : 0;
  const topGrp = groupData.find((g: Group) => g.member_count > 0 || g.is_solo)?.display_name || "—";
  const socialKing = pickSocialKing(memberData);
  const rising = memberData.filter((m: Member) => m.instagram && m.photo_url && m.rank > 50).slice(0, 5).map((m: Member) => m.name);

  let events: CalEvent[] = [];
  try {
    const icalJson = await fetch(ICS_API).then(res => res.json());
    events = (icalJson.events || []).map((e: { date: string; time: string; summary: string }) => ({ ...e, dtRaw: new Date() }));
  } catch (_) { events = []; }

  const insights: Insights = {
    market_temperature: mktTemp,
    active_groups: groupData.filter((g: Group) => g.member_count > 0 || g.is_solo).length,
    weekly_highlights: { top_group: topGrp, social_king: socialKing?.name || "—" },
    rising_stars: rising,
    events,
  };

  return { memberData, groupData, insights };
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
      const d = await loadData();
      setData(d);
      setLastUpdated(new Date());
      setError(null);
    } catch (e) {
      setError(String(e));
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
    } catch (_) {}
  }, []);

  const fmt_dt = (d: Date) => new Intl.DateTimeFormat("zh-TW", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Taipei" }).format(d);

  if (loading && !data) return (
    <main className="min-h-screen bg-[#070b14] text-white flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="text-4xl animate-spin">⚙️</div>
        <p className="text-zinc-300 text-lg">從資料庫載入最新資料中...</p>
      </div>
    </main>
  );

  if (error) return (
    <main className="min-h-screen bg-[#070b14] text-white flex items-center justify-center">
      <div className="text-center space-y-3">
        <p className="text-red-400">載入失敗：{error}</p>
        <button onClick={refresh} className="px-4 py-2 bg-pink-500 rounded-xl text-sm">重試</button>
      </div>
    </main>
  );

  const { memberData, groupData, insights } = data!;
  const groups = groupData.filter(g => g.member_count > 0 || g.is_solo).slice(0, 10);
  const members = memberData.slice(0, 10);
  const maxGS = Math.max(...groups.map(g => g.temperature_index), 1);
  const maxMS = Math.max(...members.map(m => m.temperature_index), 1);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.22),_transparent_30%),linear-gradient(180deg,_#070b14_0%,_#111827_100%)] text-white">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 lg:px-8">
        <header className="mb-8 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl md:p-8">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center rounded-full border border-fuchsia-400/30 bg-fuchsia-400/10 px-3 py-1 text-xs text-fuchsia-200">Idol Temperature Platform v3.7</div>
              <h1 className="text-3xl font-black text-white md:text-5xl">台灣地下偶像<span className="block bg-gradient-to-r from-pink-400 via-violet-300 to-cyan-300 bg-clip-text text-transparent">數據情報平台</span></h1>
              <p className="mt-3 text-sm text-zinc-300">整合團體排行、成員熱度、社群活躍與市場趨勢的地下偶像數據平台。</p>
            </div>
            <div className="flex flex-col gap-2 items-end">
              <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-100">
                <div className="flex items-center gap-3 text-xs text-cyan-300/80 uppercase tracking-widest mb-1">
                  <span>Last Update</span>
                  {visitCount !== null && <span className="text-zinc-400 normal-case tracking-normal">👁 {visitCount.toLocaleString()} 次</span>}
                </div>
                <div className="font-semibold">{lastUpdated ? fmt_dt(lastUpdated) : "—"}</div>
              </div>
              <button onClick={refresh} disabled={loading} className="rounded-xl border border-pink-400/20 bg-pink-400/10 px-4 py-2 text-xs text-pink-200 hover:bg-pink-400/20 transition-colors disabled:opacity-50">
                {loading ? "更新中..." : "⟳ 立即更新"}
              </button>
              <a href="/forum" className="rounded-xl border border-violet-400/20 bg-violet-400/10 px-4 py-2 text-xs text-violet-200 hover:bg-violet-400/20 transition-colors text-center">
                💬 討論區
              </a>
            </div>
          </div>
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "市場平均溫度", value: fmt(insights.market_temperature), cls: "pink" },
              { label: "活躍單位數", value: String(insights.active_groups), cls: "cyan" },
              { label: "本週戰神", value: insights.weekly_highlights.top_group, cls: "amber" },
              { label: "社群之王", value: insights.weekly_highlights.social_king, cls: "violet" },
            ].map(({ label, value, cls }) => (
              <div key={label} className={`rounded-2xl border border-${cls}-400/20 bg-gradient-to-br from-${cls}-500/15 to-${cls}-500/5 p-5`}>
                <div className={`text-xs uppercase tracking-widest text-${cls}-200/80`}>{label}</div>
                <div className={`mt-2 text-3xl font-extrabold text-${cls}-300 line-clamp-2`}>{value}</div>
              </div>
            ))}
          </section>
        </header>

        <section className="mb-8 grid grid-cols-1 gap-4 xl:grid-cols-3">
          <div className="rounded-3xl border border-emerald-400/20 bg-emerald-500/10 p-5 backdrop-blur-xl">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold text-emerald-200">Rising Stars</h2>
              <span className="text-xs text-emerald-300/70 border border-emerald-300/20 rounded-full px-2 py-0.5">近期上升</span>
            </div>
            {insights.rising_stars.length > 0 ? (
              <div className="flex flex-wrap gap-2">{insights.rising_stars.map(s => <span key={s} className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-sm text-emerald-100">{s}</span>)}</div>
            ) : <p className="text-sm text-zinc-400">目前沒有上升名單。</p>}
          </div>
          <div className="rounded-3xl border border-amber-400/20 bg-amber-500/10 p-5 backdrop-blur-xl">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold text-amber-200"><a href="/events" className="hover:text-amber-300 transition-colors">近期活動 ↗</a></h2>
              <span className="text-xs text-amber-300/70 border border-amber-300/20 rounded-full px-2 py-0.5">未來 60 天</span>
            </div>
            {insights.events && insights.events.length > 0 ? (
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {insights.events.slice(0, 15).map((ev, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <span className="flex-shrink-0 text-amber-300 font-medium w-20">{ev.date}</span>
                    <span className="flex-shrink-0 text-zinc-500 w-10">{ev.time}</span>
                    <span className="text-zinc-200 truncate">{ev.summary}</span>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-zinc-400">載入活動中...</p>}
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">AI Market Snapshot</h2>
              <span className="text-xs text-zinc-400 border border-white/10 rounded-full px-2 py-0.5">auto insight</span>
            </div>
            <div className="space-y-2 text-sm text-zinc-300">
              <p>市場平均溫度 <span className="font-bold text-pink-300">{fmt(insights.market_temperature)}</span>，近期整體活躍。</p>
              <p>本週焦點 <span className="font-semibold text-amber-300">{insights.weekly_highlights.top_group}</span>，社群領先 <span className="font-semibold text-violet-300">{insights.weekly_highlights.social_king}</span>。</p>
              <p>追蹤 <span className="font-semibold text-cyan-300">{insights.active_groups}</span> 個活躍單位（含 Solo）。</p>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl md:p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">團體排行 Top 10</h2>
                <p className="mt-1 text-sm text-zinc-400">依成員社群活躍度加權計算</p>
              </div>
              <span className="rounded-full border border-pink-400/20 bg-pink-400/10 px-3 py-1 text-xs text-pink-200">Groups</span>
            </div>
            <div className="space-y-3">
              {groups.map(g => {
                const pct = clamp((g.temperature_index / maxGS) * 100);
                const dc = dotColor(g);
                return (
                  <Link key={`${g.rank}-${g.group}`} href={`/groups/${encodeURIComponent(g.display_name)}`} className="block rounded-2xl border border-white/10 bg-black/20 p-4 hover:border-pink-400/30 hover:bg-white/10 transition-colors">
                    <div className="mb-3 flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-sm font-bold">{getRankBadge(g.rank)}</div>
                      <div className="h-4 w-4 flex-shrink-0 rounded-full border border-white/20" style={{ backgroundColor: dc }} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-base font-semibold text-white">{g.display_name}</span>
                          {g.is_solo && <span className="flex-shrink-0 rounded-full bg-violet-500/20 border border-violet-400/30 px-2 py-0.5 text-[10px] text-violet-300">Solo</span>}
                        </div>
                        <div className="truncate text-xs text-zinc-400">{g.member_count} 人{g.member_names ? ` · ${g.member_names.split(" / ").slice(0, 4).join(" / ")}` : ""}</div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-lg font-extrabold text-pink-300">{fmt(g.temperature_index)}</div>
                        <div className="text-[11px] text-zinc-400">溫度指數</div>
                      </div>
                    </div>
                    <div className="mb-2 h-2 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full rounded-full bg-gradient-to-r from-pink-500 via-fuchsia-400 to-violet-400" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="flex items-center justify-between text-xs text-zinc-400">
                      <span>社群活躍度 {fmt(g.social_activity, 0)}</span>
                      <div className="flex items-center gap-2">
                        {g.instagram && <button type="button" onClick={e=>{e.stopPropagation();window.open(g.instagram,"_blank")}} className="text-pink-400 hover:text-pink-300 font-bold text-xs">IG</button>}
                        {g.twitter && <button type="button" onClick={e=>{e.stopPropagation();window.open(g.twitter,"_blank")}} className="text-sky-400 hover:text-sky-300 font-bold text-xs">𝕏</button>}
                        {g.facebook && <button type="button" onClick={e=>{e.stopPropagation();window.open(g.facebook,"_blank")}} className="text-blue-400 hover:text-blue-300 font-bold text-xs">FB</button>}
                        {g.youtube && <button type="button" onClick={e=>{e.stopPropagation();window.open(g.youtube,"_blank")}} className="text-red-400 hover:text-red-300 font-bold text-xs">YT</button>}
                        {!g.instagram && !g.twitter && !g.facebook && !g.youtube && <span>轉換 {fmt(g.conversion_score, 0)}</span>}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl md:p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">成員排行 Top 10</h2>
                <p className="mt-1 text-sm text-zinc-400">依溫度指數排序</p>
              </div>
              <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-200">Members</span>
            </div>
            <div className="space-y-3">
              {members.map(m => {
                const pct = clamp((m.temperature_index / maxMS) * 100);
                return (
                  <Link key={`${m.rank}-${m.name}`} href={`/members/${encodeURIComponent(m.name)}`} className="block rounded-2xl border border-white/10 bg-black/20 p-4 hover:border-cyan-400/30 hover:bg-white/10 transition-colors">
                    <div className="mb-3 flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-sm font-bold">{getRankBadge(m.rank)}</div>
                      {m.photo_url ? (
                        <Image src={m.photo_url} alt={m.name} width={44} height={44} className="h-11 w-11 rounded-2xl object-cover ring-1 ring-white/10" unoptimized />
                      ) : (
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/30 to-violet-500/30 text-sm font-bold">{getInitial(m.name)}</div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-base font-semibold text-white">{m.name}</div>
                        <div className="truncate text-xs text-zinc-400">{m.group || "—"}</div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-lg font-extrabold text-cyan-300">{fmt(m.temperature_index)}</div>
                        <div className="text-[11px] text-zinc-400">溫度指數</div>
                      </div>
                    </div>
                    <div className="mb-2 h-2 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-sky-400 to-violet-400" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="flex items-center justify-between text-xs text-zinc-400">
                      <div className="flex items-center gap-2">
                        <span>社群 {fmt(m.social_activity, 0)}</span>
                        {m.freshness_score > 20 && <span className="text-emerald-400">● 活躍</span>}
                        {m.freshness_score > 0 && m.freshness_score <= 20 && <span className="text-yellow-500">● 近期</span>}
                        {m.freshness_score === 0 && <span className="text-zinc-600">● 久未更新</span>}
                      </div>
                      <div className="flex gap-2">
                        {m.instagram && <button type="button" onClick={e=>{e.stopPropagation();window.open(m.instagram,"_blank")}} className="text-pink-400 hover:text-pink-300 font-bold text-xs">IG</button>}
                        {m.twitter && <button type="button" onClick={e=>{e.stopPropagation();window.open(m.twitter,"_blank")}} className="text-sky-400 hover:text-sky-300 font-bold text-xs">𝕏</button>}
                        {m.facebook && <button type="button" onClick={e=>{e.stopPropagation();window.open(m.facebook,"_blank")}} className="text-blue-400 hover:text-blue-300 font-bold text-xs">FB</button>}
                        {!m.instagram && !m.twitter && !m.facebook && <span className="text-zinc-600">無社群</span>}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      </div>

      <footer className="mx-auto max-w-7xl px-4 py-6 mt-4 border-t border-white/5 flex items-center justify-between text-xs text-zinc-500">
        <span>台灣地下偶像數據情報平台 v3.7</span>
        <div className="flex items-center gap-4">
          <a href="/forum" className="hover:text-zinc-300 transition-colors">💬 討論區</a>
          <a href="/events" className="hover:text-zinc-300 transition-colors">📅 活動</a>
          <a href="/pricing" className="hover:text-zinc-300 transition-colors">方案</a>
          <a href="https://www.facebook.com/profile.php?id=61573475755166" target="_blank" rel="noopener noreferrer" className="hover:text-blue-300 text-blue-400/70 transition-colors">📘 Facebook</a>
          <a href="/about" className="hover:text-zinc-300 transition-colors">關於 / 隱私政策</a>
        </div>
      </footer>
    </main>
  );
}
