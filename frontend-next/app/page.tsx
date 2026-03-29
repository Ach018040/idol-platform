// frontend-next/app/page.tsx
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

// ── Types ──────────────────────────────────────────────────────────
type Group = {
  rank?: number;
  entity_name?: string;
  color?: string;
  member_count?: number;
  social_activity?: number;
  temperature_index?: number;
  v7_index?: number;
};

type Member = {
  rank?: number;
  name?: string;
  nickname?: string;
  group?: string;
  photo_url?: string;
  instagram?: string;
  social_activity?: number;
  temperature_index?: number;
};

type Insights = {
  generated_at?: string;
  market_temperature?: number;
  active_groups?: number;
  weekly_highlights?: {
    top_group?: string;
    social_king?: string;
    market_temperature?: number;
  };
  rising_stars?: string[];
  heat_drop?: string[];
};

// ── Utils ──────────────────────────────────────────────────────────
function loadJSON<T>(filename: string, fallback: T): T {
  try {
    const p = path.join(process.cwd(), "public", "data", filename);
    if (!fs.existsSync(p)) return fallback;
    return JSON.parse(fs.readFileSync(p, "utf-8")) as T;
  } catch (error) {
    console.error(`Failed to load ${filename}:`, error);
    return fallback;
  }
}

function formatNumber(value: unknown, digits = 1, fallback = "0.0"): string {
  if (typeof value !== "number" || Number.isNaN(value)) return fallback;
  return value.toFixed(digits);
}

function formatInteger(value: unknown, fallback = "0"): string {
  if (typeof value !== "number" || Number.isNaN(value)) return fallback;
  return String(Math.round(value));
}

function safeText(value: unknown, fallback = "—"): string {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

function safeArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v) => typeof v === "string" && v.trim()) : [];
}

function getInitial(name: unknown): string {
  if (typeof name !== "string" || !name.trim()) return "?";
  return [...name.trim()][0] ?? "?";
}

function getRankColor(rank: unknown): string {
  if (rank === 1) return "#f5c518";
  if (rank === 2) return "#c0c0c0";
  if (rank === 3) return "#cd7f32";
  return "#bdbdbd";
}

