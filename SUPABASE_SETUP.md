# Supabase Setup — Run this SQL in your dashboard

Go to:
https://supabase.com/dashboard/project/hwiznocgqgfpkznieint/sql/new

Paste and run the following SQL:

---

-- 1. Create profiles table
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  full_name    text,
  username     text unique,
  mobile       text,
  email        text,
  created_at   timestamptz default now() not null,
  updated_at   timestamptz default now() not null
);

-- 2. Enable Row Level Security
alter table public.profiles enable row level security;

-- 3. Policies
create policy "Public profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users can insert their own profile"
  on public.profiles for insert with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update using (auth.uid() = id);

-- 4. Auto-create profile row when a user signs up
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

-- 5. Auto-bump updated_at on profile update
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();
