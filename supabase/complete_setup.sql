-- ============================================================================
-- CLEVERLY - COMPLETE SUPABASE DATABASE SETUP
-- ============================================================================
-- This script combines all migrations in the correct order
-- Run this in the Supabase SQL Editor to set up your complete database schema
-- ============================================================================

-- ============================================================================
-- MIGRATION 001: INITIAL SCHEMA
-- ============================================================================
-- Purpose: Set up extensions and user profiles table
-- ============================================================================

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

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- ============================================================================
-- MIGRATION 002: COURSES MODULE
-- ============================================================================
-- Purpose: Create courses, course files, and vector embeddings tables
-- ============================================================================

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

drop policy if exists "Users can CRUD own courses" on public.courses;
create policy "Users can CRUD own courses"
  on public.courses for all
  using (auth.uid() = user_id);

drop policy if exists "Users can CRUD own course files" on public.course_files;
create policy "Users can CRUD own course files"
  on public.course_files for all
  using (
    course_id in (
      select id from public.courses where user_id = auth.uid()
    )
  );

drop policy if exists "Users can CRUD own embeddings" on public.course_embeddings;
create policy "Users can CRUD own embeddings"
  on public.course_embeddings for all
  using (
    course_file_id in (
      select cf.id from public.course_files cf
      join public.courses c on cf.course_id = c.id
      where c.user_id = auth.uid()
    )
  );

-- ============================================================================
-- MIGRATION 003: GRADING MODULE
-- ============================================================================
-- Purpose: Create tables for automated grading system
-- ============================================================================

-- Graders (exam/test containers)
create table if not exists public.graders (
  id uuid primary key default uuid_generate_v4(),
  course_id uuid references public.courses(id) on delete cascade not null,
  title text not null,
  total_marks integer,
  status text default 'draft', -- 'draft', 'ready', 'grading', 'completed'
  test_file_path text,
  memo_file_path text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Rubrics (extracted from memo)
create table if not exists public.rubrics (
  id uuid primary key default uuid_generate_v4(),
  grader_id uuid references public.graders(id) on delete cascade not null,
  question_number text not null,
  question_text text,
  expected_answer text not null,
  keywords text[] default '{}',
  max_marks float not null,
  order_index integer default 0,
  created_at timestamp with time zone default now()
);

-- Student submissions
create table if not exists public.submissions (
  id uuid primary key default uuid_generate_v4(),
  grader_id uuid references public.graders(id) on delete cascade not null,
  student_identifier text,
  file_path text not null,
  total_score float,
  max_possible_score float,
  percentage float,
  status text default 'pending', -- 'pending', 'processing', 'graded', 'flagged', 'reviewed'
  feedback_summary text,
  processed_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

-- Individual question grades
create table if not exists public.submission_grades (
  id uuid primary key default uuid_generate_v4(),
  submission_id uuid references public.submissions(id) on delete cascade not null,
  rubric_id uuid references public.rubrics(id) on delete cascade not null,
  marks_awarded float not null,
  ai_reasoning text,
  confidence_score float default 1.0, -- 0.0 to 1.0
  is_overridden boolean default false,
  override_reason text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Indexes for performance
create index if not exists idx_graders_course on public.graders(course_id);
create index if not exists idx_rubrics_grader on public.rubrics(grader_id);
create index if not exists idx_submissions_grader on public.submissions(grader_id);
create index if not exists idx_submission_grades_submission on public.submission_grades(submission_id);
create index if not exists idx_submissions_status on public.submissions(status);

-- RLS Policies
alter table public.graders enable row level security;
alter table public.rubrics enable row level security;
alter table public.submissions enable row level security;
alter table public.submission_grades enable row level security;

drop policy if exists "Users can CRUD own graders" on public.graders;
create policy "Users can CRUD own graders"
  on public.graders for all
  using (
    course_id in (
      select id from public.courses where user_id = auth.uid()
    )
  );

drop policy if exists "Users can CRUD own rubrics" on public.rubrics;
create policy "Users can CRUD own rubrics"
  on public.rubrics for all
  using (
    grader_id in (
      select g.id from public.graders g
      join public.courses c on g.course_id = c.id
      where c.user_id = auth.uid()
    )
  );

drop policy if exists "Users can CRUD own submissions" on public.submissions;
create policy "Users can CRUD own submissions"
  on public.submissions for all
  using (
    grader_id in (
      select g.id from public.graders g
      join public.courses c on g.course_id = c.id
      where c.user_id = auth.uid()
    )
  );

drop policy if exists "Users can CRUD own submission grades" on public.submission_grades;
create policy "Users can CRUD own submission grades"
  on public.submission_grades for all
  using (
    submission_id in (
      select s.id from public.submissions s
      join public.graders g on s.grader_id = g.id
      join public.courses c on g.course_id = c.id
      where c.user_id = auth.uid()
    )
  );

-- ============================================================================
-- MIGRATION 004: VECTOR SEARCH FUNCTION
-- ============================================================================
-- Purpose: Create function for semantic similarity search on course embeddings
-- ============================================================================

-- Create function for vector similarity search on course embeddings
-- This function is used by the RAG service to find relevant content chunks
-- based on semantic similarity to a query embedding
create or replace function match_course_embeddings(
  query_embedding vector(768),
  course_id uuid,
  match_count int default 5
)
returns table (
  id uuid,
  content_chunk text,
  similarity float
)
language sql stable
as $$
  select
    ce.id,
    ce.content_chunk,
    1 - (ce.embedding <=> query_embedding) as similarity
  from public.course_embeddings ce
  join public.course_files cf on ce.course_file_id = cf.id
  where cf.course_id = match_course_embeddings.course_id
  order by ce.embedding <=> query_embedding
  limit match_count;
$$;

-- ============================================================================
-- USER SETTINGS
-- ============================================================================
create table if not exists public.user_settings (
  user_id uuid references public.profiles(id) on delete cascade primary key,
  notifications_email boolean default true,
  notifications_grading_complete boolean default true,
  theme text default 'system',
  gemini_api_key text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.user_settings enable row level security;

drop policy if exists "Users can view own settings" on public.user_settings;
create policy "Users can view own settings"
  on public.user_settings for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own settings" on public.user_settings;
create policy "Users can insert own settings"
  on public.user_settings for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own settings" on public.user_settings;
create policy "Users can update own settings"
  on public.user_settings for update
  using (auth.uid() = user_id);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these to verify your setup is complete
-- ============================================================================

-- Check if pgvector extension is enabled
SELECT * FROM pg_extension WHERE extname = 'vector';

-- Check if uuid-ossp extension is enabled
SELECT * FROM pg_extension WHERE extname = 'uuid-ossp';

-- List all tables created
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check if the vector search function exists
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'match_course_embeddings';

-- Verify RLS is enabled on all tables
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- ============================================================================
-- SETUP COMPLETE!
-- ============================================================================
-- Next steps:
-- 1. Create a storage bucket named 'courses' in Supabase Storage
-- 2. Configure your .env files with the credentials
-- 3. Test the vector search functionality
-- ============================================================================
