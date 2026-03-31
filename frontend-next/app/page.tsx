import fs from "fs";
import path from "path";

// ─── Types（對應實際 JSON 欄位）─────────────────────────────────────────────

type Group = {
  rank: number;
  group: string;           // 團體 id / color code
  display_name?: string;   // 顯示名稱
  color?: string;
  member_count?: number;
  member_names?: string;
  social_activity?: number | null;
  conversion_score?: number | null;
  temperature_index?: number | null;
  v7_index?: number | null;
};

type Member = {
  rank: number;
  name: string;
  nickname?: string;
  group?: string;
  photo_url?: string;
  instagram?: string;
  social_activity?: number | null;
  temperature_index?: number | null;
};

type Insights = {
  generated_at: string;
  market_temperature?: number | null;
  active_groups?: number;
  weekly_highlights?: {
    top_group?: string;
    social_king?: string;
    market_temperature?: number | null;
  };
  rising_stars?: string[];
  heat_drop?: string[];
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function loadJSON<T>(filename: string): T {
  const filePath = path.join(process.cwd(), "public", "data", filename);
  return JSON.parse(fs.readFileSync(filePath, "utf-8")) as T;
}

/** 安全 toFixed：null / undefined / NaN 全部顯示 "—" */
function fmt(val: number | null | undefined, decimals = 1): string {
  const n = Number(val ?? 0);
  return Number.isFinite(n) ? n.toFixed(decimals) : "—";
}

function formatDateTime(input: string): string {
  if (!input) return "—";
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return input;
  return new Intl.DateTimeFormat("zh-TW", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Taipei",
  }).format(date);
}

function getRankBadge(rank: number): string {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return `#${rank}`;
}

function getInitial(name: string): string {
  if (!name) return "?";
  return [...name][0] ?? "?";
}

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

/** 團體顯示名稱：優先用 display_name，其次 group */
function groupLabel(g: Group): string {
  return g.display_name || g.group || "—";
}

