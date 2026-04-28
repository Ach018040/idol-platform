-- Idol Platform v5 AI Design Studio schema.

create table if not exists design_systems (
  id text primary key,
  name text not null,
  description text,
  design_md text not null default '',
  tokens jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists design_templates (
  id text primary key,
  title text not null,
  description text,
  skill_id text not null,
  output_types text[] not null default '{}',
  prompt_seed text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists design_projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete set null,
  title text not null,
  template_id text references design_templates(id),
  design_system_id text references design_systems(id),
  data_source text not null default 'manual',
  visual_direction text not null default 'strawberry-pop',
  source_payload jsonb not null default '{}'::jsonb,
  policy_acknowledged_at timestamptz,
  policy_version text not null default 'idol-design-policy-v1',
  status text not null default 'draft' check (status in ('draft', 'generating', 'ready', 'exporting', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists design_generations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references design_projects(id) on delete cascade,
  skill_id text not null,
  provider text not null default 'local',
  prompt text not null,
  status text not null default 'queued' check (status in ('queued', 'running', 'succeeded', 'failed')),
  error text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists design_artifacts (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references design_projects(id) on delete cascade,
  generation_id uuid references design_generations(id) on delete set null,
  kind text not null check (kind in ('html', 'pdf', 'pptx', 'zip', 'markdown', 'social-card')),
  title text not null,
  content text,
  storage_path text,
  prompt text,
  generated_at timestamptz not null default now(),
  policy_version text not null default 'idol-design-policy-v1',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists export_jobs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references design_projects(id) on delete cascade,
  artifact_id uuid references design_artifacts(id) on delete set null,
  export_type text not null check (export_type in ('html', 'pdf', 'pptx', 'zip', 'markdown')),
  status text not null default 'queued' check (status in ('queued', 'running', 'succeeded', 'failed')),
  output_path text,
  error text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists idx_design_projects_owner_id on design_projects(owner_id);
create index if not exists idx_design_artifacts_project_id on design_artifacts(project_id);
create index if not exists idx_design_generations_project_id on design_generations(project_id);
create index if not exists idx_export_jobs_project_id on export_jobs(project_id);

alter table design_systems enable row level security;
alter table design_templates enable row level security;
alter table design_projects enable row level security;
alter table design_generations enable row level security;
alter table design_artifacts enable row level security;
alter table export_jobs enable row level security;

drop policy if exists "Public read design systems" on design_systems;
create policy "Public read design systems" on design_systems for select using (is_active = true);

drop policy if exists "Public read design templates" on design_templates;
create policy "Public read design templates" on design_templates for select using (is_active = true);

drop policy if exists "Users manage own design projects" on design_projects;
create policy "Users manage own design projects"
  on design_projects for all
  using (owner_id is null or auth.uid() = owner_id)
  with check (owner_id is null or auth.uid() = owner_id);

drop policy if exists "Users manage own design generations" on design_generations;
create policy "Users manage own design generations"
  on design_generations for all
  using (exists (select 1 from design_projects p where p.id = project_id and (p.owner_id is null or p.owner_id = auth.uid())))
  with check (exists (select 1 from design_projects p where p.id = project_id and (p.owner_id is null or p.owner_id = auth.uid())));

drop policy if exists "Users manage own design artifacts" on design_artifacts;
create policy "Users manage own design artifacts"
  on design_artifacts for all
  using (exists (select 1 from design_projects p where p.id = project_id and (p.owner_id is null or p.owner_id = auth.uid())))
  with check (exists (select 1 from design_projects p where p.id = project_id and (p.owner_id is null or p.owner_id = auth.uid())));

drop policy if exists "Users manage own export jobs" on export_jobs;
create policy "Users manage own export jobs"
  on export_jobs for all
  using (exists (select 1 from design_projects p where p.id = project_id and (p.owner_id is null or p.owner_id = auth.uid())))
  with check (exists (select 1 from design_projects p where p.id = project_id and (p.owner_id is null or p.owner_id = auth.uid())));
