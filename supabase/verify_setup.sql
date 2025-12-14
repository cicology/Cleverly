-- ============================================================================
-- CLEVERLY - SETUP VERIFICATION SCRIPT
-- ============================================================================
-- Run this script after completing the initial setup to verify everything
-- is configured correctly
-- ============================================================================

-- Set better display options
\x off
SET client_min_messages TO NOTICE;

-- ============================================================================
-- 1. CHECK POSTGRESQL EXTENSIONS
-- ============================================================================

SELECT '=== CHECKING EXTENSIONS ===' as step;

SELECT
  extname as extension_name,
  extversion as version,
  CASE
    WHEN extname = 'uuid-ossp' THEN 'Required for UUID generation'
    WHEN extname = 'vector' THEN 'Required for pgvector similarity search'
    ELSE 'Other extension'
  END as purpose
FROM pg_extension
WHERE extname IN ('uuid-ossp', 'vector')
ORDER BY extname;

-- Verify we have the required extensions
DO $$
DECLARE
  uuid_ossp_count INTEGER;
  vector_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO uuid_ossp_count FROM pg_extension WHERE extname = 'uuid-ossp';
  SELECT COUNT(*) INTO vector_count FROM pg_extension WHERE extname = 'vector';

  IF uuid_ossp_count = 0 THEN
    RAISE EXCEPTION 'MISSING EXTENSION: uuid-ossp is not enabled!';
  END IF;

  IF vector_count = 0 THEN
    RAISE EXCEPTION 'MISSING EXTENSION: vector (pgvector) is not enabled!';
  END IF;

  RAISE NOTICE 'SUCCESS: All required extensions are enabled';
END $$;

-- ============================================================================
-- 2. CHECK TABLES
-- ============================================================================

SELECT '=== CHECKING TABLES ===' as step;

WITH expected_tables AS (
  SELECT unnest(ARRAY[
    'profiles',
    'courses',
    'course_files',
    'course_embeddings',
    'graders',
    'rubrics',
    'submissions',
    'submission_grades'
  ]) as table_name
),
actual_tables AS (
  SELECT table_name
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE'
)
SELECT
  et.table_name,
  CASE
    WHEN at.table_name IS NOT NULL THEN 'EXISTS'
    ELSE 'MISSING'
  END as status,
  CASE
    WHEN et.table_name = 'profiles' THEN 'User profiles (extends auth.users)'
    WHEN et.table_name = 'courses' THEN 'Course information'
    WHEN et.table_name = 'course_files' THEN 'Uploaded course files (PDFs, docs)'
    WHEN et.table_name = 'course_embeddings' THEN 'Vector embeddings for RAG'
    WHEN et.table_name = 'graders' THEN 'Grading assignments/tests'
    WHEN et.table_name = 'rubrics' THEN 'Grading rubrics from memos'
    WHEN et.table_name = 'submissions' THEN 'Student submissions'
    WHEN et.table_name = 'submission_grades' THEN 'Individual question grades'
    ELSE 'Unknown'
  END as purpose
FROM expected_tables et
LEFT JOIN actual_tables at ON et.table_name = at.table_name
ORDER BY et.table_name;

-- ============================================================================
-- 3. CHECK INDEXES
-- ============================================================================

SELECT '=== CHECKING INDEXES ===' as step;

SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND (
    indexname LIKE 'idx_%'
    OR indexname LIKE '%_pkey'
  )
ORDER BY tablename, indexname;

-- Check if vector index exists
SELECT
  CASE
    WHEN EXISTS (
      SELECT 1 FROM pg_indexes
      WHERE schemaname = 'public'
        AND indexname = 'idx_course_embeddings_vector'
    ) THEN 'Vector index exists (IVFFlat for similarity search)'
    ELSE 'WARNING: Vector index is missing!'
  END as vector_index_status;

-- ============================================================================
-- 4. CHECK ROW LEVEL SECURITY (RLS)
-- ============================================================================

SELECT '=== CHECKING ROW LEVEL SECURITY ===' as step;

WITH expected_rls_tables AS (
  SELECT unnest(ARRAY[
    'profiles',
    'courses',
    'course_files',
    'course_embeddings',
    'graders',
    'rubrics',
    'submissions',
    'submission_grades'
  ]) as table_name
)
SELECT
  et.table_name,
  COALESCE(pt.rowsecurity, false) as rls_enabled,
  CASE
    WHEN COALESCE(pt.rowsecurity, false) THEN 'PROTECTED'
    ELSE 'WARNING: RLS NOT ENABLED!'
  END as status
FROM expected_rls_tables et
LEFT JOIN pg_tables pt ON et.table_name = pt.tablename AND pt.schemaname = 'public'
ORDER BY et.table_name;

-- Count RLS policies per table
SELECT
  schemaname,
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY schemaname, tablename
ORDER BY tablename;

-- ============================================================================
-- 5. CHECK FUNCTIONS
-- ============================================================================

SELECT '=== CHECKING FUNCTIONS ===' as step;

SELECT
  routine_name as function_name,
  routine_type as type,
  data_type as return_type,
  CASE
    WHEN routine_name = 'match_course_embeddings' THEN 'Vector similarity search for RAG'
    ELSE 'Other function'
  END as purpose
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'match_course_embeddings';

-- Verify the function signature
SELECT
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as arguments,
  pg_get_function_result(p.oid) as returns
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'match_course_embeddings';

-- ============================================================================
-- 6. CHECK STORAGE BUCKETS
-- ============================================================================

SELECT '=== CHECKING STORAGE BUCKETS ===' as step;

SELECT
  id,
  name,
  public as is_public,
  file_size_limit,
  created_at,
  CASE
    WHEN name = 'courses' THEN 'Main storage for course files'
    ELSE 'Other bucket'
  END as purpose
