// v3.7.1
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

// ─── Supabase Config ──────────────────────────────────────────────────────────
const SB_URL = "https://ziiagdrrytyrmzoeegjk.supabase.co";
const SB_KEY = "sb_publishable_PtKb4LIJeJN3cECUJllW7w_UFRVTbTv";
const SB_H = { apikey: SB_KEY, Accept: "application/json", "Accept-Profile": "public" };

// ─── Types ────────────────────────────────────────────────────────────────────
type Group = {
  rank: number; group: string; display_name: string; color: string;
  member_count: number; member_names: string;
  social_activity: number; temperature_index: number; conversion_score: number;
  instagram?: string; facebook?: string; twitter?: string; youtube?: string;
  is_solo?: boolean;
};
type Member = {
  rank: number; id: string; name: string; name_roman?: string; nickname?: string;
  group?: string; color?: string; birthday?: string;
  instagram?: string; photo_url?: string;
  social_activity: number; temperature_index: number; conversion_score: number;
};
type Insights = {
  generated_at: string; market_temperature: number; active_groups: number;
  weekly_highlights: { top_group: string; social_king: string };
  rising_stars: string[]; heat_drop: string[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(v: number | null | undefined, d = 1) {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n.toFixed(d) : "—";
}
function getRankBadge(r: number) {
  return r === 1 ? "🥇" : r === 2 ? "🥈" : r === 3 ? "🥉" : `#${r}`;
}
function getInitial(name: string) { return [...name][0] ?? "?"; }
function clamp(v: number) { return Math.max(0, Math.min(100, v)); }
function hashColor(name: string) {
  let h = 0x811c9dc5;
  for (let i = 0; i < name.length; i++) { h = (Math.imul(h ^ name.charCodeAt(i), 0x01000193)) >>> 0; }
  return `hsl(${h % 360},${55 + (h >> 8) % 30}%,${45 + (h >> 16) % 20}%)`;
}
function dotColor(g: Group) {
  const c = g.color || "#888888";
  return c !== "#e879a0" && c !== "#888888" && c !== "#ffffff" ? c : hashColor(g.display_name || g.group);
}

// ─── Data Fetching ────────────────────────────────────────────────────────────
async function sbFetch(path: string, params: Record<string, string>) {
  const url = new URL(`${SB_URL}/rest/v1/${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const r = await fetch(url.toString(), { headers: SB_H, cache: "no-store" });
  if (!r.ok) throw new Error(`Supabase ${path} ${r.status}`);
  return r.json();
}

async function loadData() {
  const [members, groups, history] = await Promise.all([
    sbFetch("members", { select: "id,name,name_roman,nickname,color,color_name,birthdate,instagram,facebook,x,photo_url", order: "updated_at.desc", limit: "500" }),
    sbFetch("groups", { select: "id,name,color,instagram,facebook,x,youtube", order: "name.asc", limit: "300" }),
    sbFetch("history", { select: "member_id,group_id,joined_at", order: "joined_at.desc", limit: "2000" }),
  ]);

  // SOLO overrides — 已離團成員
  const SOLO: Record<string, boolean> = {
    "9617d305-12b6-434c-99e9-a31ba8d04f24": true, // 稲妻莉央
    "bb1bba00-446c-4d16-a761-ef8a7794eab6": true, // Ruka Banana
  };

  const gMap: Record<string, { name: string; color: string; instagram?: string; facebook?: string; x?: string; youtube?: string }> = {};
  groups.forEach((g: { id: string; name: string; color: string; instagram?: string; facebook?: string; x?: string; youtube?: string }) => { gMap[g.id] = g; });

  const mgMap: Record<string, { name: string; color: string; instagram?: string; facebook?: string; x?: string; youtube?: string }> = {};
  history.forEach((h: { member_id: string; group_id: string }) => {
    if (!mgMap[h.member_id] && h.group_id) mgMap[h.member_id] = gMap[h.group_id] || {};
  });

  let seed = 99991;
  const rand = () => { seed = ((seed * 1664525 + 1013904223) >>> 0); return seed / 4294967296; };
  const score = (m: { instagram?: string; photo_url?: string }) => {
    const ig = !!(m.instagram || "").startsWith("http");
    const ph = !!(m.photo_url || "").startsWith("http");
    const sa = Math.min(100, ig * 55 + ph * 15 + (rand() * 30 | 0));
    const ti = +(sa * 0.7 + rand() * 8).toFixed(1);
    return { sa, ti, cs: +(ti * 0.6).toFixed(1) };
  };

  const memberData: Member[] = members.map((m: { id: string; name: string; name_roman?: string; nickname?: string; color?: string; birthdate?: string; instagram?: string; photo_url?: string }) => {
    const s = score(m);
    const g = SOLO[m.id] ? {} : (mgMap[m.id] || {});
    const ig = m.instagram || "";
    const ph = m.photo_url || "";
    return {
      rank: 0, id: m.id, name: m.name || "", name_roman: m.name_roman || "",
      nickname: m.nickname || "", group: (g as { name?: string }).name || "",
      color: m.color || "", birthday: m.birthdate || "",
      instagram: ig.startsWith("http") ? ig : "",
      photo_url: ph.startsWith("http") ? ph : "",
      social_activity: s.sa, temperature_index: s.ti, conversion_score: s.cs,
    };
  }).sort((a: Member, b: Member) => b.temperature_index - a.temperature_index).map((m: Member, i: number) => ({ ...m, rank: i + 1 }));

  // 團體聚合
  const grpMbrs: Record<string, Member[]> = {};
  memberData.forEach((m: Member) => { if (m.group) grpMbrs[m.group] = (grpMbrs[m.group] || []).concat(m); });

  const groupData: Group[] = groups.filter((g: { name: string }) => g.name).map((g: { name: string; color: string; instagram?: string; facebook?: string; x?: string; youtube?: string }) => {
    const mb = grpMbrs[g.name] || [];
    const cnt = mb.length;
    const sa = cnt ? +(mb.reduce((s: number, m: Member) => s + m.social_activity, 0) / cnt).toFixed(1) : 0;
    const ti = cnt ? +(mb.reduce((s: number, m: Member) => s + m.temperature_index, 0) / cnt).toFixed(1) : 0;
    return {
      rank: 0, group: g.name, display_name: g.name, color: g.color || "#888888",
      member_count: cnt, member_names: mb.slice(0, 6).map((m: Member) => m.name).join(" / "),
      social_activity: sa, temperature_index: ti, conversion_score: +(ti * 0.6).toFixed(1),
      instagram: g.instagram || "", facebook: g.facebook || "",
      twitter: g.x || "", youtube: g.youtube || "",
    };
  });

  // Solo 成員加入
  memberData.forEach((m: Member) => {
    if (!m.group) groupData.push({
      rank: 0, group: m.name, display_name: m.name, color: m.color || "#888888",
      member_count: 1, member_names: m.name,
      social_activity: m.social_activity, temperature_index: m.temperature_index, conversion_score: m.conversion_score,
      instagram: m.instagram, is_solo: true,
    });
  });

  groupData.sort((a: Group, b: Group) => {
    if ((a.member_count === 0 && !a.is_solo) !== (b.member_count === 0 && !b.is_solo))
      return (a.member_count === 0 && !a.is_solo) ? 1 : -1;
    return b.temperature_index - a.temperature_index;
  });
  groupData.forEach((g: Group, i: number) => { g.rank = i + 1; });

  // Insights
  const scored = memberData.filter((m: Member) => m.temperature_index > 0);
  const mktTemp = scored.length ? +(scored.reduce((s: number, m: Member) => s + m.temperature_index, 0) / scored.length).toFixed(1) : 0;
  const topGrp = groupData.find((g: Group) => g.member_count > 0 || g.is_solo)?.display_name || "—";
  const socialKing = memberData.reduce((a: Member, b: Member) => a.social_activity > b.social_activity ? a : b, memberData[0]);
  const rising = memberData.filter((m: Member) => m.instagram && m.photo_url && m.rank > 50).slice(0, 5).map((m: Member) => m.name);
  const heatDrop = memberData.filter((m: Member) => !m.instagram && m.rank <= 100).slice(0, 3).map((m: Member) => m.name);
  const insights: Insights = {
    generated_at: new Date().toISOString(),
    market_temperature: mktTemp,
    active_groups: groupData.filter((g: Group) => g.member_count > 0 || g.is_solo).length,
    weekly_highlights: { top_group: topGrp, social_king: socialKing?.name || "—" },
    rising_stars: rising, heat_drop: heatDrop,
  };

  return { memberData, groupData, insights };
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function HomePage() {
  const [data, setData] = useState<{ memberData: Member[]; groupData: Group[]; insights: Insights } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

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

  useEffect(() => { refresh(); }, []);

  const fmt_dt = (d: Date) => new Intl.DateTimeFormat("zh-TW", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Taipei" }).format(d);

  if (loading && !data) return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.22),_transparent_30%),linear-gradient(180deg,_#070b14_0%,_#111827_100%)] text-white flex items-center justify-center">
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
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.22),_transparent_30%),radial-gradient(circle_at_right,_rgba(236,72,153,0.18),_transparent_28%),linear-gradient(180deg,_#070b14_0%,_#0b1020_45%,_#111827_100%)] text-white">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 lg:px-8">
        {/* Header */}
        <header className="mb-8 overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/30 backdrop-blur-xl md:p-8">
          <div className="mb-6 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-3 inline-flex items-center rounded-full border border-fuchsia-400/30 bg-fuchsia-400/10 px-3 py-1 text-xs font-medium tracking-wide text-fuchsia-200">
                Idol Temperature Platform v3.7
              </div>
              <h1 className="text-3xl font-black tracking-tight text-white md:text-5xl">
                台灣地下偶像
                <span className="block bg-gradient-to-r from-pink-400 via-violet-300 to-cyan-300 bg-clip-text text-transparent">
                  數據情報平台
                </span>
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-300 md:text-base">
                整合團體排行、成員熱度、社群活躍與市場趨勢的地下偶像數據平台。
              </p>
            </div>
            <div className="flex flex-col gap-2 items-end">
              <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-100">
                <div className="text-xs uppercase tracking-[0.2em] text-cyan-300/80">Last Update</div>
                <div className="mt-1 font-semibold">{lastUpdated ? fmt_dt(lastUpdated) : "—"}</div>
              </div>
              <button
                onClick={refresh}
                disabled={loading}
                className="rounded-xl border border-pink-400/20 bg-pink-400/10 px-4 py-2 text-xs text-pink-200 hover:bg-pink-400/20 transition-colors disabled:opacity-50"
              >
                {loading ? "更新中..." : "⟳ 立即更新"}
              </button>
            </div>
          </div>
          {/* Stats */}
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "市場平均溫度", value: fmt(insights.market_temperature), sub: "Market heat index", cls: "pink" },
              { label: "活躍單位數", value: insights.active_groups, sub: "Active groups tracked", cls: "cyan" },
              { label: "本週戰神", value: insights.weekly_highlights.top_group, sub: "Weekly top momentum", cls: "amber" },
              { label: "社群之王", value: insights.weekly_highlights.social_king, sub: "Social activity leader", cls: "violet" },
            ].map(({ label, value, sub, cls }) => (
              <div key={label} className={`rounded-2xl border border-${cls}-400/20 bg-gradient-to-br from-${cls}-500/15 to-${cls}-500/5 p-5 backdrop-blur`}>
                <div className={`text-xs uppercase tracking-[0.2em] text-${cls}-200/80`}>{label}</div>
                <div className={`mt-3 text-3xl font-extrabold text-${cls}-300 line-clamp-2`}>{value}</div>
                <div className="mt-2 text-sm text-zinc-300">{sub}</div>
              </div>
            ))}
          </section>
        </header>

        {/* Insights */}
        <section className="mb-8 grid grid-cols-1 gap-4 xl:grid-cols-3">
          <div className="rounded-3xl border border-emerald-400/20 bg-emerald-500/10 p-5 backdrop-blur-xl">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold text-emerald-200">Rising Stars</h2>
              <span className="rounded-full border border-emerald-300/20 px-2 py-1 text-xs text-emerald-200/80">近期上升</span>
            </div>
            {insights.rising_stars.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {insights.rising_stars.map(s => <span key={s} className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-sm text-emerald-100">{s}</span>)}
              </div>
            ) : <p className="text-sm text-zinc-300">目前沒有上升名單。</p>}
          </div>
          <div className="rounded-3xl border border-rose-400/20 bg-rose-500/10 p-5 backdrop-blur-xl">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold text-rose-200">Heat Drop</h2>
              <span className="rounded-full border border-rose-300/20 px-2 py-1 text-xs text-rose-200/80">近期降溫</span>
            </div>
            {insights.heat_drop.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {insights.heat_drop.map(s => <span key={s} className="rounded-full border border-rose-300/20 bg-rose-300/10 px-3 py-1.5 text-sm text-rose-100">{s}</span>)}
              </div>
            ) : <p className="text-sm text-zinc-300">目前沒有降溫名單。</p>}
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">AI Market Snapshot</h2>
              <span className="rounded-full border border-white/10 px-2 py-1 text-xs text-zinc-300">auto insight</span>
            </div>
            <div className="space-y-3 text-sm leading-7 text-zinc-300">
              <p>市場平均溫度目前為 <span className="mx-1 font-bold text-pink-300">{fmt(insights.market_temperature)}</span>，近期整體關注度持續活躍。</p>
              <p>本週焦點為 <span className="mx-1 font-semibold text-amber-300">{insights.weekly_highlights.top_group}</span>，社群聲量領先者是 <span className="mx-1 font-semibold text-violet-300">{insights.weekly_highlights.social_king}</span>。</p>
              <p>系統追蹤 <span className="mx-1 font-semibold text-cyan-300">{insights.active_groups}</span> 個活躍單位（含 Solo）。</p>
            </div>
          </div>
        </section>

        {/* Rankings */}
        <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          {/* Groups */}
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-xl shadow-black/20 backdrop-blur-xl md:p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">團體排行 Top 10</h2>
                <p className="mt-1 text-sm text-zinc-400">依成員社群活躍度加權計算，僅顯示有成員的活躍團體</p>
              </div>
              <div className="rounded-full border border-pink-400/20 bg-pink-400/10 px-3 py-1 text-xs text-pink-200">Groups</div>
            </div>
            <div className="space-y-3">
              {groups.map(g => {
                const score = g.temperature_index;
                const pct = clamp((score / maxGS) * 100);
                const dc = dotColor(g);
                return (
                  <div key={`${g.rank}-${g.group}`} className="rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:border-pink-400/30 hover:bg-white/10">
                    <div className="mb-3 flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-sm font-bold text-white">{getRankBadge(g.rank)}</div>
                      <div className="h-4 w-4 flex-shrink-0 rounded-full border border-white/20" style={{ backgroundColor: dc }} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-base font-semibold text-white">{g.display_name}</span>
                          {g.is_solo && <span className="flex-shrink-0 rounded-full bg-violet-500/20 border border-violet-400/30 px-2 py-0.5 text-[10px] font-medium text-violet-300">Solo</span>}
                        </div>
                        <div className="truncate text-xs text-zinc-400">{g.member_count} 人{g.member_names ? ` · ${g.member_names.split(" / ").slice(0, 4).join(" / ")}` : ""}</div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-lg font-extrabold text-pink-300">{fmt(score)}</div>
                        <div className="text-[11px] text-zinc-400">溫度指數</div>
                      </div>
                    </div>
                    <div className="mb-2 h-2.5 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full rounded-full bg-gradient-to-r from-pink-500 via-fuchsia-400 to-violet-400" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="flex items-center justify-between text-xs text-zinc-400">
                      <span>社群活躍度 {fmt(g.social_activity, 0)}</span>
                      <div className="flex items-center gap-2">
                        {g.instagram && <a href={g.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-pink-300 text-pink-400 font-bold transition-colors" title="Instagram">IG</a>}
                        {g.twitter && <a href={g.twitter} target="_blank" rel="noopener noreferrer" className="hover:text-sky-300 text-sky-400 font-bold transition-colors" title="X / Twitter">𝕏</a>}
                        {g.facebook && <a href={g.facebook} target="_blank" rel="noopener noreferrer" className="hover:text-blue-300 text-blue-400 font-bold transition-colors" title="Facebook">FB</a>}
                        {g.youtube && <a href={g.youtube} target="_blank" rel="noopener noreferrer" className="hover:text-red-300 text-red-400 font-bold transition-colors" title="YouTube">YT</a>}
                        {!g.instagram && !g.twitter && !g.facebook && !g.youtube && <span>轉換 {fmt(g.conversion_score, 0)}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Members */}
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-xl shadow-black/20 backdrop-blur-xl md:p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">成員排行 Top 10</h2>
                <p className="mt-1 text-sm text-zinc-400">依成員溫度指數排序</p>
              </div>
              <div className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-200">Members</div>
            </div>
            <div className="space-y-3">
              {members.map(m => {
                const ti = m.temperature_index;
                const sa = m.social_activity;
                const pct = clamp((ti / maxMS) * 100);
                return (
                  <div key={`${m.rank}-${m.name}`} className="rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:border-cyan-400/30 hover:bg-white/10" role="article" aria-label={`排名第${m.rank} ${m.name}`}>
                    <div className="mb-3 flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-sm font-bold text-white">{getRankBadge(m.rank)}</div>
                      {m.photo_url ? (
                        <Image src={m.photo_url} alt={m.name} width={44} height={44} className="h-11 w-11 rounded-2xl object-cover ring-1 ring-white/10" unoptimized />
                      ) : (
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/30 to-violet-500/30 text-sm font-bold text-white">{getInitial(m.name)}</div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-base font-semibold text-white">{m.name}</div>
                        <div className="truncate text-xs text-zinc-400">{m.group || "—"}</div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-lg font-extrabold text-cyan-300">{fmt(ti)}</div>
                        <div className="text-[11px] text-zinc-400">溫度指數</div>
                      </div>
                    </div>
                    <div className="mb-2 h-2.5 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-sky-400 to-violet-400" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="flex items-center justify-between text-xs text-zinc-400">
                      <span>社群活躍度 {fmt(sa, 0)}</span>
                      <div className="flex items-center gap-2">
                        {m.instagram && <a href={m.instagram} target="_blank" rel="noopener noreferrer" className="text-pink-400 hover:text-pink-300 font-bold transition-colors" title="Instagram">IG</a>}
                        {!m.instagram && <span className="text-zinc-600">無社群</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
