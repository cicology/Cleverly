# 🗄️ Supabase Setup Guide for Cleverly AI Grader

This guide will walk you through setting up Supabase for the Cleverly AI Grader application.

---

## 📋 Table of Contents
1. [Create Supabase Project](#step-1-create-supabase-project)
2. [Run Database Migrations](#step-2-run-database-migrations)
3. [Create Storage Bucket](#step-3-create-storage-bucket)
4. [Get Connection Credentials](#step-4-get-connection-credentials)
5. [Configure Environment Variables](#step-5-configure-environment-variables)
6. [Verify Setup](#step-6-verify-setup)

---

## Step 1: Create Supabase Project

### 1.1 Go to Supabase
Visit https://supabase.com and sign up/login

### 1.2 Create New Project
1. Click "New Project"
2. Choose your organization
3. Fill in project details:
   - **Name:** `cleverly-ai-grader` (or your preferred name)
   - **Database Password:** Choose a strong password (save this!)
   - **Region:** Choose closest to you
   - **Pricing Plan:** Free tier is fine for development
4. Click "Create new project"
5. Wait 2-3 minutes for project to provision

---

## Step 2: Run Database Migrations

### 2.1 Open SQL Editor
1. In your Supabase project dashboard, click "SQL Editor" in the left sidebar
2. Click "New Query"

### 2.2 Run Complete Migration Script

Copy and paste this entire script into the SQL Editor:

```sql
-- ============================================
-- CLEVERLY AI GRADER - COMPLETE DATABASE SETUP
-- ============================================

-- Step 1: Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "vector";

-- Step 2: Create profiles table
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default now()
);

alter table public.profiles enable row level security;

create policy if not exists "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy if not exists "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Step 3: Create courses tables
create table if not exists public.courses (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text,
  topics text[] default '{}',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table if not exists public.course_files (
  id uuid primary key default uuid_generate_v4(),
  course_id uuid references public.courses(id) on delete cascade not null,
  file_name text not null,
  file_type text not null,
  file_path text not null,
  file_size bigint,
  status text default 'pending',
  created_at timestamp with time zone default now()
);

create table if not exists public.course_embeddings (
  id uuid primary key default uuid_generate_v4(),
  course_file_id uuid references public.course_files(id) on delete cascade not null,
  content_chunk text not null,
  embedding vector(768),
  metadata jsonb default '{}',
  created_at timestamp with time zone default now()
);

create index if not exists idx_course_embeddings_vector
  on public.course_embeddings using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

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

-- Step 4: Create grading tables
create table if not exists public.graders (
  id uuid primary key default uuid_generate_v4(),
  course_id uuid references public.courses(id) on delete cascade not null,
  title text not null,
  total_marks integer,
  status text default 'draft',
  test_file_path text,
  memo_file_path text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

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

create table if not exists public.submissions (
  id uuid primary key default uuid_generate_v4(),
  grader_id uuid references public.graders(id) on delete cascade not null,
  student_identifier text,
  file_path text not null,
  total_score float,
  max_possible_score float,
  percentage float,
  status text default 'pending',
  feedback_summary text,
  processed_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

create table if not exists public.submission_grades (
  id uuid primary key default uuid_generate_v4(),
  submission_id uuid references public.submissions(id) on delete cascade not null,
  rubric_id uuid references public.rubrics(id) on delete cascade not null,
  marks_awarded float not null,
  ai_reasoning text,
  confidence_score float default 1.0,
  is_overridden boolean default false,
  override_reason text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create index if not exists idx_graders_course on public.graders(course_id);
create index if not exists idx_rubrics_grader on public.rubrics(grader_id);
create index if not exists idx_submissions_grader on public.submissions(grader_id);
create index if not exists idx_submission_grades_submission on public.submission_grades(submission_id);
create index if not exists idx_submissions_status on public.submissions(status);

alter table public.graders enable row level security;
alter table public.rubrics enable row level security;
alter table public.submissions enable row level security;
alter table public.submission_grades enable row level security;

create policy if not exists "Users can CRUD own graders"
  on public.graders for all
  using (
    course_id in (
      select id from public.courses where user_id = auth.uid()
    )
  );

create policy if not exists "Users can CRUD own rubrics"
  on public.rubrics for all
  using (
    grader_id in (
      select g.id from public.graders g
      join public.courses c on g.course_id = c.id
      where c.user_id = auth.uid()
    )
  );

create policy if not exists "Users can CRUD own submissions"
  on public.submissions for all
  using (
    grader_id in (
      select g.id from public.graders g
      join public.courses c on g.course_id = c.id
      where c.user_id = auth.uid()
    )
  );

create policy if not exists "Users can CRUD own submission grades"
  on public.submission_grades for all
  using (
    submission_id in (
      select s.id from public.submissions s
      join public.graders g on s.grader_id = g.id
      join public.courses c on g.course_id = c.id
      where c.user_id = auth.uid()
    )
  );

-- Step 5: Create vector search function
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

-- Step 6: File Search + LTI support
alter table public.courses
  add column if not exists file_search_store_name text;

create table if not exists public.lti_course_links (
  id uuid primary key default uuid_generate_v4(),
  platform_issuer text not null,
  client_id text not null,
  context_id text,
  resource_link_id text,
  course_id uuid references public.courses(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default now()
);

create table if not exists public.lti_launches (
  id uuid primary key default uuid_generate_v4(),
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

create policy if not exists "Users can read own LTI course links"
  on public.lti_course_links for select
  using (auth.uid() = user_id);

create policy if not exists "Users can read own LTI launches"
  on public.lti_launches for select
  using (auth.uid() = user_id);

-- ============================================
-- MIGRATION COMPLETE!
-- ============================================
```

### 2.3 Run the Script
1. Click "Run" button (or press Ctrl+Enter / Cmd+Enter)
2. Wait for completion (should take 5-10 seconds)
3. You should see "Success. No rows returned" - this is correct!

---

## Step 3: Create Storage Bucket

### 3.1 Navigate to Storage
1. Click "Storage" in the left sidebar
2. Click "Create a new bucket"

### 3.2 Configure Bucket
1. **Name:** `courses`
2. **Public bucket:** ✅ Check this (or configure RLS policies)
3. Click "Create bucket"

### 3.3 Set Bucket Policies (Optional - for public access)
1. Click on the `courses` bucket
2. Click "Policies" tab
3. Click "New Policy"
4. Use this policy for public read access:

```sql
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'courses');

CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'courses'
  AND auth.role() = 'authenticated'
);
```

---

## Step 4: Get Connection Credentials

### 4.1 Get Project URL
1. Go to Project Settings (gear icon in left sidebar)
2. Click "API" tab
3. Find "Project URL" - copy this
4. Example: `https://abcdefghijklmnop.supabase.co`

### 4.2 Get API Keys
On the same "API" page:

1. **anon / public key:**
   - Copy the key under "Project API keys" → "anon public"
   - This is safe to use in frontend code

2. **service_role key:**
   - Copy the key under "Project API keys" → "service_role"
   - ⚠️ **NEVER expose this in frontend!** Backend only!

---

## Step 5: Configure Environment Variables

### 5.1 Server Environment (.env)

Edit `server/.env`:

```env
# Supabase Configuration
SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Google Gemini AI
GEMINI_API_KEY=AIzaSy...  # Get from https://ai.google.dev

# Server Configuration
PORT=4000
NODE_ENV=development

# Redis Configuration (for BullMQ job queues)
REDIS_URL=redis://localhost:6379

# Supabase Storage
STORAGE_BUCKET=courses

# Client URL (for Socket.IO CORS)
CLIENT_URL=http://localhost:3000
```

### 5.2 Client Environment (.env)

Edit `client/.env`:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:4000/api

# Supabase Configuration (for client-side auth)
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Where to find these values:**
- `YOUR_PROJECT_ID`: From Step 4.1 (Project URL)
- `SUPABASE_SERVICE_ROLE_KEY`: From Step 4.2 (service_role key) - **backend only!**
- `SUPABASE_ANON_KEY`: From Step 4.2 (anon public key) - safe for frontend
- `GEMINI_API_KEY`: Get from Google AI Studio (https://ai.google.dev)

---

## Step 6: Verify Setup

### 6.1 Check Database Tables

In Supabase SQL Editor, run:

```sql
-- List all tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

You should see:
- course_embeddings
- course_files
- courses
- graders
- profiles
- rubrics
- submission_grades
- submissions

### 6.2 Check pgvector Extension

```sql
SELECT * FROM pg_extension WHERE extname = 'vector';
```

Should return 1 row showing the vector extension.

### 6.3 Check Vector Search Function

```sql
SELECT routine_name
FROM information_schema.routines
WHERE routine_name = 'match_course_embeddings';
```

Should return 1 row.

### 6.4 Test Authentication

1. Go to "Authentication" → "Users" in Supabase dashboard
2. Click "Add user" → "Create new user"
3. Enter email and password
4. Click "Create user"
5. This will create a test account you can use

---

## 🎉 Setup Complete!

Your Supabase database is now configured with:
- ✅ All tables created
- ✅ Row Level Security (RLS) policies in place
- ✅ Vector search function for RAG
- ✅ pgvector extension enabled
- ✅ Storage bucket for files
- ✅ Ready for authentication

---

## 🚀 Next Steps

1. **Start Redis:**
   ```bash
   redis-server
   ```

2. **Start Backend:**
   ```bash
   cd server
   npm run dev
   ```

3. **Start Frontend:**
   ```bash
   cd client
   npm run dev
   ```

4. **Test the Application:**
   - Open http://localhost:3000
   - Sign up with your test account
   - Create a course
   - Upload grader files
   - Test grading!

---

## 🐛 Troubleshooting

### Error: "relation 'public.profiles' does not exist"
**Fix:** Re-run the complete migration script from Step 2.2

### Error: "type 'vector' does not exist"
**Fix:** Run `create extension if not exists "vector";` in SQL Editor

### Error: "function match_course_embeddings does not exist"
**Fix:** Re-run just the vector search function from Step 2.2 (Step 5)

### Storage: "Bucket not found"
**Fix:** Recreate the `courses` bucket in Storage section

### Auth: "Invalid API key"
**Fix:** Double-check you copied the full anon key (very long string starting with "eyJ...")

---

## 📖 Additional Resources

- **Supabase Docs:** https://supabase.com/docs
- **pgvector Docs:** https://github.com/pgvector/pgvector
- **Vector Search Guide:** https://supabase.com/docs/guides/ai/vector-search

---

**Created for:** Cleverly AI Grader MVP
**Last Updated:** December 14, 2025
