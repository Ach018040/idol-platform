import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

type Group = {
  rank?: number;
  entity_name?: string;
  member_count?: number;
  social_activity?: number;
  v7_index?: number;
  trend_label?: string;
};

type Member = {
  rank?: number;
  name?: string;
  group?: string;
  social_activity?: number;
  temperature_index?: number;
  photo_url?: string;
};

type Insights = {
  generated_at?: string;
  market_temperature?: number;
  active_groups?: number;
  weekly_highlights?: {
    top_group?: string;
    social_king?: string;
  };
  rising_stars?: string[];
  heat_drop?: string[];
};

function loadJSON<T>(filename: string, fallback: T): T {
  try {
    const filePath = path.join(process.cwd(), "public", "data", filename);
    if (!fs.existsSync(filePath)) return fallback;
    return JSON.parse(fs.readFileSync(filePath, "utf-8")) as T;
  } catch {
    return fallback;
  }
}

function formatNumber(value: unknown, digits = 1): string {
  const n = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(n) ? n.toFixed(digits) : (0).toFixed(digits);
}

function formatInteger(value: unknown): string {
  const n = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(n) ? String(Math.round(n)) : "0";
}

function text(value: unknown, fallback = "—"): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function getInitial(name: unknown): string {
  return typeof name === "string" && name.trim() ? [...name.trim()][0] ?? "?" : "?";
}

export default function HomePage() {
  const groups = loadJSON<Group[]>("v7_rankings.json", []).slice(0, 10);
  const members = loadJSON<Member[]>("member_rankings.json", []).slice(0, 10);
  const insights = loadJSON<Insights>("insights.json", {
    generated_at: "",
    market_temperature: 0,
    active_groups: 0,
    weekly_highlights: {
      top_group: "",
      social_king: "",
    },
    rising_stars: [],
    heat_drop: [],
  });

  const risingStars = Array.isArray(insights.rising_stars) ? insights.rising_stars : [];
  const heatDrop = Array.isArray(insights.heat_drop) ? insights.heat_drop : [];

  const statCards = [
    { label: "市場平均溫度", value: formatNumber(insights.market_temperature, 1) },
    { label: "活躍團體數", value: formatInteger(insights.active_groups) },
    { label: "本週戰神", value: text(insights.weekly_highlights?.top_group, "暫無資料") },
    { label: "社群之王", value: text(insights.weekly_highlights?.social_king, "暫無資料") },
  ];

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8 rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl">
          <div className="mb-3 inline-flex rounded-full border border-pink-400/30 bg-pink-500/10 px-3 py-1 text-sm text-pink-300">
            V3.7 Dashboard
          </div>
          <h1 className="text-4xl font-bold tracking-tight">✦ Idol Temperature Platform</h1>
          <p className="mt-3 text-neutral-300">
            台灣地下偶像市場即時監測 · 更新於 {text(insights.generated_at, "未提供")}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {statCards.map((card) => (
            <div key={card.label} className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="text-sm text-neutral-400">{card.label}</div>
              <div className="mt-2 text-3xl font-semibold">{card.value}</div>
            </div>
          ))}
        </div>

        {(risingStars.length > 0 || heatDrop.length > 0) && (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="text-xs uppercase tracking-widest text-neutral-500">Rising Star</div>
              <div className="mt-2 text-cyan-300">
                {risingStars.length ? risingStars.join(" · ") : "暫無資料"}
              </div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="text-xs uppercase tracking-widest text-neutral-500">Heat Drop</div>
              <div className="mt-2 text-amber-300">
                {heatDrop.length ? heatDrop.join(" · ") : "暫無資料"}
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
          <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="mb-4 text-2xl font-semibold">團體排行 Top 10</h2>
            <div className="space-y-3">
              {groups.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 p-6 text-neutral-400">
                  尚無團體排行資料
                </div>
              ) : (
                groups.map((g, idx) => (
                  <div
                    key={`${g.entity_name ?? "group"}-${idx}`}
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 p-4"
                  >
                    <div>
                      <div className="text-sm text-neutral-400">#{formatInteger(g.rank ?? idx + 1)}</div>
                      <div className="mt-1 text-lg font-medium">{text(g.entity_name)}</div>
                      <div className="mt-1 text-sm text-neutral-400">
                        成員數 {formatInteger(g.member_count)} ・ 社群活躍 {formatInteger(g.social_activity)}
                        {g.trend_label ? ` ・ ${g.trend_label}` : ""}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs uppercase tracking-widest text-neutral-500">V7 Index</div>
                      <div className="mt-1 text-2xl font-semibold text-pink-300">
                        {formatNumber(g.v7_index, 1)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="mb-4 text-2xl font-semibold">成員排行 Top 10</h2>
            <div className="space-y-3">
              {members.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 p-5 text-neutral-400">
                  尚無成員排行資料
                </div>
              ) : (
                members.map((m, idx) => (
                  <div
                    key={`${m.name ?? "member"}-${idx}`}
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-sm font-semibold">
                        {getInitial(m.name)}
                      </div>
                      <div>
                        <div className="text-sm text-neutral-400">#{formatInteger(m.rank ?? idx + 1)}</div>
                        <div className="mt-1 text-lg font-medium">{text(m.name)}</div>
                        <div className="mt-1 text-sm text-neutral-400">
                          {text(m.group)} ・ 社群活躍 {formatInteger(m.social_activity)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs uppercase tracking-widest text-neutral-500">Temperature</div>
                      <div className="mt-1 text-2xl font-semibold text-cyan-300">
                        {formatNumber(m.temperature_index, 1)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
