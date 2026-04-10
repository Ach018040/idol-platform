-- alert events
create table if not exists user_alert_events (
  id uuid primary key default gen_random_uuid(),
  user_id text,
  member_id text,
  rule_type text,
  created_at timestamp default now()
);

-- user profile
create table if not exists user_profiles (
  id text primary key,
  plan text default 'free',
  created_at timestamp default now()
);
