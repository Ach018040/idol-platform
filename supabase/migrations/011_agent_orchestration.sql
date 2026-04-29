-- Idol Platform agent orchestration schema inspired by Symphony-style work control planes.

create table if not exists agent_work_items (
  id text primary key,
  title text not null,
  kind text not null,
  state text not null default 'backlog' check (state in ('backlog', 'ready', 'running', 'human-review', 'done', 'blocked')),
  owner text not null,
  goal text not null,
  success_criteria text[] not null default '{}',
  proof_required text[] not null default '{}',
  risk text not null default 'medium' check (risk in ('low', 'medium', 'high')),
  source_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists agent_runs (
  id uuid primary key default gen_random_uuid(),
  work_item_id text not null references agent_work_items(id) on delete cascade,
  state text not null default 'running' check (state in ('running', 'human-review', 'done', 'failed', 'cancelled')),
  workspace text not null,
  agent_role text not null,
  prompt text,
  proof jsonb not null default '[]'::jsonb,
  handoff text,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_agent_work_items_state on agent_work_items(state);
create index if not exists idx_agent_runs_work_item_id on agent_runs(work_item_id);

alter table agent_work_items enable row level security;
alter table agent_runs enable row level security;

drop policy if exists "Public read agent work items" on agent_work_items;
create policy "Public read agent work items" on agent_work_items for select using (true);

drop policy if exists "Public read agent runs" on agent_runs;
create policy "Public read agent runs" on agent_runs for select using (true);
