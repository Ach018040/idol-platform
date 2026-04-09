-- Dashboard analytics views for emotion + fan risk

CREATE OR REPLACE VIEW emotion_dashboard_daily AS
SELECT
  DATE(created_at) AS metric_date,
  COUNT(*) AS total_checkins,
  AVG(risk_score)::numeric(10,2) AS avg_risk_score,
  COUNT(*) FILTER (WHERE risk_level = 'high') AS high_risk_count,
  COUNT(*) FILTER (WHERE risk_level = 'medium') AS medium_risk_count,
  COUNT(*) FILTER (WHERE risk_level = 'low') AS low_risk_count,
  AVG(energy)::numeric(10,2) AS avg_energy,
  AVG(pleasantness)::numeric(10,2) AS avg_pleasantness
FROM emotion_logs
GROUP BY DATE(created_at)
ORDER BY metric_date DESC;

CREATE OR REPLACE VIEW emotion_dashboard_signal_counts AS
SELECT
  signal,
  COUNT(*) AS signal_count
FROM emotion_logs,
LATERAL UNNEST(COALESCE(signals, ARRAY[]::text[])) AS signal
GROUP BY signal
ORDER BY signal_count DESC, signal ASC;

CREATE OR REPLACE VIEW emotion_dashboard_primary_emotions AS
SELECT
  primary_emotion,
  COUNT(*) AS emotion_count,
  AVG(risk_score)::numeric(10,2) AS avg_risk_score
FROM emotion_logs
GROUP BY primary_emotion
ORDER BY emotion_count DESC, primary_emotion ASC;

CREATE OR REPLACE FUNCTION get_emotion_dashboard_overview(days_back integer DEFAULT 30)
RETURNS TABLE (
  total_checkins bigint,
  avg_risk_score numeric,
  avg_energy numeric,
  avg_pleasantness numeric,
  high_risk_count bigint,
  medium_risk_count bigint,
  low_risk_count bigint,
  high_risk_ratio numeric
)
LANGUAGE sql
AS $$
  SELECT
    COUNT(*) AS total_checkins,
    COALESCE(AVG(risk_score), 0)::numeric(10,2) AS avg_risk_score,
    COALESCE(AVG(energy), 0)::numeric(10,2) AS avg_energy,
    COALESCE(AVG(pleasantness), 0)::numeric(10,2) AS avg_pleasantness,
    COUNT(*) FILTER (WHERE risk_level = 'high') AS high_risk_count,
    COUNT(*) FILTER (WHERE risk_level = 'medium') AS medium_risk_count,
    COUNT(*) FILTER (WHERE risk_level = 'low') AS low_risk_count,
    CASE
      WHEN COUNT(*) = 0 THEN 0::numeric(10,4)
      ELSE (COUNT(*) FILTER (WHERE risk_level = 'high'))::numeric / COUNT(*)
    END AS high_risk_ratio
  FROM emotion_logs
  WHERE created_at >= NOW() - make_interval(days => days_back);
$$;

CREATE OR REPLACE FUNCTION get_emotion_trends(days_back integer DEFAULT 30)
RETURNS TABLE (
  metric_date date,
  total_checkins bigint,
  avg_risk_score numeric,
  high_risk_count bigint,
  avg_energy numeric,
  avg_pleasantness numeric
)
LANGUAGE sql
AS $$
  SELECT
    DATE(created_at) AS metric_date,
    COUNT(*) AS total_checkins,
    COALESCE(AVG(risk_score), 0)::numeric(10,2) AS avg_risk_score,
    COUNT(*) FILTER (WHERE risk_level = 'high') AS high_risk_count,
    COALESCE(AVG(energy), 0)::numeric(10,2) AS avg_energy,
    COALESCE(AVG(pleasantness), 0)::numeric(10,2) AS avg_pleasantness
  FROM emotion_logs
  WHERE created_at >= NOW() - make_interval(days => days_back)
  GROUP BY DATE(created_at)
  ORDER BY metric_date ASC;
$$;

CREATE OR REPLACE FUNCTION get_top_emotion_signals(limit_n integer DEFAULT 10)
RETURNS TABLE (
  signal text,
  signal_count bigint
)
LANGUAGE sql
AS $$
  SELECT
    signal,
    COUNT(*) AS signal_count
  FROM emotion_logs,
  LATERAL UNNEST(COALESCE(signals, ARRAY[]::text[])) AS signal
  GROUP BY signal
  ORDER BY signal_count DESC, signal ASC
  LIMIT limit_n;
$$;

CREATE OR REPLACE FUNCTION get_top_primary_emotions(limit_n integer DEFAULT 10)
RETURNS TABLE (
  primary_emotion text,
  emotion_count bigint,
  avg_risk_score numeric
)
LANGUAGE sql
AS $$
  SELECT
    primary_emotion,
    COUNT(*) AS emotion_count,
    COALESCE(AVG(risk_score), 0)::numeric(10,2) AS avg_risk_score
  FROM emotion_logs
  GROUP BY primary_emotion
  ORDER BY emotion_count DESC, primary_emotion ASC
  LIMIT limit_n;
$$;