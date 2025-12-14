-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "vector";

-- Users table (extends Supabase auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default now()
);

-- Row Level Security
alter table public.profiles enable row level security;

create policy if not exists "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy if not exists "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);
