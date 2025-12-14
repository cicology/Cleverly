-- ============================================================================
-- CLEVERLY - STORAGE BUCKET POLICIES
-- ============================================================================
-- These policies control access to the 'courses' storage bucket
-- Run this AFTER creating the 'courses' bucket in Supabase Storage UI
-- ============================================================================

-- ============================================================================
-- IMPORTANT: Create the bucket first!
-- ============================================================================
-- 1. Go to Supabase Dashboard > Storage
-- 2. Click "Create a new bucket"
-- 3. Name: courses
-- 4. Public: UNCHECKED (private bucket)
-- 5. Click "Create bucket"
-- 6. Then run this script
-- ============================================================================

-- ============================================================================
-- POLICY 1: Users can upload files to their own folders
-- ============================================================================
-- This allows authenticated users to upload files to folders named after their user ID
-- File path structure: courses/{user_id}/...

create policy "Users can upload files"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'courses' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- ============================================================================
-- POLICY 2: Users can read their own files
-- ============================================================================
-- This allows users to download/view files they uploaded

create policy "Users can read own files"
on storage.objects for select
to authenticated
using (
  bucket_id = 'courses' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- ============================================================================
-- POLICY 3: Users can update their own files
-- ============================================================================
-- This allows users to update/replace files they uploaded

create policy "Users can update own files"
on storage.objects for update
to authenticated
using (
  bucket_id = 'courses' AND
  auth.uid()::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'courses' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- ============================================================================
-- POLICY 4: Users can delete their own files
-- ============================================================================
-- This allows users to delete files they uploaded

create policy "Users can delete own files"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'courses' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- Check that policies are created correctly

SELECT
  id,
  name,
  definition
FROM storage.policies
WHERE bucket_id = 'courses'
ORDER BY name;

-- ============================================================================
-- EXPLANATION OF FILE PATH STRUCTURE
-- ============================================================================
-- Files in the bucket should be organized as:
-- courses/
--   └── {user_id}/              -- User's UUID from auth.users
--       ├── courses/             -- Course files
--       │   └── {course_id}/
--       │       ├── textbook.pdf
--       │       └── study_guide.pdf
--       ├── graders/             -- Grading assignments
--       │   └── {grader_id}/
--       │       ├── test.pdf
--       │       └── memo.pdf
--       └── submissions/         -- Student submissions
--           └── {submission_id}/
--               └── student_work.pdf
--
-- The policies check that the first folder name matches the authenticated user's ID
-- Example: A user with ID "abc123" can only access files in "courses/abc123/..."
-- ============================================================================

-- ============================================================================
-- TESTING THE POLICIES (OPTIONAL)
-- ============================================================================
-- You can test the policies using the Supabase client in your application
-- or through the Supabase Storage UI by trying to upload/download files
-- ============================================================================

-- Example test query (run as an authenticated user):
-- This would be done through the Supabase client SDK, not SQL

-- Upload test:
-- supabase.storage.from('courses').upload(`${userId}/test.txt`, file)

-- Download test:
-- supabase.storage.from('courses').download(`${userId}/test.txt`)

-- Delete test:
-- supabase.storage.from('courses').remove([`${userId}/test.txt`])

-- ============================================================================
-- TROUBLESHOOTING
-- ============================================================================

-- If policies aren't working:

-- 1. Check bucket exists and RLS is enabled
SELECT
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE name = 'courses';

-- 2. Check all policies are created
SELECT count(*) as policy_count
FROM storage.policies
WHERE bucket_id = 'courses';
-- Should return at least 4

-- 3. Check policy definitions
SELECT name, definition
FROM storage.policies
WHERE bucket_id = 'courses';

-- 4. If you need to reset policies (careful!):
-- DROP POLICY IF EXISTS "Users can upload files" ON storage.objects;
-- DROP POLICY IF EXISTS "Users can read own files" ON storage.objects;
-- DROP POLICY IF EXISTS "Users can update own files" ON storage.objects;
-- DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;
-- Then re-run this script

-- ============================================================================
-- ADDITIONAL NOTES
-- ============================================================================

-- File size limits:
-- The default file size limit is set at the bucket level (not in policies)
-- To change it: Go to Storage > courses bucket > Settings > File size limit

-- Allowed MIME types:
-- You can restrict file types at the bucket level
-- Recommended for courses: application/pdf, image/*, text/*

-- Public vs Private:
-- The 'courses' bucket should be PRIVATE
-- Files are only accessible to authenticated users via their JWT token

-- ============================================================================
-- SETUP COMPLETE!
-- ============================================================================
-- Your storage bucket is now properly secured with Row Level Security
-- Users can only access their own files
-- ============================================================================
