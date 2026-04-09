-- Emotion Check-in Table
CREATE TABLE IF NOT EXISTS emotion_logs (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMP DEFAULT NOW(),
  text_input TEXT,
  primary_emotion TEXT,
  secondary_emotions TEXT[],
  mood_zone TEXT,
  energy INT,
  pleasantness INT,
  risk_score INT,
  risk_level TEXT,
  signals TEXT[],
  suggested_mode TEXT
);

-- Fan Risk Aggregation Table
CREATE TABLE IF NOT EXISTS fan_risk_daily (
  id BIGSERIAL PRIMARY KEY,
  date DATE,
  avg_risk_score FLOAT,
  high_risk_count INT,
  total_entries INT
);

-- Index
CREATE INDEX IF NOT EXISTS idx_emotion_created_at ON emotion_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_risk_level ON emotion_logs(risk_level);
