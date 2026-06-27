-- ══════════════════════════════════════════════════════════════════
--  PASTE THIS ENTIRE FILE INTO:
--  https://supabase.com/dashboard/project/hwiznocgqgfpkznieint/sql/new
--  Then click RUN
-- ══════════════════════════════════════════════════════════════════

-- ─── 1. profiles ─────────────────────────────────────────────────
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  full_name    text,
  username     text unique,
  mobile       text,
  email        text,
  created_at   timestamptz default now() not null,
  updated_at   timestamptz default now() not null
);
alter table public.profiles enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='profiles' and policyname='Public profiles are viewable by everyone') then
    create policy "Public profiles are viewable by everyone" on public.profiles for select using (true);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='profiles' and policyname='Users can insert their own profile') then
    create policy "Users can insert their own profile" on public.profiles for insert with check (auth.uid() = id);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='profiles' and policyname='Users can update their own profile') then
    create policy "Users can update their own profile" on public.profiles for update using (auth.uid() = id);
  end if;
end $$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, username, mobile, email)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'mobile',
    new.email
  )
  on conflict (id) do update set
    full_name  = excluded.full_name,
    username   = excluded.username,
    mobile     = excluded.mobile,
    email      = excluded.email,
    updated_at = now();
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

-- ─── 2. article_views ────────────────────────────────────────────
-- Tracks unique views per article (one row per article slug)
create table if not exists public.article_views (
  slug        text primary key,
  view_count  bigint default 0 not null
);
alter table public.article_views enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='article_views' and policyname='Anyone can read view counts') then
    create policy "Anyone can read view counts" on public.article_views for select using (true);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='article_views' and policyname='Anyone can upsert view counts') then
    create policy "Anyone can upsert view counts" on public.article_views for all using (true) with check (true);
  end if;
end $$;

-- Function to increment view count atomically
create or replace function public.increment_view(p_slug text)
returns void language plpgsql security definer as $$
begin
  insert into public.article_views (slug, view_count)
  values (p_slug, 1)
  on conflict (slug) do update
    set view_count = public.article_views.view_count + 1;
end;
$$;

-- ─── 3. article_likes ────────────────────────────────────────────
-- One row per user per article — toggle like
create table if not exists public.article_likes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  slug        text not null,
  created_at  timestamptz default now() not null,
  unique (user_id, slug)
);
alter table public.article_likes enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='article_likes' and policyname='Anyone can read likes') then
    create policy "Anyone can read likes" on public.article_likes for select using (true);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='article_likes' and policyname='Users manage own likes') then
    create policy "Users manage own likes" on public.article_likes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end $$;

-- ─── 4. saved_articles ───────────────────────────────────────────
-- User's saved/bookmarked articles list
create table if not exists public.saved_articles (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  slug        text not null,
  saved_at    timestamptz default now() not null,
  unique (user_id, slug)
);
alter table public.saved_articles enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='saved_articles' and policyname='Users read own saved articles') then
    create policy "Users read own saved articles" on public.saved_articles for select using (auth.uid() = user_id);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='saved_articles' and policyname='Users manage own saved articles') then
    create policy "Users manage own saved articles" on public.saved_articles for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end $$;

-- ─── 5. user_articles ────────────────────────────────────────────
create table if not exists public.user_articles (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null,
  excerpt     text not null,
  content     text not null,
  category    text not null,
  cover_url   text,
  slug        text unique not null,
  published   boolean default true not null,
  created_at  timestamptz default now() not null,
  updated_at  timestamptz default now() not null
);
alter table public.user_articles enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='user_articles' and policyname='Anyone can read published articles') then
    create policy "Anyone can read published articles" on public.user_articles for select using (published = true or auth.uid() = user_id);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='user_articles' and policyname='Users manage own articles') then
    create policy "Users manage own articles" on public.user_articles for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end $$;

drop trigger if exists set_user_articles_updated_at on public.user_articles;
create trigger set_user_articles_updated_at
  before update on public.user_articles
  for each row execute procedure public.set_updated_at();

-- ─── 6. Storage bucket for article cover images ───────────────────
insert into storage.buckets (id, name, public)
  values ('article-covers', 'article-covers', true)
  on conflict (id) do nothing;

do $$ begin
  if not exists (select 1 from storage.policies where name = 'Public cover images') then
    create policy "Public cover images" on storage.objects for select using (bucket_id = 'article-covers');
  end if;
end $$;
do $$ begin
  if not exists (select 1 from storage.policies where name = 'Users upload covers') then
    create policy "Users upload covers" on storage.objects for insert with check (bucket_id = 'article-covers' and auth.uid() is not null);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from storage.policies where name = 'Users delete own covers') then
    create policy "Users delete own covers" on storage.objects for delete using (bucket_id = 'article-covers' and auth.uid() is not null);
  end if;
end $$;