FROM storage.buckets
ORDER BY name;

-- Verify courses bucket exists
SELECT
  CASE
    WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'courses') THEN
      'SUCCESS: courses bucket exists'
    ELSE
      'WARNING: courses bucket is missing! Create it in Supabase Storage UI'
  END as bucket_status;

-- Check storage policies
SELECT
  bucket_id,
  name as policy_name,
  definition
FROM storage.policies
WHERE bucket_id = 'courses'
ORDER BY name;

-- ============================================================================
-- 7. CHECK TABLE RELATIONSHIPS
-- ============================================================================

SELECT '=== CHECKING FOREIGN KEY RELATIONSHIPS ===' as step;

SELECT
  tc.table_name as from_table,
  kcu.column_name as from_column,
  ccu.table_name as to_table,
  ccu.column_name as to_column,
  rc.delete_rule
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints rc
  ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- ============================================================================
-- 8. CHECK COLUMN TYPES
-- ============================================================================

SELECT '=== CHECKING CRITICAL COLUMN TYPES ===' as step;

-- Verify vector column
SELECT
  table_name,
  column_name,
  data_type,
  udt_name,
  CASE
    WHEN udt_name = 'vector' THEN 'CORRECT: Using pgvector type'
    ELSE 'WARNING: Not using vector type!'
  END as validation
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'course_embeddings'
  AND column_name = 'embedding';

-- Check vector dimension
SELECT
  table_name,
  column_name,
  atttypmod,
  CASE
    WHEN atttypmod = 772 THEN 'CORRECT: 768 dimensions (Gemini embedding size)'
    ELSE 'WARNING: Unexpected vector dimension'
  END as dimension_check
FROM pg_attribute
JOIN pg_class ON pg_attribute.attrelid = pg_class.oid
WHERE pg_class.relname = 'course_embeddings'
  AND attname = 'embedding';

-- ============================================================================
-- 9. SUMMARY
-- ============================================================================

SELECT '=== SETUP VERIFICATION SUMMARY ===' as step;

WITH verification_summary AS (
  SELECT 'Extensions' as component,
    (SELECT COUNT(*) FROM pg_extension WHERE extname IN ('uuid-ossp', 'vector')) as actual_count,
    2 as expected_count
  UNION ALL
  SELECT 'Tables',
    (SELECT COUNT(*)
     FROM information_schema.tables
     WHERE table_schema = 'public'
       AND table_name IN ('profiles', 'courses', 'course_files', 'course_embeddings',
                         'graders', 'rubrics', 'submissions', 'submission_grades')),
    8
  UNION ALL
  SELECT 'RLS Enabled Tables',
    (SELECT COUNT(*)
     FROM pg_tables
     WHERE schemaname = 'public'
       AND rowsecurity = true),
    8
  UNION ALL
  SELECT 'Functions',
    (SELECT COUNT(*)
     FROM information_schema.routines
     WHERE routine_schema = 'public'
       AND routine_name = 'match_course_embeddings'),
    1
  UNION ALL
  SELECT 'Storage Buckets',
    (SELECT COUNT(*) FROM storage.buckets WHERE name = 'courses'),
    1
)
SELECT
  component,
  actual_count,
  expected_count,
  CASE
    WHEN actual_count = expected_count THEN 'PASS'
    WHEN actual_count < expected_count THEN 'FAIL - Missing items'
    ELSE 'WARN - Extra items'
  END as status
FROM verification_summary;

-- ============================================================================
-- 10. FINAL CHECK
-- ============================================================================

DO $$
DECLARE
  all_checks_passed BOOLEAN := true;
  extension_count INTEGER;
  table_count INTEGER;
  rls_count INTEGER;
  function_count INTEGER;
  bucket_count INTEGER;
BEGIN
  -- Check extensions
  SELECT COUNT(*) INTO extension_count FROM pg_extension WHERE extname IN ('uuid-ossp', 'vector');
  IF extension_count < 2 THEN
    all_checks_passed := false;
    RAISE WARNING 'FAILED: Missing required extensions';
  END IF;

  -- Check tables
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name IN ('profiles', 'courses', 'course_files', 'course_embeddings',
                      'graders', 'rubrics', 'submissions', 'submission_grades');
  IF table_count < 8 THEN
    all_checks_passed := false;
    RAISE WARNING 'FAILED: Missing required tables';
  END IF;

  -- Check RLS
  SELECT COUNT(*) INTO rls_count
  FROM pg_tables
  WHERE schemaname = 'public'
    AND rowsecurity = true;
  IF rls_count < 8 THEN
    all_checks_passed := false;
    RAISE WARNING 'FAILED: RLS not enabled on all tables';
  END IF;

  -- Check function
  SELECT COUNT(*) INTO function_count
  FROM information_schema.routines
  WHERE routine_schema = 'public'
    AND routine_name = 'match_course_embeddings';
  IF function_count < 1 THEN
    all_checks_passed := false;
    RAISE WARNING 'FAILED: Vector search function missing';
  END IF;

  -- Check storage bucket
  SELECT COUNT(*) INTO bucket_count FROM storage.buckets WHERE name = 'courses';
  IF bucket_count < 1 THEN
    all_checks_passed := false;
    RAISE WARNING 'FAILED: Storage bucket missing';
  END IF;

  IF all_checks_passed THEN
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'SUCCESS: ALL CHECKS PASSED!';
    RAISE NOTICE 'Your Supabase database is correctly configured.';
    RAISE NOTICE '===========================================';
  ELSE
    RAISE WARNING '===========================================';
    RAISE WARNING 'SOME CHECKS FAILED - Review the output above';
    RAISE WARNING '===========================================';
  END IF;
END $$;
