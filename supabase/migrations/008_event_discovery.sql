-- Idol Platform event discovery schema.
-- Stores crawler-discovered public idol event metadata before it is promoted
-- into the user-facing event calendar.

create table if not exists idol_event_sources (
  id text primary key,
  name text not null,
  url text not null,
  enabled boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists idol_events_discovered (
  id uuid primary key default gen_random_uuid(),
  source_id text not null references idol_event_sources(id) on delete cascade,
  source_url text not null,
  title text not null,
  starts_at timestamptz,
  ends_at timestamptz,
  timezone text not null default 'Asia/Taipei',
  venue_name text,
  venue_address text,
  city text,
  group_names text[] not null default '{}',
  member_names text[] not null default '{}',
  ticket_url text,
  detail_url text,
  image_url text,
  raw_text text,
  confidence numeric(4, 2) not null default 0,
  extraction_method text not null default 'scrapling',
  scraped_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_id, starts_at, title, venue_name)
);

create index if not exists idx_idol_events_discovered_starts_at
  on idol_events_discovered(starts_at);

create index if not exists idx_idol_events_discovered_group_names
  on idol_events_discovered using gin(group_names);

alter table idol_event_sources enable row level security;
alter table idol_events_discovered enable row level security;

drop policy if exists "Public read event sources" on idol_event_sources;
create policy "Public read event sources"
  on idol_event_sources for select
  using (true);

drop policy if exists "Public read discovered events" on idol_events_discovered;
create policy "Public read discovered events"
  on idol_events_discovered for select
  using (true);
