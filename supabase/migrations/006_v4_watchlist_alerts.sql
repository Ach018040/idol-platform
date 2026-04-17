-- ============================================================
-- Idol Platform v4 watchlist + alerts persistence
-- Migration: 006_v4_watchlist_alerts.sql
-- Purpose:
--   Persist v4 agent watchlists and alert rules using the current
--   token-based forum profile model.
-- ============================================================

create table if not exists user_watchlists (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  entity_id text not null,
  entity_kind text not null check (entity_kind in ('member', 'group')),
  entity_name text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists idx_user_watchlists_unique
  on user_watchlists(user_id, entity_id);

create index if not exists idx_user_watchlists_user_created
  on user_watchlists(user_id, created_at desc);

create table if not exists user_alert_rules (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  entity_id text not null,
  entity_kind text not null check (entity_kind in ('member', 'group')),
  entity_name text not null,
  rule_type text not null,
  threshold numeric,
  created_at timestamptz not null default now()
);

create index if not exists idx_user_alert_rules_user_created
  on user_alert_rules(user_id, created_at desc);

alter table if exists user_watchlists enable row level security;
alter table if exists user_alert_rules enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'user_watchlists'
      and policyname = 'Public manage watchlists'
  ) then
    create policy "Public manage watchlists"
      on user_watchlists
      for all
      using (true)
      with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'user_alert_rules'
      and policyname = 'Public manage alert rules'
  ) then
    create policy "Public manage alert rules"
      on user_alert_rules
      for all
      using (true)
      with check (true);
  end if;
end $$;