// ── Page ───────────────────────────────────────────────────────────
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
      market_temperature: 0,
    },
    rising_stars: [],
    heat_drop: [],
  });

  const risingStars = safeArray(insights.rising_stars);
  const heatDrop = safeArray(insights.heat_drop);

  const statCards = [
    {
      label: "市場平均溫度",
      value: formatNumber(insights.market_temperature, 1, "0.0"),
      color: "#ff4d8d",
    },
    {
      label: "活躍團體數",
      value: formatInteger(insights.active_groups, "0"),
      color: "#00d4c8",
    },
    {
      label: "本週戰神",
      value: safeText(insights.weekly_highlights?.top_group, "暫無資料"),
      color: "#ffbe0b",
    },
    {
      label: "社群之王",
      value: safeText(insights.weekly_highlights?.social_king, "暫無資料"),
      color: "#9b5de5",
    },
  ];

  return (
    <main
      style={{
        maxWidth: 1280,
        margin: "0 auto",
        padding: "32px 24px 60px",
        fontFamily:
          'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        background: "#f7f8fc",
        minHeight: "100vh",
        color: "#111827",
      }}
    >
      {/* Hero */}
      <header
        style={{
          marginBottom: 32,
          padding: "28px 28px 24px",
          borderRadius: 24,
          background:
            "linear-gradient(135deg, rgba(255,77,141,0.12) 0%, rgba(155,93,229,0.12) 45%, rgba(0,212,200,0.12) 100%)",
          border: "1px solid rgba(17,24,39,0.06)",
          boxShadow: "0 12px 32px rgba(17,24,39,0.06)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 20,
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: 1.2,
                color: "#9b5de5",
                marginBottom: 10,
              }}
            >
              V3.5 STABLE DASHBOARD
            </div>
            <h1 style={{ fontSize: 34, fontWeight: 800, margin: 0, marginBottom: 8 }}>
              ✦ Idol Temperature Platform
            </h1>
            <p style={{ color: "#4b5563", fontSize: 14, margin: 0 }}>
              台灣地下偶像市場即時監測 · 更新於 {safeText(insights.generated_at, "未提供")}
            </p>
          </div>

          <div
            style={{
              minWidth: 220,
              padding: "14px 16px",
              borderRadius: 18,
              background: "#ffffff",
              border: "1px solid #e5e7eb",
            }}
          >
            <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 6 }}>系統狀態</div>
            <div style={{ fontWeight: 700, fontSize: 16, color: "#111827" }}>
              JSON Static Mode
            </div>
            <div style={{ fontSize: 12, color: "#6b7280", marginTop: 6 }}>
              已加入 null / undefined 防呆顯示
            </div>
          </div>
        </div>

        {/* Stat cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 16,
            marginTop: 24,
          }}
        >
          {statCards.map((s) => (
            <div
              key={s.label}
              style={{
                background: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: 18,
                padding: "18px 20px",
                borderTop: `4px solid ${s.color}`,
                boxShadow: "0 8px 24px rgba(17,24,39,0.04)",
              }}
            >
              <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 8 }}>{s.label}</div>
              <div
                style={{
                  fontSize: 26,
                  fontWeight: 800,
                  color: s.color,
                  lineHeight: 1.2,
                  wordBreak: "break-word",
                }}
              >
                {s.value}
              </div>
            </div>
          ))}
        </div>
      </header>

      {/* Insights strip */}
      {(risingStars.length > 0 || heatDrop.length > 0) && (
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 16,
            marginBottom: 32,
          }}
        >
          {risingStars.length > 0 && (
            <div
              style={{
                background: "rgba(0,212,200,0.08)",
                border: "1px solid rgba(0,212,200,0.25)",
                borderRadius: 18,
                padding: "16px 18px",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: "#00a99d",
                  fontWeight: 800,
                  letterSpacing: 1,
                  marginBottom: 8,
                }}
              >
                🌱 RISING STAR
              </div>
              <div style={{ fontSize: 14, color: "#0f172a", lineHeight: 1.6 }}>
                {risingStars.join(" · ")}
              </div>
            </div>
          )}

          {heatDrop.length > 0 && (
            <div
              style={{
                background: "rgba(255,77,141,0.08)",
                border: "1px solid rgba(255,77,141,0.25)",
                borderRadius: 18,
                padding: "16px 18px",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: "#ff4d8d",
                  fontWeight: 800,
                  letterSpacing: 1,
                  marginBottom: 8,
                }}
              >
                📉 HEAT DROP
              </div>
              <div style={{ fontSize: 14, color: "#0f172a", lineHeight: 1.6 }}>
                {heatDrop.join(" · ")}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Main grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
          gap: 24,
        }}
      >
        {/* Group Top 10 */}
        <section
          style={{
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 22,
            padding: 22,
            boxShadow: "0 10px 28px rgba(17,24,39,0.04)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
              gap: 12,
            }}
          >
            <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>團體排行 Top 10</h2>
            <span
              style={{
                fontSize: 12,
                color: "#6b7280",
                background: "#f3f4f6",
                borderRadius: 999,
                padding: "6px 10px",
              }}
            >
              V7 Index
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {groups.length === 0 ? (
              <div
                style={{
                  padding: "20px 16px",
                  borderRadius: 16,
                  background: "#f9fafb",
                  color: "#6b7280",
                  fontSize: 14,
                }}
              >
                尚無團體排行資料
              </div>
            ) : (
              groups.map((g, idx) => (
                <div
                  key={`${safeText(g.entity_name, "group")}-${idx}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    background: "#fff",
                    border: "1px solid #eef2f7",
                    borderRadius: 16,
                    padding: "14px 16px",
                  }}
                >
                  <span
                    style={{
                      fontSize: 18,
                      fontWeight: 800,
                      width: 28,
                      color: getRankColor(g.rank),
                      textAlign: "center",
                      flexShrink: 0,
                    }}
                  >
                    {formatInteger(g.rank, String(idx + 1))}
                  </span>

                  <span
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: "50%",
                      background: safeText(g.color, "#888"),
                      flexShrink: 0,
                    }}
                  />

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: 14,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {safeText(g.entity_name)}
                    </div>
                    <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
                      成員數 {formatInteger(g.member_count)} ・ 社群活躍{" "}
                      {formatInteger(g.social_activity)}
                    </div>
                  </div>

                  <span
                    style={{
                      fontWeight: 800,
                      color: "#ff4d8d",
                      fontSize: 16,
                      minWidth: 46,
                      textAlign: "right",
                      flexShrink: 0,
                    }}
                  >
                    {formatNumber(g.v7_index, 1, "0.0")}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Member Top 10 */}
        <section
          style={{
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 22,
            padding: 22,
            boxShadow: "0 10px 28px rgba(17,24,39,0.04)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
              gap: 12,
            }}
          >
            <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>成員排行 Top 10</h2>
            <span
              style={{
                fontSize: 12,
                color: "#6b7280",
                background: "#f3f4f6",
                borderRadius: 999,
                padding: "6px 10px",
              }}
            >
              Temperature
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {members.length === 0 ? (
              <div
                style={{
                  padding: "20px 16px",
                  borderRadius: 16,
                  background: "#f9fafb",
                  color: "#6b7280",
                  fontSize: 14,
                }}
              >
                尚無成員排行資料
              </div>
            ) : (
              members.map((m, idx) => (
                <div
                  key={`${safeText(m.name, "member")}-${idx}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    background: "#fff",
                    border: "1px solid #eef2f7",
                    borderRadius: 16,
                    padding: "14px 16px",
                  }}
                >
                  <span
                    style={{
                      fontSize: 18,
                      fontWeight: 800,
                      width: 28,
                      color: getRankColor(m.rank),
                      textAlign: "center",
                      flexShrink: 0,
                    }}
                  >
                    {formatInteger(m.rank, String(idx + 1))}
                  </span>

                  {safeText(m.photo_url, "") !== "" ? (
                    <img
                      src={safeText(m.photo_url, "")}
                      alt={safeText(m.name)}
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: "50%",
                        objectFit: "cover",
                        flexShrink: 0,
                        border: "1px solid #e5e7eb",
                      }}
                    />
                  ) : (
                    <span
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: "50%",
                        background: "#f3f4f6",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 14,
                        fontWeight: 700,
                        color: "#4b5563",
                        flexShrink: 0,
                      }}
                    >
                      {getInitial(m.name)}
                    </span>
                  )}

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: 14,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {safeText(m.name)}
                    </div>
                    <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
                      {safeText(m.group)} ・ 社群活躍 {formatInteger(m.social_activity)}
                    </div>
                  </div>

                  <span
                    style={{
                      fontWeight: 800,
                      color: "#9b5de5",
                      fontSize: 16,
                      minWidth: 46,
                      textAlign: "right",
                      flexShrink: 0,
                    }}
                  >
                    {formatNumber(m.temperature_index, 1, "0.0")}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
