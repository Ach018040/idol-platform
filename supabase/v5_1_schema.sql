-- Watchlist
create table if not exists user_watchlists (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  member_id text not null,
  created_at timestamp default now()
);

-- Alerts
create table if not exists user_alert_rules (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  member_id text not null,
  rule_type text not null,
  threshold numeric,
  created_at timestamp default now()
);
