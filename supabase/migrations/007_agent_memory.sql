-- ============================================================
-- Idol Platform agent memory layer
-- Migration: 007_agent_memory.sql
-- Inspired by claude-mem style session + observation memory:
--   - agent_sessions: long-lived conversation context
--   - agent_observations: individual question/answer records
-- ============================================================

create table if not exists agent_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  role_id text not null,
  last_question text,
  last_intent text,
  summary text,
  entity_id text,
  entity_kind text check (entity_kind in ('member', 'group')),
  entity_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_agent_sessions_user_updated
  on agent_sessions(user_id, updated_at desc);

create table if not exists agent_observations (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references agent_sessions(id) on delete set null,
  user_id text not null,
  role_id text not null,
  question text not null,
  answer text not null,
  summary text,
  intent text,
  provider text,
  mode text,
  entity_id text,
  entity_kind text check (entity_kind in ('member', 'group')),
  entity_name text,
  evidence jsonb not null default '[]'::jsonb,
  traces jsonb not null default '[]'::jsonb,
  suggested_questions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_agent_observations_user_created
  on agent_observations(user_id, created_at desc);

create index if not exists idx_agent_observations_session_created
  on agent_observations(session_id, created_at desc);

alter table if exists agent_sessions enable row level security;
alter table if exists agent_observations enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'agent_sessions'
      and policyname = 'Public manage agent sessions'
  ) then
    create policy "Public manage agent sessions"
      on agent_sessions
      for all
      using (true)
      with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'agent_observations'
      and policyname = 'Public manage agent observations'
  ) then
    create policy "Public manage agent observations"
      on agent_observations
      for all
      using (true)
      with check (true);
  end if;
end $$;
