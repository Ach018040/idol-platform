-- Migration 003: TimesFM Forecasts Table
-- Execute in idolmaps Supabase (ziiagdrrytyrmzoeegjk) SQL Editor

CREATE TABLE IF NOT EXISTS forecasts (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type    text NOT NULL CHECK (entity_type IN ('member','group')),
  entity_id      uuid NOT NULL,
  entity_name    text NOT NULL,
  forecast_at    timestamptz DEFAULT now(),
  horizon_days   integer NOT NULL DEFAULT 14,
  point_forecast float[] NOT NULL,
  lower_q10      float[],
  upper_q90      float[],
  context_len    integer,
  model_ver      text DEFAULT 'timesfm-2.5-200m'
);

CREATE INDEX IF NOT EXISTS idx_forecasts_entity ON forecasts(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_forecasts_at    ON forecasts(forecast_at DESC);

ALTER TABLE forecasts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename='forecasts' AND policyname='Public read forecasts'
  ) THEN
    CREATE POLICY "Public read forecasts" ON forecasts FOR SELECT USING (true);
  END IF;
END $$;

-- Auto-cleanup: keep only latest forecast per entity
CREATE OR REPLACE FUNCTION keep_latest_forecast()
RETURNS trigger LANGUAGE plpgsql AS $f$
BEGIN
  DELETE FROM forecasts
  WHERE entity_type = NEW.entity_type
    AND entity_id   = NEW.entity_id
    AND id         <> NEW.id
    AND forecast_at < now() - interval '1 hour';
  RETURN NEW;
END;
$f$;

DROP TRIGGER IF EXISTS trg_keep_latest ON forecasts;
CREATE TRIGGER trg_keep_latest
  AFTER INSERT ON forecasts
  FOR EACH ROW EXECUTE FUNCTION keep_latest_forecast();

SELECT 'forecasts table ready' AS status;
