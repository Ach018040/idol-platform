import { NextResponse } from "next/server";

// GET /api/setup — 一次性建立 site_stats 表
// 需要 SUPABASE_SERVICE_KEY 環境變數
// 建立後可刪除此 route
export async function GET() {
  const SB_URL = "https://ziiagdrrytyrmzoeegjk.supabase.co";
  const SERVICE = process.env.SUPABASE_SERVICE_KEY;
  if (!SERVICE) return NextResponse.json({ error: "SUPABASE_SERVICE_KEY not set" }, { status: 400 });

  const sql = `
    CREATE TABLE IF NOT EXISTS site_stats (
      key text PRIMARY KEY,
      value bigint DEFAULT 0,
      updated_at timestamptz DEFAULT now()
    );
    INSERT INTO site_stats (key, value) VALUES ('total_visits', 0) ON CONFLICT (key) DO NOTHING;
    ALTER TABLE site_stats ENABLE ROW LEVEL SECURITY;
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='site_stats' AND policyname='Public read stats') THEN
        CREATE POLICY "Public read stats" ON site_stats FOR SELECT USING (true);
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='site_stats' AND policyname='Service write stats') THEN
        CREATE POLICY "Service write stats" ON site_stats FOR ALL USING (true) WITH CHECK (true);
      END IF;
    END $$;
    CREATE OR REPLACE FUNCTION increment_visit_count() RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER AS $f$
    DECLARE result bigint;
    BEGIN
      UPDATE site_stats SET value = value + 1, updated_at = now() WHERE key = 'total_visits' RETURNING value INTO result;
      IF result IS NULL THEN INSERT INTO site_stats (key, value) VALUES ('total_visits', 1) RETURNING value INTO result; END IF;
      RETURN result;
    END; $f$;
  `;

  try {
    const res = await fetch(`https://api.supabase.com/v1/projects/ziiagdrrytyrmzoeegjk/database/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${SERVICE}` },
      body: JSON.stringify({ query: sql }),
    });
    const data = await res.json();
    return NextResponse.json({ status: res.status, result: data });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
