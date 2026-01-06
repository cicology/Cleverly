alter table public.courses
  add column if not exists file_search_store_name text;

create table if not exists public.lti_course_links (
  id uuid primary key default gen_random_uuid(),
  platform_issuer text not null,
  client_id text not null,
  context_id text,
  resource_link_id text,
  course_id uuid references public.courses(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default now()
);

create table if not exists public.lti_launches (
  id uuid primary key default gen_random_uuid(),
  launch_id text not null unique,
  platform_issuer text,
  client_id text,
  deployment_id text,
  context_id text,
  context_title text,
  resource_link_id text,
  course_id uuid references public.courses(id) on delete set null,
  user_id uuid references public.profiles(id) on delete set null,
  launch_payload jsonb,
  expires_at timestamp with time zone,
  claimed_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

create unique index if not exists idx_lti_course_links_unique
  on public.lti_course_links (platform_issuer, client_id, context_id, resource_link_id);

create index if not exists idx_lti_launches_launch_id
  on public.lti_launches (launch_id);

create index if not exists idx_lti_launches_user
  on public.lti_launches (user_id);

alter table public.lti_course_links enable row level security;
alter table public.lti_launches enable row level security;

drop policy if exists "Users can read own LTI course links" on public.lti_course_links;
create policy "Users can read own LTI course links"
  on public.lti_course_links for select
  using (auth.uid() = user_id);

drop policy if exists "Users can read own LTI launches" on public.lti_launches;
create policy "Users can read own LTI launches"
  on public.lti_launches for select
  using (auth.uid() = user_id);