/** 團體主要分數：優先 temperature_index，其次 v7_index */
function groupScore(g: Group): number {
  return Number(g.temperature_index ?? g.v7_index ?? 0);
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const groups  = loadJSON<Group[]>("v7_rankings.json")
    .filter((g: Group) => (g.member_count ?? 0) > 0).slice(0, 10);
  const members = loadJSON<Member[]>("member_rankings.json").slice(0, 10);
  const insights = loadJSON<Insights>("insights.json");

  const maxGroupScore  = Math.max(...groups.map(groupScore), 1);
  const maxMemberScore = Math.max(...members.map((m) => Number(m.temperature_index ?? 0)), 1);

  const mktTemp    = Number(insights.market_temperature ?? 0);
  const activeGrps = insights.active_groups ?? 0;
  const topGroup   = insights.weekly_highlights?.top_group   || "—";
  const socialKing = insights.weekly_highlights?.social_king || "—";
  const risingStars = insights.rising_stars ?? [];
  const heatDrop    = insights.heat_drop    ?? [];

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.22),_transparent_30%),radial-gradient(circle_at_right,_rgba(236,72,153,0.18),_transparent_28%),linear-gradient(180deg,_#070b14_0%,_#0b1020_45%,_#111827_100%)] text-white">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 lg:px-8">

        {/* ── Header ─────────────────────────────────────────────────────── */}
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
            <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-100">
              <div className="text-xs uppercase tracking-[0.2em] text-cyan-300/80">Last Update</div>
              <div className="mt-1 font-semibold">{formatDateTime(insights.generated_at)}</div>
            </div>
          </div>

          {/* Stats */}
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-pink-400/20 bg-gradient-to-br from-pink-500/15 to-pink-500/5 p-5 backdrop-blur">
              <div className="text-xs uppercase tracking-[0.2em] text-pink-200/80">市場平均溫度</div>
              <div className="mt-3 text-3xl font-extrabold text-pink-300">{fmt(mktTemp)}</div>
              <div className="mt-2 text-sm text-zinc-300">Market heat index</div>
            </div>
            <div className="rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-cyan-500/15 to-cyan-500/5 p-5 backdrop-blur">
              <div className="text-xs uppercase tracking-[0.2em] text-cyan-200/80">活躍團體數</div>
              <div className="mt-3 text-3xl font-extrabold text-cyan-300">{activeGrps}</div>
              <div className="mt-2 text-sm text-zinc-300">Active groups tracked</div>
            </div>
            <div className="rounded-2xl border border-amber-400/20 bg-gradient-to-br from-amber-500/15 to-amber-500/5 p-5 backdrop-blur">
              <div className="text-xs uppercase tracking-[0.2em] text-amber-200/80">本週戰神</div>
              <div className="mt-3 line-clamp-2 text-2xl font-extrabold text-amber-300">{topGroup}</div>
              <div className="mt-2 text-sm text-zinc-300">Weekly top momentum</div>
            </div>
            <div className="rounded-2xl border border-violet-400/20 bg-gradient-to-br from-violet-500/15 to-violet-500/5 p-5 backdrop-blur">
              <div className="text-xs uppercase tracking-[0.2em] text-violet-200/80">社群之王</div>
              <div className="mt-3 line-clamp-2 text-2xl font-extrabold text-violet-300">{socialKing}</div>
              <div className="mt-2 text-sm text-zinc-300">Social activity leader</div>
            </div>
          </section>
        </header>

        {/* ── Insights ───────────────────────────────────────────────────── */}
        <section className="mb-8 grid grid-cols-1 gap-4 xl:grid-cols-3">
          <div className="rounded-3xl border border-emerald-400/20 bg-emerald-500/10 p-5 backdrop-blur-xl xl:col-span-1">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold text-emerald-200">Rising Stars</h2>
              <span className="rounded-full border border-emerald-300/20 px-2 py-1 text-xs text-emerald-200/80">近期上升</span>
            </div>
            {risingStars.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {risingStars.map((item) => (
                  <span key={item} className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-sm text-emerald-100">{item}</span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-zinc-300">目前沒有上升名單。</p>
            )}
          </div>

          <div className="rounded-3xl border border-rose-400/20 bg-rose-500/10 p-5 backdrop-blur-xl xl:col-span-1">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold text-rose-200">Heat Drop</h2>
              <span className="rounded-full border border-rose-300/20 px-2 py-1 text-xs text-rose-200/80">近期降溫</span>
            </div>
            {heatDrop.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {heatDrop.map((item) => (
                  <span key={item} className="rounded-full border border-rose-300/20 bg-rose-300/10 px-3 py-1.5 text-sm text-rose-100">{item}</span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-zinc-300">目前沒有降溫名單。</p>
            )}
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl xl:col-span-1">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">AI Market Snapshot</h2>
              <span className="rounded-full border border-white/10 px-2 py-1 text-xs text-zinc-300">auto insight</span>
            </div>
            <div className="space-y-3 text-sm leading-7 text-zinc-300">
              <p>市場平均溫度目前為 <span className="mx-1 font-bold text-pink-300">{fmt(mktTemp)}</span>，顯示近期整體關注度仍維持在可觀區間。</p>
              <p>本週焦點團體為 <span className="mx-1 font-semibold text-amber-300">{topGroup}</span>，社群聲量領先者則是 <span className="mx-1 font-semibold text-violet-300">{socialKing}</span>。</p>
              <p>目前系統追蹤 <span className="mx-1 font-semibold text-cyan-300">{activeGrps}</span> 個活躍團體，可作為後續粉絲熱度、團體強度與市場波動觀察基礎。</p>
            </div>
          </div>
        </section>

        {/* ── Rankings ───────────────────────────────────────────────────── */}
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
              {groups.map((group) => {
                const score   = groupScore(group);
                const percent = clampPercent((score / maxGroupScore) * 100);
                const sa      = Number(group.social_activity ?? 0);
                const label   = groupLabel(group);
                // 用 group.color，預設粉/白/灰 則用名稱 FNV hash 生成唯一色
                const rawCol = group.color || "#888888";
                const isDefault = rawCol === "#e879a0" || rawCol === "#888888" || rawCol === "#ffffff";
                const dotColor = !isDefault ? rawCol : (() => {
                  let h = 0x811c9dc5;
                  const name = group.display_name || group.group || "";
                  for (let i = 0; i < name.length; i++) { h = Math.imul(h ^ name.charCodeAt(i), 0x01000193) >>> 0; }
                  return `hsl(${h % 360},${55 + (h >> 8) % 30}%,${45 + (h >> 16) % 20}%)`;
                })()
                return (
                  <div key={`${group.rank}-${group.group}`}
                    className="rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:border-pink-400/30 hover:bg-white/10">
                    <div className="mb-3 flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-sm font-bold text-white">
                        {getRankBadge(group.rank)}
                      </div>
                      <div className="h-4 w-4 flex-shrink-0 rounded-full border border-white/20"
                        style={{ backgroundColor: dotColor }} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                    <span className="truncate text-base font-semibold text-white">{label}</span>
                    {(group as any).is_solo && (
                      <span className="flex-shrink-0 rounded-full bg-violet-500/20 border border-violet-400/30 px-2 py-0.5 text-[10px] font-medium text-violet-300">Solo</span>
                    )}
                  </div>
                        <div className="truncate text-xs text-zinc-400">
                          {group.member_count ?? "—"} 人
                          {group.member_names ? ` · ${group.member_names.split(" / ").slice(0, 4).join(" / ")}`  : ""}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-lg font-extrabold text-pink-300">{fmt(score)}</div>
                        <div className="text-[11px] text-zinc-400">溫度指數</div>
                      </div>
                    </div>
                    <div className="mb-2 h-2.5 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full rounded-full bg-gradient-to-r from-pink-500 via-fuchsia-400 to-violet-400"
                        style={{ width: `${percent}%` }} />
                    </div>
                    <div className="flex items-center justify-between text-xs text-zinc-400">
                      <span>社群活躍度 {fmt(sa, 0)}</span>
                      <span>轉換 {fmt(group.conversion_score, 0)}</span>
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
              {members.map((member) => {
                const ti      = Number(member.temperature_index ?? 0);
                const sa      = Number(member.social_activity   ?? 0);
                const percent = clampPercent((ti / maxMemberScore) * 100);
                return (
                  <div key={`${member.rank}-${member.name}`}
                    className="rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:border-cyan-400/30 hover:bg-white/10">
                    <div className="mb-3 flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-sm font-bold text-white">
                        {getRankBadge(member.rank)}
                      </div>
                      {member.photo_url ? (
                        <img src={member.photo_url} alt={member.name}
                          className="h-11 w-11 rounded-2xl object-cover ring-1 ring-white/10" />
                      ) : (
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/30 to-violet-500/30 text-sm font-bold text-white">
                          {getInitial(member.name)}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-base font-semibold text-white">{member.name}</div>
                        <div className="truncate text-xs text-zinc-400">{member.group || "—"}</div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-lg font-extrabold text-cyan-300">{fmt(ti)}</div>
                        <div className="text-[11px] text-zinc-400">溫度指數</div>
                      </div>
                    </div>
                    <div className="mb-2 h-2.5 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-sky-400 to-violet-400"
                        style={{ width: `${percent}%` }} />
                    </div>
                    <div className="flex items-center justify-between text-xs text-zinc-400">
                      <span>社群活躍度 {fmt(sa, 0)}</span>
                      <span>{member.instagram ? "✦ Instagram" : "無社群連結"}</span>
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
