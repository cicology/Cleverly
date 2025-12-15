# Cleverly - Complete Supabase Setup Guide

This guide will walk you through setting up your Supabase project from scratch, including database schema, vector search, storage, and environment configuration.

## Table of Contents
1. [Create Supabase Project](#1-create-supabase-project)
2. [Run Database Migrations](#2-run-database-migrations)
3. [Set Up Storage Bucket](#3-set-up-storage-bucket)
4. [Configure Environment Variables](#4-configure-environment-variables)
5. [Verify Setup](#5-verify-setup)
6. [Test Vector Search](#6-test-vector-search)
7. [Troubleshooting](#7-troubleshooting)

---

## 1. Create Supabase Project

### Step 1.1: Sign Up / Log In
1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project" or "Sign in"
3. Sign in with GitHub, Google, or email

### Step 1.2: Create New Project
1. Click "New Project" button
2. Fill in the details:
   - **Name**: `cleverly` (or any name you prefer)
   - **Database Password**: Choose a strong password and **SAVE IT**
   - **Region**: Choose the closest region to your users
   - **Pricing Plan**: Free tier is fine for development
3. Click "Create new project"
4. Wait 2-3 minutes for the project to be provisioned

### Step 1.3: Note Your Project Details
Once the project is created, you'll see the project dashboard. Keep this page open - you'll need it later.

---

## 2. Run Database Migrations

### Step 2.1: Open SQL Editor
1. In your Supabase project dashboard, click on the **"SQL Editor"** icon in the left sidebar
2. Click "New query" to open a blank SQL editor

### Step 2.2: Copy Complete Setup SQL
1. Open the file `supabase/complete_setup.sql` in this repository
2. Copy the **entire contents** of the file
3. Paste it into the Supabase SQL Editor

### Step 2.3: Execute the SQL
1. Click the "Run" button (or press Ctrl+Enter / Cmd+Enter)
2. Wait for the query to complete (should take 5-10 seconds)
3. You should see success messages for each table and function created

### Step 2.4: Verify Extensions
The script automatically enables these extensions:
- **uuid-ossp**: For generating UUIDs
- **vector**: For vector similarity search (pgvector)

To verify they're enabled:
1. In the SQL Editor, run:
```sql
SELECT * FROM pg_extension WHERE extname IN ('uuid-ossp', 'vector');
```
2. You should see both extensions listed

### What Was Created?
The migration script created:
- **Tables**: profiles, courses, course_files, course_embeddings, graders, rubrics, submissions, submission_grades
- **Vector Index**: For fast similarity search on embeddings
- **RLS Policies**: Row-level security to protect user data
- **Function**: `match_course_embeddings()` for vector search

---

## 3. Set Up Storage Bucket

Storage is used to store course files (PDFs, documents), test files, and student submissions.

### Step 3.1: Navigate to Storage
1. Click on the **"Storage"** icon in the left sidebar
2. Click "Create a new bucket"

### Step 3.2: Create Courses Bucket
1. Fill in the details:
   - **Name**: `courses` (must be exactly this name)
   - **Public bucket**: UNCHECK this box (keep it private)
   - **File size limit**: 50 MB (or adjust based on your needs)
   - **Allowed MIME types**: Leave blank or add: `application/pdf`, `image/*`, `text/*`
2. Click "Create bucket"

### Step 3.3: Configure Bucket Policies
1. Click on the `courses` bucket
2. Click on "Policies" tab
3. Click "New Policy"
4. Select "Create a custom policy"
5. Add these policies:

#### Policy 1: Users can upload to their own folders
```sql
-- Policy name: Users can upload files
-- Allowed operation: INSERT

-- Target roles: authenticated
-- USING expression:
bucket_id = 'courses' AND auth.uid()::text = (storage.foldername(name))[1]

-- WITH CHECK expression:
bucket_id = 'courses' AND auth.uid()::text = (storage.foldername(name))[1]
```

#### Policy 2: Users can read their own files
```sql
-- Policy name: Users can read own files
-- Allowed operation: SELECT

-- Target roles: authenticated
-- USING expression:
bucket_id = 'courses' AND auth.uid()::text = (storage.foldername(name))[1]
```

#### Policy 3: Users can delete their own files
```sql
-- Policy name: Users can delete own files
-- Allowed operation: DELETE

-- Target roles: authenticated
-- USING expression:
bucket_id = 'courses' AND auth.uid()::text = (storage.foldername(name))[1]
```

---

## 4. Configure Environment Variables

You need to set up environment variables in two places: backend (server) and frontend (client).

### Step 4.1: Get Your Supabase Credentials

1. Go to your Supabase project dashboard
2. Click on the **"Settings"** icon (gear icon) in the left sidebar
3. Click on **"API"** under Project Settings

You'll see:
- **Project URL**: Something like `https://abcdefghijk.supabase.co`
- **Project API keys**:
  - **anon public**: This is your `SUPABASE_ANON_KEY`
  - **service_role secret**: This is your `SUPABASE_SERVICE_ROLE_KEY` (keep this secret!)

### Step 4.2: Get Your Google Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the API key

### Step 4.3: Configure Backend (.env)

1. Open `server/.env` in your code editor
2. Replace the placeholder values:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
SUPABASE_ANON_KEY=your-anon-key-here

# Google Gemini AI
GEMINI_API_KEY=your-gemini-api-key-here

# Server Configuration
PORT=4000
NODE_ENV=development

# Redis Configuration (for BullMQ job queues)
REDIS_URL=redis://localhost:6379

# Supabase Storage
STORAGE_BUCKET=courses

# Client URL (for Socket.IO CORS)
CLIENT_URL=http://localhost:5173
```

**Where to find each value:**
- `SUPABASE_URL`: Settings > API > Project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Settings > API > service_role key (secret!)
- `SUPABASE_ANON_KEY`: Settings > API > anon public key
- `GEMINI_API_KEY`: From Google AI Studio
- Other values: Keep as default unless you need to change ports

### Step 4.4: Configure Frontend (.env)

1. Open `client/.env` in your code editor
2. Replace the placeholder values:

```env
# API Configuration
VITE_API_URL=http://localhost:4000/api

# Supabase Configuration (for client-side auth if needed)
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Where to find each value:**
- `VITE_SUPABASE_URL`: Settings > API > Project URL (same as backend)
- `VITE_SUPABASE_ANON_KEY`: Settings > API > anon public key (same as backend)

### Step 4.5: Important Security Notes

- **NEVER commit** `.env` files to version control
- **NEVER share** your `SERVICE_ROLE_KEY` publicly
- The `ANON_KEY` is safe to use in frontend code
- The `SERVICE_ROLE_KEY` should ONLY be used in backend code

---

## 5. Verify Setup

### Step 5.1: Run Verification Script

1. In Supabase SQL Editor, create a new query
2. Copy and paste the following:

```sql
-- ============================================================================
-- CLEVERLY - SETUP VERIFICATION SCRIPT
-- ============================================================================

-- Check Extensions
SELECT
  'Extensions' as check_type,
  extname as name,
  'OK' as status
FROM pg_extension
WHERE extname IN ('uuid-ossp', 'vector');

-- Check Tables
SELECT
  'Tables' as check_type,
  table_name as name,
  CASE WHEN table_name IN (
    'profiles', 'courses', 'course_files', 'course_embeddings',
    'graders', 'rubrics', 'submissions', 'submission_grades'
  ) THEN 'OK' ELSE 'UNEXPECTED' END as status
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check Functions
SELECT
  'Functions' as check_type,
  routine_name as name,
  'OK' as status
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'match_course_embeddings';

-- Check RLS Policies
SELECT
  'RLS Policies' as check_type,
  tablename as name,
  CASE WHEN rowsecurity THEN 'ENABLED' ELSE 'DISABLED' END as status
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Check Storage Buckets
SELECT
  'Storage' as check_type,
  name,
  CASE WHEN name = 'courses' THEN 'OK' ELSE 'UNEXPECTED' END as status
FROM storage.buckets;
```

3. Run the query
4. Verify all checks show "OK" or "ENABLED"

### Step 5.2: Expected Results

You should see:
- **Extensions**: 2 rows (uuid-ossp, vector)
- **Tables**: 8 rows (all showing 'OK')
- **Functions**: 1 row (match_course_embeddings)
- **RLS Policies**: 8 rows (all showing 'ENABLED')
- **Storage**: 1 row (courses bucket)

If anything is missing, review the previous steps.

---

## 6. Test Vector Search

To verify that vector search is working correctly, let's insert some test data and run a search.

### Step 6.1: Insert Test Data

In the SQL Editor, run:

```sql
-- Create a test user profile (using a dummy UUID)
INSERT INTO public.profiles (id, email, full_name)
VALUES ('00000000-0000-0000-0000-000000000001', 'test@example.com', 'Test User');

-- Create a test course
INSERT INTO public.courses (id, user_id, title, description)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  'Introduction to Machine Learning',
  'A comprehensive course on ML fundamentals'
);

-- Create a test course file
INSERT INTO public.course_files (id, course_id, file_name, file_type, file_path, status)
VALUES (
  '00000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000002',
  'ml_textbook.pdf',
  'textbook',
  'test/ml_textbook.pdf',
  'embedded'
);

-- Insert some test embeddings (using random vectors for demonstration)
-- In production, these would be generated by the Gemini embedding model
INSERT INTO public.course_embeddings (course_file_id, content_chunk, embedding)
VALUES (
  '00000000-0000-0000-0000-000000000003',
  'Machine learning is a subset of artificial intelligence that focuses on training algorithms to learn patterns from data.',
  -- This is a dummy 768-dimensional vector (all zeros for simplicity)
  array_fill(0, ARRAY[768])::vector(768)
);

INSERT INTO public.course_embeddings (course_file_id, content_chunk, embedding)
VALUES (
  '00000000-0000-0000-0000-000000000003',
  'Supervised learning involves training models on labeled data to make predictions on new, unseen data.',
  array_fill(0.1, ARRAY[768])::vector(768)
);

INSERT INTO public.course_embeddings (course_file_id, content_chunk, embedding)
VALUES (
  '00000000-0000-0000-0000-000000000003',
  'Neural networks are computing systems inspired by biological neural networks in animal brains.',
  array_fill(0.2, ARRAY[768])::vector(768)
);

SELECT 'Test data inserted successfully!' as status;
```

### Step 6.2: Test Vector Search Function

Now test the `match_course_embeddings` function:

```sql
-- Test the vector search function
-- Using a query vector (all zeros) to find similar chunks
SELECT
  id,
  content_chunk,
  similarity
FROM match_course_embeddings(
  array_fill(0, ARRAY[768])::vector(768),  -- query embedding
  '00000000-0000-0000-0000-000000000002'::uuid,  -- course_id
  3  -- return top 3 matches
);
```

### Step 6.3: Expected Results

You should see 3 rows returned with:
- The chunk content
- Similarity scores (between 0 and 1)
- The chunks should be ordered by similarity

### Step 6.4: Clean Up Test Data

After testing, clean up the test data:

```sql
-- Clean up test data
DELETE FROM public.profiles WHERE id = '00000000-0000-0000-0000-000000000001';
-- This will cascade delete all related records

SELECT 'Test data cleaned up!' as status;
```

---

## 7. Troubleshooting

### Problem: "extension 'vector' does not exist"

**Solution:**
1. Ensure pgvector is enabled in your Supabase project
2. Go to Database > Extensions
3. Enable "vector" extension
4. Re-run the migration script

### Problem: "permission denied for schema public"

**Solution:**
- Ensure you're using the SQL Editor in Supabase (not a direct PostgreSQL connection)
- The SQL Editor runs with admin privileges

### Problem: Storage bucket policies not working

**Solution:**
1. Verify the bucket name is exactly "courses"
2. Check that RLS is enabled on the bucket
3. Verify policies are created correctly
4. Test with a real authenticated user (not the test UUID)

### Problem: "cannot find module" errors in backend

**Solution:**
1. Ensure Redis is running: `redis-server`
2. Install dependencies: `cd server && npm install`
3. Check all environment variables are set correctly

### Problem: Vector search returns no results

**Solution:**
1. Verify embeddings exist: `SELECT COUNT(*) FROM course_embeddings;`
2. Check the course_id matches the course in your query
3. Ensure embedding dimensions are correct (768 for Gemini)
4. Verify the vector index was created: `\d course_embeddings` in psql

### Problem: RLS policies blocking legitimate access

**Solution:**
1. Verify `auth.uid()` matches the user_id in your data
2. Check that you're using an authenticated session
3. Temporarily disable RLS for debugging (re-enable after!):
   ```sql
   ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;
   ```

---

## Next Steps

Once your Supabase setup is complete:

1. **Start Redis** (required for job queues):
   ```bash
   redis-server
   ```

2. **Start the backend**:
   ```bash
   cd server
   npm install
   npm run dev
   ```

3. **Start the frontend**:
   ```bash
   cd client
   npm install
   npm run dev
   ```

4. **Create your first user** through the application's signup flow

5. **Upload a course file** and test the RAG functionality

---

## Summary Checklist

Use this checklist to ensure everything is set up:

- [ ] Supabase project created
- [ ] Database migrations executed successfully
- [ ] pgvector extension enabled
- [ ] uuid-ossp extension enabled
- [ ] All 8 tables created
- [ ] `match_course_embeddings` function created
- [ ] RLS enabled on all tables
- [ ] `courses` storage bucket created
- [ ] Storage policies configured
- [ ] Backend `.env` configured with correct values
- [ ] Frontend `.env` configured with correct values
- [ ] Verification script passed all checks
- [ ] Vector search test successful
- [ ] Test data cleaned up
- [ ] Redis installed and running
- [ ] Backend server starts without errors
- [ ] Frontend application loads successfully

---

## Support

If you encounter issues not covered in this guide:

1. Check the Supabase logs: Settings > Logs
2. Check your backend console for error messages
3. Verify all environment variables are set correctly
4. Ensure Redis is running
5. Check that your Gemini API key is valid

---

**Congratulations!** Your Cleverly Supabase project is now fully configured and ready to use!
