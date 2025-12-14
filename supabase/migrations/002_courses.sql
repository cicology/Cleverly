-- Courses table
create table if not exists public.courses (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text,
  topics text[] default '{}',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Course files (textbooks, study guides)
create table if not exists public.course_files (
  id uuid primary key default uuid_generate_v4(),
  course_id uuid references public.courses(id) on delete cascade not null,
  file_name text not null,
  file_type text not null, -- 'textbook', 'study_guide', 'notes'
  file_path text not null,
  file_size bigint,
  status text default 'pending', -- 'pending', 'processing', 'embedded', 'failed'
  created_at timestamp with time zone default now()
);

-- Vector embeddings for RAG
create table if not exists public.course_embeddings (
  id uuid primary key default uuid_generate_v4(),
  course_file_id uuid references public.course_files(id) on delete cascade not null,
  content_chunk text not null,
  embedding vector(768), -- Gemini embedding dimension
  metadata jsonb default '{}',
  created_at timestamp with time zone default now()
);

-- Create vector index for similarity search
create index if not exists idx_course_embeddings_vector 
  on public.course_embeddings using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- RLS Policies
alter table public.courses enable row level security;
alter table public.course_files enable row level security;
alter table public.course_embeddings enable row level security;

create policy if not exists "Users can CRUD own courses"
  on public.courses for all
  using (auth.uid() = user_id);

create policy if not exists "Users can CRUD own course files"
  on public.course_files for all
  using (
    course_id in (
      select id from public.courses where user_id = auth.uid()
    )
  );

create policy if not exists "Users can CRUD own embeddings"
  on public.course_embeddings for all
  using (
    course_file_id in (
      select cf.id from public.course_files cf
      join public.courses c on cf.course_id = c.id
      where c.user_id = auth.uid()
    )
  );
