import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://hwiznocgqgfpkznieint.supabase.co";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3aXpub2NncWdmcGt6bmllaW50Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1MjY4NjksImV4cCI6MjA5ODEwMjg2OX0.kXy_vWVHE_Mu8DAWxxJupFAdnLy8d4OC_pWY0p73GZk";

const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function checkAndSetup() {
  console.log("Checking Supabase connection...");

  // Check if profiles table exists by querying it
  const { error } = await supabase.from("profiles").select("id").limit(1);

  if (!error) {
    console.log("✅ profiles table already exists and is reachable.");
    console.log("✅ Supabase is connected and ready.");
    process.exit(0);
  }

  if (error.code === "42P01") {
    // Table does not exist
    console.log("❌ profiles table does not exist yet.");
    console.log("\n👉 You MUST run the following SQL in your Supabase dashboard:");
    console.log("   https://supabase.com/dashboard/project/hwiznocgqgfpkznieint/sql/new\n");
    console.log("━".repeat(60));
    console.log(`
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

create policy "Public profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users can insert their own profile"
  on public.profiles for insert with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update using (auth.uid() = id);

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
`);
    console.log("━".repeat(60));
  } else {
    console.log("Supabase error:", error.message);
  }
}

checkAndSetup();
