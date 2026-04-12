-- ============================================================
-- Secbrain knowledge base integration
-- Migration: 005_secbrain_knowledge_base.sql
-- Source inspiration: Ach018040/chengan-Secbrain
-- Purpose:
--   Add a lightweight "brain" layer to idol-platform so forum,
--   recommendations, AI summaries, and ops research can share
--   one searchable source of truth.
-- ============================================================

create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";

create table if not exists brain_pages (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  type text not null check (
    type in ('concept', 'project', 'person', 'event', 'idol', 'tech', 'source', 'other')
  ),
  title text not null,
  compiled_truth text not null default '',
  timeline_md text not null default '',
  tags text[] not null default '{}',
  frontmatter jsonb not null default '{}',
  search_vector tsvector,
  content_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists brain_links (
  id uuid primary key default uuid_generate_v4(),
  from_slug text not null references brain_pages(slug) on delete cascade on update cascade,
  to_slug text not null references brain_pages(slug) on delete cascade on update cascade,
  link_type text not null default 'references',
  created_at timestamptz not null default now(),
  unique(from_slug, to_slug, link_type)
);

create table if not exists brain_timeline_entries (
  id uuid primary key default uuid_generate_v4(),
  page_slug text not null references brain_pages(slug) on delete cascade on update cascade,
  entry_date date not null,
  summary text not null,
  detail text,
  source text,
  created_at timestamptz not null default now()
);

create table if not exists brain_page_versions (
  id uuid primary key default uuid_generate_v4(),
  page_slug text not null,
  compiled_truth text not null,
  frontmatter jsonb,
  snapshot_at timestamptz not null default now()
);

create or replace function brain_pages_search_vector_update()
returns trigger
language plpgsql
as $$
begin
  new.search_vector :=
    setweight(to_tsvector('simple', coalesce(new.title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(new.compiled_truth, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(new.timeline_md, '')), 'C') ||
    setweight(to_tsvector('simple', coalesce(array_to_string(new.tags, ' '), '')), 'B');
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists brain_pages_search_vector_trig on brain_pages;
create trigger brain_pages_search_vector_trig
before insert or update on brain_pages
for each row execute function brain_pages_search_vector_update();

create or replace function brain_pages_version_snapshot()
returns trigger
language plpgsql
as $$
begin
  if old.compiled_truth is distinct from new.compiled_truth then
    insert into brain_page_versions(page_slug, compiled_truth, frontmatter)
    values(old.slug, old.compiled_truth, old.frontmatter);
  end if;
  return new;
end;
$$;

drop trigger if exists brain_pages_version_trig on brain_pages;
create trigger brain_pages_version_trig
before update on brain_pages
for each row execute function brain_pages_version_snapshot();

create index if not exists brain_pages_search_gin on brain_pages using gin(search_vector);
create index if not exists brain_pages_type_idx on brain_pages(type);
create index if not exists brain_pages_tags_gin on brain_pages using gin(tags);
create index if not exists brain_pages_title_trgm on brain_pages using gin(title gin_trgm_ops);
create index if not exists brain_links_from_idx on brain_links(from_slug);
create index if not exists brain_links_to_idx on brain_links(to_slug);
create index if not exists brain_timeline_page_idx on brain_timeline_entries(page_slug, entry_date desc);

alter table brain_pages enable row level security;
alter table brain_links enable row level security;
alter table brain_timeline_entries enable row level security;
alter table brain_page_versions enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'brain_pages' and policyname = 'brain_pages_public_read'
  ) then
    create policy "brain_pages_public_read" on brain_pages for select using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'brain_links' and policyname = 'brain_links_public_read'
  ) then
    create policy "brain_links_public_read" on brain_links for select using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'brain_timeline_entries' and policyname = 'brain_timeline_public_read'
  ) then
    create policy "brain_timeline_public_read" on brain_timeline_entries for select using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'brain_page_versions' and policyname = 'brain_versions_public_read'
  ) then
    create policy "brain_versions_public_read" on brain_page_versions for select using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'brain_pages' and policyname = 'brain_pages_auth_write'
  ) then
    create policy "brain_pages_auth_write" on brain_pages for all
      using (auth.role() = 'authenticated')
      with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'brain_links' and policyname = 'brain_links_auth_write'
  ) then
    create policy "brain_links_auth_write" on brain_links for all
      using (auth.role() = 'authenticated')
      with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'brain_timeline_entries' and policyname = 'brain_timeline_auth_write'
  ) then
    create policy "brain_timeline_auth_write" on brain_timeline_entries for all
      using (auth.role() = 'authenticated')
      with check (true);
  end if;
