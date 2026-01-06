-- =====================================================
-- CLEVERLY AI GRADING - DATABASE VERIFICATION SCRIPT
-- =====================================================
-- Run this script in Supabase SQL Editor to verify
-- grading test data and system integrity
-- =====================================================

-- 1. OVERVIEW STATISTICS
-- =====================================================
SELECT
  'Database Overview' as section,
  (SELECT COUNT(*) FROM courses) as total_courses,
  (SELECT COUNT(*) FROM graders) as total_graders,
  (SELECT COUNT(*) FROM rubrics) as total_rubric_items,
  (SELECT COUNT(*) FROM submissions) as total_submissions,
  (SELECT COUNT(*) FROM submission_grades) as total_grades,
  (SELECT COUNT(*) FROM submission_grades WHERE is_overridden = true) as overridden_grades;

-- 2. RECENT TEST COURSES
-- =====================================================
SELECT
  'Recent Test Courses' as section,
  id,
  title,
  description,
  created_at,
  (SELECT COUNT(*) FROM graders WHERE course_id = courses.id) as grader_count
FROM courses
ORDER BY created_at DESC
LIMIT 5;

-- 3. GRADER STATUS BREAKDOWN
-- =====================================================
SELECT
  'Grader Status' as section,
  g.id,
  g.title,
  g.status,
  g.total_marks,
  COUNT(DISTINCT r.id) as rubric_items,
  COUNT(DISTINCT s.id) as submissions,
  g.created_at
FROM graders g
LEFT JOIN rubrics r ON r.grader_id = g.id
LEFT JOIN submissions s ON s.grader_id = g.id
GROUP BY g.id
ORDER BY g.created_at DESC
LIMIT 5;

-- 4. RUBRIC EXTRACTION QUALITY
-- =====================================================
SELECT
  'Rubric Quality Check' as section,
  g.id as grader_id,
  g.title as grader_title,
  COUNT(r.id) as rubric_items,
  SUM(r.max_marks) as total_marks,
  g.total_marks as expected_total,
  CASE
    WHEN SUM(r.max_marks) = g.total_marks THEN 'PERFECT MATCH'
    WHEN ABS(SUM(r.max_marks) - COALESCE(g.total_marks, 0)) <= 10 THEN 'ACCEPTABLE'
    ELSE 'MISMATCH'
  END as marks_match,
  MIN(LENGTH(r.expected_answer)) as min_answer_length,
  AVG(LENGTH(r.expected_answer))::int as avg_answer_length,
  MAX(LENGTH(r.expected_answer)) as max_answer_length
FROM graders g
LEFT JOIN rubrics r ON r.grader_id = g.id
GROUP BY g.id, g.title, g.total_marks
HAVING COUNT(r.id) > 0
ORDER BY g.created_at DESC;

-- 5. SUBMISSION STATUS OVERVIEW
-- =====================================================
SELECT
  'Submission Status' as section,
  s.status,
  COUNT(*) as count,
  AVG(s.percentage)::numeric(5,2) as avg_percentage,
  MIN(s.percentage)::numeric(5,2) as min_percentage,
  MAX(s.percentage)::numeric(5,2) as max_percentage
FROM submissions s
GROUP BY s.status
ORDER BY
  CASE s.status
    WHEN 'graded' THEN 1
    WHEN 'processing' THEN 2
    WHEN 'pending' THEN 3
    WHEN 'flagged' THEN 4
    ELSE 5
  END;

-- 6. DETAILED GRADING RESULTS
-- =====================================================
SELECT
  'Detailed Results' as section,
  s.id as submission_id,
  s.student_identifier,
  s.status,
  s.total_score,
  s.max_possible_score,
  s.percentage::numeric(5,2) as percentage,
  COUNT(sg.id) as grades_count,
  AVG(sg.confidence_score)::numeric(3,2) as avg_confidence,
  MIN(sg.confidence_score)::numeric(3,2) as min_confidence,
  SUM(CASE WHEN sg.is_overridden THEN 1 ELSE 0 END) as overridden_count,
  s.processed_at
FROM submissions s
LEFT JOIN submission_grades sg ON sg.submission_id = s.id
GROUP BY s.id, s.student_identifier, s.status, s.total_score,
         s.max_possible_score, s.percentage, s.processed_at
ORDER BY s.created_at DESC
LIMIT 10;

