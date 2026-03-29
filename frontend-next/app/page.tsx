// frontend-next/app/page.tsx
// Next.js 15 App Router 首頁
// 讀取 public/data/*.json，直接做靜態生成（SSG）
// 不需要後端 API

import fs from "fs";
import path from "path";

// ── Types ──────────────────────────────────────────────────────────
type Group = {
  rank: number;
  entity_name: string;
  color: string;
  member_count: number;
  social_activity: number;
  temperature_index: number;
  v7_index: number;
};

type Member = {
  rank: number;
  name: string;
  nickname: string;
  group: string;
  photo_url: string;
  instagram: string;
  social_activity: number;
  temperature_index: number;
};

type Insights = {
  generated_at: string;
  market_temperature: number;
  active_groups: number;
  weekly_highlights: {
    top_group: string;
    social_king: string;
    market_temperature: number;
  };
  rising_stars: string[];
  heat_drop: string[];
};

// ── Data loader（只在 build time 執行）────────────────────────────
function loadJSON<T>(filename: string): T {
  const p = path.join(process.cwd(), "public", "data", filename);
  return JSON.parse(fs.readFileSync(p, "utf-8")) as T;
}

// ── Page ───────────────────────────────────────────────────────────
export default function HomePage() {
  const groups  = loadJSON<Group[]>("v7_rankings.json").slice(0, 10);
  const members = loadJSON<Member[]>("member_rankings.json").slice(0, 10);
  const insights = loadJSON<Insights>("insights.json");

  return (
    <main style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px", fontFamily: "sans-serif" }}>

      {/* Hero */}
      <header style={{ marginBottom: 40 }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 4 }}>
          ✦ Idol Temperature Platform
        </h1>
        <p style={{ color: "#666", fontSize: 14 }}>
          台灣地下偶像市場即時監測 · 更新於 {insights.generated_at}
        </p>

        {/* Stat cards */}
        <div style={{ display: "flex", gap: 16, marginTop: 24, flexWrap: "wrap" }}>
          {[
            { label: "市場平均溫度",   value: insights.market_temperature.toFixed(1), color: "#ff4d8d" },
            { label: "活躍團體數",     value: insights.active_groups,                  color: "#00d4c8" },
            { label: "本週戰神",       value: insights.weekly_highlights.top_group,    color: "#ffbe0b" },
            { label: "社群之王",       value: insights.weekly_highlights.social_king,  color: "#9b5de5" },
          ].map(s => (
            <div key={s.label} style={{
              background: "#fff", border: "1px solid #e5e7eb",
              borderRadius: 16, padding: "16px 20px",
              borderTop: `3px solid ${s.color}`, minWidth: 160, flex: 1,
            }}>
              <div style={{ fontSize: 11, color: "#999", marginBottom: 6 }}>{s.label}</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
      </header>

      {/* Insights strip */}
      {(insights.rising_stars.length > 0 || insights.heat_drop.length > 0) && (
        <section style={{ display: "flex", gap: 16, marginBottom: 40, flexWrap: "wrap" }}>
          {insights.rising_stars.length > 0 && (
            <div style={{ background: "rgba(0,212,200,0.08)", border: "1px solid rgba(0,212,200,0.3)", borderRadius: 12, padding: "12px 18px", flex: 1 }}>
              <span style={{ fontSize: 11, color: "#00d4c8", fontWeight: 700, letterSpacing: 1 }}>🌱 RISING STAR</span>
              <div style={{ marginTop: 6, fontSize: 14 }}>{insights.rising_stars.join(" · ")}</div>
            </div>
          )}
          {insights.heat_drop.length > 0 && (
            <div style={{ background: "rgba(255,77,141,0.08)", border: "1px solid rgba(255,77,141,0.3)", borderRadius: 12, padding: "12px 18px", flex: 1 }}>
              <span style={{ fontSize: 11, color: "#ff4d8d", fontWeight: 700, letterSpacing: 1 }}>📉 HEAT DROP</span>
              <div style={{ marginTop: 6, fontSize: 14 }}>{insights.heat_drop.join(" · ")}</div>
            </div>
          )}
        </section>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>

        {/* Group Top 10 */}
        <section>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>團體排行 Top 10</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {groups.map(g => (
              <div key={g.entity_name} style={{
                display: "flex", alignItems: "center", gap: 12,
                background: "#fff", border: "1px solid #e5e7eb",
                borderRadius: 14, padding: "12px 16px",
              }}>
                <span style={{ fontSize: 18, fontWeight: 700, width: 28, color: g.rank <= 3 ? "#f5c518" : "#ccc" }}>
                  {g.rank}
                </span>
                <span style={{ width: 12, height: 12, borderRadius: "50%", background: g.color || "#888", flexShrink: 0 }} />
                <span style={{ flex: 1, fontWeight: 600, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {g.entity_name}
                </span>
                <span style={{ fontSize: 13, color: "#999" }}>{g.member_count}人</span>
                <span style={{ fontWeight: 700, color: "#ff4d8d", fontSize: 16, minWidth: 36, textAlign: "right" }}>
                  {g.v7_index.toFixed(1)}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Member Top 10 */}
        <section>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>成員排行 Top 10</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {members.map(m => (
              <div key={m.rank} style={{
                display: "flex", alignItems: "center", gap: 12,
                background: "#fff", border: "1px solid #e5e7eb",
                borderRadius: 14, padding: "12px 16px",
              }}>
                <span style={{ fontSize: 18, fontWeight: 700, width: 28, color: m.rank <= 3 ? "#f5c518" : "#ccc" }}>
                  {m.rank}
                </span>
                {m.photo_url
                  ? <img src={m.photo_url} alt={m.name} style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                  : <span style={{ width: 36, height: 36, borderRadius: "50%", background: "#eee", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>
                      {[...m.name][0]}
                    </span>
                }
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name}</div>
                  <div style={{ fontSize: 11, color: "#999" }}>{m.group || "—"}</div>
                </div>
                <span style={{ fontWeight: 700, color: "#9b5de5", fontSize: 16, minWidth: 36, textAlign: "right" }}>
                  {m.temperature_index.toFixed(1)}
                </span>
              </div>
            ))}
          </div>
        </section>

      </div>
    </main>
  );
}
