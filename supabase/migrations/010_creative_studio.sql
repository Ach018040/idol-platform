-- Idol Platform Creative Studio schema.

create table if not exists idols (
  id uuid primary key default gen_random_uuid(),
  source_member_id text,
  name text not null,
  representative_color text,
  tags text[] not null default '{}',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists creative_templates (
  id text primary key,
  mode text not null check (mode in ('image', 'poster', 'mv-storyboard', 'social-post')),
  title text not null,
  prompt_template text not null,
  safety_notes text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists generated_assets (
  id uuid primary key default gen_random_uuid(),
  idol_id uuid references idols(id) on delete set null,
  mode text not null check (mode in ('image', 'poster', 'mv-storyboard', 'social-post')),
  title text not null,
  prompt text not null,
  provider text not null default 'mock',
  output_url text,
  output_payload jsonb not null default '{}'::jsonb,
  policy_version text not null default 'idol-creative-policy-v1',
  ai_generated boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists creative_workflows (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  steps jsonb not null default '[]'::jsonb,
  status text not null default 'draft' check (status in ('draft', 'running', 'ready', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists prompt_runs (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid references generated_assets(id) on delete set null,
  mode text not null,
  provider text not null,
  prompt text not null,
  safety_checked boolean not null default true,
  policy_version text not null default 'idol-creative-policy-v1',
  created_at timestamptz not null default now()
);

alter table idols enable row level security;
alter table creative_templates enable row level security;
alter table generated_assets enable row level security;
alter table creative_workflows enable row level security;
alter table prompt_runs enable row level security;

drop policy if exists "Public read creative templates" on creative_templates;
create policy "Public read creative templates" on creative_templates for select using (true);

drop policy if exists "Public read generated assets" on generated_assets;
create policy "Public read generated assets" on generated_assets for select using (true);
