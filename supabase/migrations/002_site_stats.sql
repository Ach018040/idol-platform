-- ============================================================
-- Migration 002: Site Stats (造訪統計)
-- 在 idolmaps Supabase (ziiagdrrytyrmzoeegjk) 執行
-- ============================================================

-- 建立 site_stats 統計表
CREATE TABLE IF NOT EXISTS site_stats (
  key        text PRIMARY KEY,
  value      bigint DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

-- 初始化造訪計數
INSERT INTO site_stats (key, value)
VALUES ('total_visits', 0)
ON CONFLICT (key) DO NOTHING;

-- RLS
ALTER TABLE site_stats ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'site_stats' AND policyname = 'Public read stats'
  ) THEN
    CREATE POLICY "Public read stats" ON site_stats FOR SELECT USING (true);
  END IF;
END $$;

-- increment_visit_count RPC（供 /api/visit POST 呼叫）
CREATE OR REPLACE FUNCTION increment_visit_count()
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
AS $f$
DECLARE result bigint;
BEGIN
  UPDATE site_stats
    SET value = value + 1, updated_at = now()
    WHERE key = 'total_visits'
    RETURNING value INTO result;

  IF result IS NULL THEN
    INSERT INTO site_stats (key, value)
    VALUES ('total_visits', 1)
    RETURNING value INTO result;
  END IF;

  RETURN result;
END;
$f$;

-- 確認建立成功
SELECT key, value FROM site_stats;