end $$;

insert into brain_pages (slug, type, title, compiled_truth, timeline_md, tags, frontmatter)
values
(
  'projects/idol-platform',
  'project',
  'idol-platform',
  'idol-platform is a Taiwan underground idol data platform built on Next.js, Supabase, Vercel, and Python pipelines. It combines member and group rankings, forum discussions, activity timelines, AI insights, and mixed freshness scoring. Recent work also introduced social activity fetching and a brain-style knowledge layer for shared product truth.',
  '- 2025-xx-xx: initial static ranking prototype\n- 2026-04-11: forum admin workflow repaired and moved to server moderation APIs\n- 2026-04-12: mixed freshness scoring and social activity fetching landed on production\n- 2026-04-12: Secbrain-inspired knowledge base schema integrated',
  array['idol-platform', 'nextjs', 'supabase', 'vercel', 'forum', 'ranking', 'ai', 'knowledge-base'],
  jsonb_build_object(
    'product_area', 'idol analytics',
    'deployment', 'vercel',
    'forum_project', 'idolmetrics',
    'ranking_data', 'idolmaps',
    'formula_version', 'v2-mixed-freshness'
  )
),
(
  'concepts/idol-temperature-index-v2',
  'concept',
  'idol temperature index v2',
  'The v2 temperature model blends social presence, profile completeness, mixed freshness scoring, and group affinity for members, then rolls up group scores from member-level performance. Mixed freshness now combines last data refresh with best-effort social post timestamps when available.',
  '- 2026-04-12: structured v2 schema added\n- 2026-04-12: mixed freshness formula introduced\n- 2026-04-12: instagram public post timestamp fetching connected as a first-pass signal',
  array['temperature-index', 'ranking', 'freshness', 'social-signals', 'formula'],
  jsonb_build_object(
    'member_formula', 'temperature_index_v2',
    'group_formula', 'group_temperature_index_v2',
    'freshness_mode', 'mixed'
  )
),
(
  'tech/secbrain-integration',
  'tech',
  'secbrain integration for idol-platform',
  'The Secbrain integration adds a reusable knowledge graph layer to idol-platform. It stores compiled truth, timeline notes, tags, and links between concepts so future AI summaries, recommendation explanations, forum moderation notes, and internal product research can reuse the same source of truth.',
  '- 2026-04-12: schema imported from chengan-Secbrain and adapted into idol-platform\n- 2026-04-12: /api/brain/search introduced as the first read surface',
  array['secbrain', 'knowledge-base', 'supabase', 'ai', 'search'],
  jsonb_build_object(
    'source_repo', 'Ach018040/chengan-Secbrain',
    'integration_phase', 'phase-1',
    'first_surface', '/api/brain/search'
  )
)
on conflict (slug) do update set
  title = excluded.title,
  compiled_truth = excluded.compiled_truth,
  timeline_md = excluded.timeline_md,
  tags = excluded.tags,
  frontmatter = excluded.frontmatter,
  updated_at = now();

insert into brain_links (from_slug, to_slug, link_type)
values
  ('projects/idol-platform', 'concepts/idol-temperature-index-v2', 'depends_on'),
  ('projects/idol-platform', 'tech/secbrain-integration', 'uses'),
  ('tech/secbrain-integration', 'concepts/idol-temperature-index-v2', 'supports')
on conflict do nothing;

insert into brain_timeline_entries (page_slug, entry_date, summary, detail, source)
values
  ('projects/idol-platform', '2026-04-12', 'Secbrain knowledge layer integrated', 'Added reusable brain schema, seed pages, and search API bridge for future AI and recommendation features.', 'migration 005'),
  ('concepts/idol-temperature-index-v2', '2026-04-12', 'Mixed freshness adopted', 'Temperature scoring now supports blending data refresh time with best-effort social post timestamps.', 'idol-platform main')
on conflict do nothing;