-- 7. INDIVIDUAL GRADE BREAKDOWN (Latest Submission)
-- =====================================================
WITH latest_submission AS (
  SELECT id FROM submissions ORDER BY created_at DESC LIMIT 1
)
SELECT
  'Individual Grades (Latest)' as section,
  r.question_number,
  r.question_text,
  r.max_marks,
  sg.marks_awarded,
  sg.confidence_score::numeric(3,2),
  sg.is_overridden,
  SUBSTRING(sg.ai_reasoning, 1, 100) || '...' as reasoning_preview,
  r.keywords
FROM submission_grades sg
JOIN rubrics r ON r.id = sg.rubric_id
WHERE sg.submission_id = (SELECT id FROM latest_submission)
ORDER BY r.order_index;

-- 8. AI CONFIDENCE ANALYSIS
-- =====================================================
SELECT
  'Confidence Analysis' as section,
  CASE
    WHEN sg.confidence_score >= 0.9 THEN 'Very High (0.9-1.0)'
    WHEN sg.confidence_score >= 0.7 THEN 'High (0.7-0.9)'
    WHEN sg.confidence_score >= 0.5 THEN 'Medium (0.5-0.7)'
    WHEN sg.confidence_score >= 0.3 THEN 'Low (0.3-0.5)'
    ELSE 'Very Low (0.0-0.3)'
  END as confidence_range,
  COUNT(*) as grade_count,
  AVG(sg.marks_awarded)::numeric(5,2) as avg_marks,
  AVG(r.max_marks)::numeric(5,2) as avg_max_marks,
  (AVG(sg.marks_awarded) / AVG(r.max_marks) * 100)::numeric(5,2) as avg_percentage
FROM submission_grades sg
JOIN rubrics r ON r.id = sg.rubric_id
GROUP BY confidence_range
ORDER BY MIN(sg.confidence_score) DESC;

-- 9. GRADE OVERRIDE AUDIT TRAIL
-- =====================================================
SELECT
  'Override Audit' as section,
  s.student_identifier,
  r.question_number,
  sg.marks_awarded as current_marks,
  r.max_marks,
  sg.override_reason,
  sg.updated_at as override_date,
  sg.confidence_score::numeric(3,2) as original_confidence
FROM submission_grades sg
JOIN submissions s ON s.id = sg.submission_id
JOIN rubrics r ON r.id = sg.rubric_id
WHERE sg.is_overridden = true
ORDER BY sg.updated_at DESC;

-- 10. PERFORMANCE METRICS BY GRADER
-- =====================================================
SELECT
  'Grader Performance' as section,
  g.id as grader_id,
  g.title as grader_title,
  COUNT(DISTINCT s.id) as total_submissions,
  COUNT(DISTINCT CASE WHEN s.status = 'graded' THEN s.id END) as graded_count,
  COUNT(DISTINCT CASE WHEN s.status = 'flagged' THEN s.id END) as flagged_count,
  AVG(s.percentage)::numeric(5,2) as avg_score,
  STDDEV(s.percentage)::numeric(5,2) as score_stddev,
  AVG(sg.confidence_score)::numeric(3,2) as avg_ai_confidence,
  MIN(s.processed_at) as first_graded_at,
  MAX(s.processed_at) as last_graded_at
FROM graders g
LEFT JOIN submissions s ON s.grader_id = g.id
LEFT JOIN submission_grades sg ON sg.submission_id = s.id
GROUP BY g.id, g.title
HAVING COUNT(DISTINCT s.id) > 0
ORDER BY g.created_at DESC;

-- 11. GRADING ACCURACY CHECK (Compare to Expected)
-- =====================================================
-- This assumes you have reference data or can manually verify
SELECT
  'Accuracy Check' as section,
  s.student_identifier,
  s.total_score as ai_total,
  s.max_possible_score,
  s.percentage::numeric(5,2),
  -- Add manual/reference scores here for comparison
  CASE
    WHEN s.percentage >= 90 THEN 'Excellent (A)'
    WHEN s.percentage >= 80 THEN 'Very Good (B)'
    WHEN s.percentage >= 70 THEN 'Good (C)'
    WHEN s.percentage >= 60 THEN 'Satisfactory (D)'
    WHEN s.percentage >= 50 THEN 'Pass (E)'
    ELSE 'Fail (F)'
  END as grade_band,
  COUNT(sg.id) as questions_graded,
  SUM(CASE WHEN sg.confidence_score < 0.6 THEN 1 ELSE 0 END) as low_confidence_count
