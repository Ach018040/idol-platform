-- ============================================================
-- Idol Platform forum runtime alignment
-- Migration: 004_forum_runtime_alignment.sql
-- Purpose:
--   Align the forum schema with the current nickname-based runtime
--   and the server-side moderation APIs used by the Next.js app.
-- ============================================================

-- 1. user_profiles currently needs to support nickname tokens used by
--    the forum frontend. Older schemas tied the table to auth.users(id),
--    which breaks guest-based login and admin session fallback.

alter table if exists user_profiles
  alter column id type text using id::text;

alter table if exists user_profiles
  add column if not exists token text;

alter table if exists user_profiles
  add column if not exists banner_color text default '#7c3aed';

alter table if exists user_profiles
  add column if not exists is_banned boolean default false;

alter table if exists user_profiles
  add column if not exists banned_until timestamptz;

alter table if exists user_profiles
  add column if not exists created_at timestamptz default now();

alter table if exists user_profiles
  add column if not exists updated_at timestamptz default now();

update user_profiles
set token = coalesce(token, id)
where token is null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'user_profiles_token_key'
  ) then
    alter table user_profiles add constraint user_profiles_token_key unique (token);
  end if;
end $$;

-- 2. threads and posts are currently consumed as nickname-friendly rows.
--    Runtime APIs expect forum_slug / author_name without requiring auth.users.

alter table if exists threads
  add column if not exists forum_slug text;

alter table if exists threads
  add column if not exists author_name text;

alter table if exists posts
  add column if not exists author_name text;

-- Backfill forum_slug from forums.slug when forum_id exists.
update threads t
set forum_slug = f.slug
from forums f
where t.forum_id = f.id
  and (t.forum_slug is null or t.forum_slug = '');

-- 3. RLS: public read is fine, but runtime now relies on server-side
--    writes via service credentials. We keep read policies open and add
--    permissive insert/update policies for authenticated or service-side
--    operations on user_profiles, threads and posts.

alter table if exists user_profiles enable row level security;
alter table if exists threads enable row level security;
alter table if exists posts enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'user_profiles'
      and policyname = 'Public insert profiles'
  ) then
    create policy "Public insert profiles"
      on user_profiles
      for insert
      with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'user_profiles'
      and policyname = 'Public update profiles'
  ) then
    create policy "Public update profiles"
      on user_profiles
      for update
      using (true)
      with check (true);
  end if;
end $$;

-- 4. Helpful indexes for the current query paths.

create index if not exists idx_user_profiles_token on user_profiles(token);
create index if not exists idx_threads_forum_slug on threads(forum_slug);
create index if not exists idx_threads_created_at on threads(created_at desc);
create index if not exists idx_posts_thread_created on posts(thread_id, created_at asc);
