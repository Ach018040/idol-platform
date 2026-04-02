-- ============================================================
-- Idol Platform v4 — Forum Schema
-- Migration: 001_forum_schema.sql
-- ============================================================

-- ── 版區 ─────────────────────────────────────────────────────
CREATE TABLE forums (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text UNIQUE NOT NULL,
  title       text NOT NULL,
  description text,
  icon        text,
  sort_order  integer DEFAULT 0,
  created_at  timestamptz DEFAULT now()
);

INSERT INTO forums (slug, title, description, sort_order) VALUES
  ('general',  '綜合討論',     '一般話題',                     1),
  ('groups',   '團體討論',     '各團體相關討論',                2),
  ('members',  '成員討論',     '成員相關討論',                  3),
  ('events',   '活動心得',     '演出、活動後感',                4),
  ('goods',    '拍照物販交流', '物販規則、心得、推薦',          5),
  ('news',     '新聞公告',     '官方公告與業界新聞',            6),
  ('off-topic','雜談',         '其他話題',                      7);

-- ── 討論串 ───────────────────────────────────────────────────
CREATE TABLE threads (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  forum_id        uuid NOT NULL REFERENCES forums(id) ON DELETE CASCADE,
  author_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title           text NOT NULL,
  body            text NOT NULL,
  tags            text[] DEFAULT '{}',
  likes_count     integer DEFAULT 0,
  replies_count   integer DEFAULT 0,
  trending_score  numeric(10,4) DEFAULT 0,
  is_pinned       boolean DEFAULT false,
  is_locked       boolean DEFAULT false,
  last_reply_at   timestamptz DEFAULT now(),
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

CREATE INDEX idx_threads_forum_id ON threads(forum_id);
CREATE INDEX idx_threads_trending ON threads(trending_score DESC);
CREATE INDEX idx_threads_created  ON threads(created_at DESC);

-- ── 回覆 ─────────────────────────────────────────────────────
CREATE TABLE posts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id   uuid NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
  author_id   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body        text NOT NULL,
  likes_count integer DEFAULT 0,
  edited      boolean DEFAULT false,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

CREATE INDEX idx_posts_thread_id ON posts(thread_id);

-- ── 按讚 ─────────────────────────────────────────────────────
CREATE TABLE thread_likes (
  thread_id uuid REFERENCES threads(id) ON DELETE CASCADE,
  user_id   uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  PRIMARY KEY (thread_id, user_id)
);

CREATE TABLE post_likes (
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, user_id)
);

-- ── 延伸關聯 ─────────────────────────────────────────────────
-- 連結討論串 ↔ 偶像團體（idol-platform groups）
CREATE TABLE group_threads (
  group_id  uuid NOT NULL, -- 對應 idolmaps groups.id
  thread_id uuid NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
  PRIMARY KEY (group_id, thread_id)
);

-- 連結討論串 ↔ 活動（otaku_event_calendar）
CREATE TABLE event_threads (
  event_id  text NOT NULL,  -- 活動識別碼
  thread_id uuid NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
  PRIMARY KEY (event_id, thread_id)
);

-- 貼文中標記的成員
CREATE TABLE post_mentions (
  post_id   uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  member_id uuid NOT NULL, -- 對應 idolmaps members.id
  PRIMARY KEY (post_id, member_id)
);

-- ── 用戶擴充資料 ─────────────────────────────────────────────
CREATE TABLE user_profiles (
  id           uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  avatar_url   text,
  bio          text,
  role         text DEFAULT 'user' CHECK (role IN ('user','moderator','admin')),
  post_count   integer DEFAULT 0,
  like_count   integer DEFAULT 0,
  joined_at    timestamptz DEFAULT now()
);

-- ── Trending Score 計算 (RPC) ────────────────────────────────
CREATE OR REPLACE FUNCTION compute_trending_scores()
RETURNS void LANGUAGE sql AS $$
  UPDATE threads SET
    trending_score = (likes_count * 2.0 + replies_count * 3.0)
                   / (EXTRACT(EPOCH FROM (now() - created_at)) / 3600.0 + 1)
  WHERE created_at > now() - interval '7 days';
$$;

-- 每小時觸發（需 pg_cron 擴展）
-- SELECT cron.schedule('update-trending', '0 * * * *', 'SELECT compute_trending_scores()');

-- ── RLS 政策 ─────────────────────────────────────────────────
ALTER TABLE forums ENABLE ROW LEVEL SECURITY;
ALTER TABLE threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE thread_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 公開讀取
CREATE POLICY "Public read forums"   ON forums   FOR SELECT USING (true);
CREATE POLICY "Public read threads"  ON threads  FOR SELECT USING (true);
CREATE POLICY "Public read posts"    ON posts    FOR SELECT USING (true);
CREATE POLICY "Public read profiles" ON user_profiles FOR SELECT USING (true);

-- 登入後可發文
CREATE POLICY "Auth insert threads" ON threads FOR INSERT
  WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Auth insert posts"   ON posts   FOR INSERT
  WITH CHECK (auth.uid() = author_id);

-- 只能修改自己的發文
CREATE POLICY "Own update threads" ON threads FOR UPDATE
  USING (auth.uid() = author_id);
CREATE POLICY "Own update posts"   ON posts   FOR UPDATE
  USING (auth.uid() = author_id);

-- 按讚需登入
CREATE POLICY "Auth like threads" ON thread_likes FOR ALL
  USING (auth.uid() = user_id);
CREATE POLICY "Auth like posts"   ON post_likes   FOR ALL
  USING (auth.uid() = user_id);