FROM submissions s
LEFT JOIN submission_grades sg ON sg.submission_id = s.id
WHERE s.status = 'graded'
GROUP BY s.id, s.student_identifier, s.total_score, s.max_possible_score, s.percentage
ORDER BY s.percentage DESC;

-- 12. DATA INTEGRITY CHECKS
-- =====================================================
SELECT 'Data Integrity Checks' as section;

-- Check for orphaned rubrics
SELECT
  'Orphaned Rubrics' as check_type,
  COUNT(*) as issue_count
FROM rubrics r
WHERE NOT EXISTS (SELECT 1 FROM graders g WHERE g.id = r.grader_id);

-- Check for orphaned submission grades
SELECT
  'Orphaned Grades' as check_type,
  COUNT(*) as issue_count
FROM submission_grades sg
WHERE NOT EXISTS (SELECT 1 FROM submissions s WHERE s.id = sg.submission_id);

-- Check for submissions without grades
SELECT
  'Submissions Without Grades' as check_type,
  COUNT(*) as issue_count
FROM submissions s
WHERE s.status = 'graded'
  AND NOT EXISTS (SELECT 1 FROM submission_grades sg WHERE sg.submission_id = s.id);

-- Check for negative marks
SELECT
  'Negative Marks' as check_type,
  COUNT(*) as issue_count
FROM submission_grades
WHERE marks_awarded < 0;

-- Check for marks exceeding maximum
SELECT
  'Marks Exceeding Max' as check_type,
  COUNT(*) as issue_count
FROM submission_grades sg
JOIN rubrics r ON r.id = sg.rubric_id
WHERE sg.marks_awarded > r.max_marks;

-- Check for invalid confidence scores
SELECT
  'Invalid Confidence Scores' as check_type,
  COUNT(*) as issue_count
FROM submission_grades
WHERE confidence_score < 0 OR confidence_score > 1;

-- 13. RUBRIC KEYWORD ANALYSIS
-- =====================================================
SELECT
  'Keyword Analysis' as section,
  r.question_number,
  r.keywords,
  ARRAY_LENGTH(r.keywords, 1) as keyword_count,
  r.max_marks,
  SUBSTRING(r.expected_answer, 1, 50) || '...' as answer_preview
FROM rubrics r
WHERE r.grader_id IN (
  SELECT id FROM graders ORDER BY created_at DESC LIMIT 1
)
ORDER BY r.order_index;

-- 14. PROCESSING TIME ANALYSIS
-- =====================================================
SELECT
  'Processing Time' as section,
  s.id,
  s.student_identifier,
  s.created_at as uploaded_at,
  s.processed_at as graded_at,
  EXTRACT(EPOCH FROM (s.processed_at - s.created_at))::int as processing_seconds,
  COUNT(sg.id) as questions_graded,
  EXTRACT(EPOCH FROM (s.processed_at - s.created_at))::numeric / COUNT(sg.id) as seconds_per_question
FROM submissions s
LEFT JOIN submission_grades sg ON sg.submission_id = s.id
WHERE s.status = 'graded'
  AND s.processed_at IS NOT NULL
GROUP BY s.id, s.student_identifier, s.created_at, s.processed_at
ORDER BY s.processed_at DESC
LIMIT 10;

-- 15. SUMMARY REPORT
-- =====================================================
SELECT
  'SUMMARY REPORT' as section,
  (SELECT COUNT(DISTINCT g.id) FROM graders g) as total_graders,
  (SELECT COUNT(DISTINCT s.id) FROM submissions s) as total_submissions,
  (SELECT COUNT(*) FROM submissions WHERE status = 'graded') as graded_submissions,
  (SELECT COUNT(*) FROM submission_grades) as total_individual_grades,
  (SELECT AVG(percentage)::numeric(5,2) FROM submissions WHERE status = 'graded') as avg_score_percentage,
  (SELECT AVG(confidence_score)::numeric(3,2) FROM submission_grades) as avg_ai_confidence,
  (SELECT COUNT(*) FROM submission_grades WHERE is_overridden = true) as total_overrides,
  (SELECT COUNT(*) FROM submissions WHERE status = 'flagged') as flagged_submissions,
  (SELECT MAX(created_at) FROM submissions) as last_submission_time,
  (SELECT MAX(processed_at) FROM submissions) as last_grading_time;

-- =====================================================
-- END OF VERIFICATION SCRIPT
-- =====================================================
-- Copy individual queries above to investigate specific areas
-- All queries are safe (SELECT only, no modifications)
-- =====================================================
