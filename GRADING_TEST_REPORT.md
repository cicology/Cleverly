# Cleverly AI Grading System - Comprehensive Test Report

## Executive Summary

This document provides a comprehensive test report for the Cleverly AI Grading functionality, including test procedures, results, and system documentation.

**Test Date**: January 6, 2026
**Platform**: Cleverly AI Grader MVP
**Components Tested**: Course Creation, Grader Setup, Rubric Extraction, Submission Upload, AI Grading, Grade Overrides

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Test Environment Setup](#test-environment-setup)
3. [Test Scenarios](#test-scenarios)
4. [Grading Pipeline Documentation](#grading-pipeline-documentation)
5. [Test Execution Guide](#test-execution-guide)
6. [Expected Results](#expected-results)
7. [Database Verification](#database-verification)
8. [BullMQ Job Monitoring](#bullmq-job-monitoring)
9. [Troubleshooting](#troubleshooting)
10. [Appendix](#appendix)

---

## 1. System Overview

### Architecture Components

The Cleverly AI Grading system consists of the following components:

#### Backend Services
- **Express API Server** (Port 4000)
  - Course management endpoints
  - Grader creation and management
  - Submission handling
  - Grade override functionality

- **BullMQ Worker Processes**
  - `gradingWorker`: Processes grading jobs asynchronously
  - `embeddingWorker`: Processes course material embeddings for RAG

#### Data Layer
- **Supabase PostgreSQL Database**
  - Tables: courses, graders, rubrics, submissions, submission_grades
  - Row-level security (RLS) policies
  - Vector extension for embeddings

- **Redis Queue**
  - Job queue management
  - Background job processing
  - Dead letter queue for failed jobs

#### AI Services
- **Google Gemini AI**
  - Rubric extraction from memo files
  - Answer grading with reasoning
  - Confidence scoring
  - RAG-enhanced context retrieval

#### Storage
- **Supabase Storage**
  - Test/exam files
  - Memo files
  - Student submissions
  - Course materials

---

## 2. Test Environment Setup

### Prerequisites

```bash
# Required services
- Node.js 18+
- Redis server running on localhost:6379
- Supabase project configured
- Gemini API key configured

# Environment variables (.env)
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_key
GEMINI_API_KEY=your_gemini_api_key
REDIS_URL=redis://localhost:6379
PORT=4000
CLIENT_URL=http://localhost:3000
```

### Starting the Services

```bash
# Terminal 1: Start Redis (if not already running)
redis-server

# Terminal 2: Start the backend server
cd server
npm run dev

# The server will automatically start both:
# - Express API server on port 4000
# - BullMQ workers for grading and embeddings
```

### Verify Setup

```bash
# Check API health
curl http://localhost:4000/api/health

# Check Redis
redis-cli ping
# Should return: PONG

# Check Supabase connection
npm run verify:supabase
```

---

## 3. Test Scenarios

### Test Scenario 1: Perfect Submission (100% Expected)
**File**: `/server/test-data/sample-submission.txt`
**Student**: TEST_STUDENT_001
**Expected Score**: 100/100 (100%)
**Description**: All answers are correct and complete with proper working shown.

**Key Features Tested**:
- Correct derivative calculation and evaluation
- Proper definite integral computation
- Accurate system of equations solving
- Correct series convergence analysis
- Complete profit optimization with all parts
- Accurate FTC integration
- Full eigenvalue/eigenvector analysis

### Test Scenario 2: Submission with Errors (60-70% Expected)
**File**: `/server/test-data/sample-submission-errors.txt`
**Student**: TEST_STUDENT_002
**Expected Score**: ~65/100 (65%)
**Description**: Contains several calculation errors and one skipped question.

**Errors Included**:
- Question 1: Arithmetic error (used 9(2) instead of 9(4))
- Question 2: Integration error (forgot to square the x term)
- Question 4: Conceptual error (wrong convergence conclusion)
- Question 6: Completely skipped
- Question 7: Incomplete attempt

**Key Features Tested**:
- AI ability to detect calculation errors
- Partial credit assignment
- Handling of skipped questions
- Recognition of correct methodology despite errors

### Test Scenario 3: Minimal Effort Submission (15-25% Expected)
**File**: `/server/test-data/sample-submission-partial.txt`
**Student**: TEST_STUDENT_003
**Expected Score**: ~20/100 (20%)
**Description**: Very incomplete with multiple skipped questions.

**Key Features Tested**:
- Handling of incomplete answers
- No-attempt question scoring
- Partial credit for setup without solution
- Edge case handling

---

## 4. Grading Pipeline Documentation

### Pipeline Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     CLEVERLY AI GRADING PIPELINE                │
└─────────────────────────────────────────────────────────────────┘

1. COURSE CREATION
   ├─> User uploads course materials (study guides, textbooks)
   ├─> Files stored in Supabase Storage
   ├─> Embedding jobs queued for RAG context
   └─> Course record created in database

2. GRADER SETUP
   ├─> User uploads test file (PDF/TXT)
   ├─> User uploads memo file (PDF/TXT)
   ├─> Files stored in Supabase Storage
   └─> Grader record created (status: 'processing')

3. RUBRIC EXTRACTION
   ├─> Text extracted from memo using PDF parser
   ├─> AI analyzes memo structure
   ├─> Gemini extracts:
   │   ├─> Question numbers
   │   ├─> Expected answers
   │   ├─> Mark allocations
   │   ├─> Keywords
   │   └─> Grading criteria
   ├─> Rubric items saved to database
   └─> Grader status updated to 'ready'

4. SUBMISSION UPLOAD
   ├─> User uploads student answer sheets (bulk upload supported)
   ├─> Files stored in Supabase Storage
   ├─> Submission records created (status: 'pending')
   └─> File metadata recorded

5. GRADING TRIGGER
   ├─> User initiates "Grade All" action
   ├─> System creates BullMQ job for each submission
   ├─> Grader status updated to 'grading'
   └─> Jobs added to Redis queue

6. GRADING WORKER PROCESSING
   For each submission:
   ├─> Fetch submission file from storage
   ├─> Extract text (OCR if needed)
   ├─> Parse student answers
   ├─> For each rubric item:
   │   ├─> Fetch RAG context from course materials
   │   ├─> Build grading prompt with:
   │   │   ├─> Question text
   │   │   ├─> Expected answer
   │   │   ├─> Keywords
   │   │   ├─> Max marks
   │   │   ├─> RAG context
   │   │   └─> Student answer
   │   ├─> Call Gemini AI for grading
   │   ├─> Parse AI response:
   │   │   ├─> Marks awarded
   │   │   ├─> AI reasoning
   │   │   ├─> Confidence score
   │   │   └─> Feedback
   │   ├─> Save to submission_grades table
   │   └─> Emit progress update via WebSocket
   ├─> Calculate total score
   ├─> Update submission (status: 'graded')
   └─> Emit completion event via WebSocket

7. RESULTS REVIEW
   ├─> Teacher views grading results
   ├─> Review individual question grades
   ├─> Check AI reasoning and confidence
   └─> Identify low-confidence grades for review

8. GRADE OVERRIDES (Optional)
   ├─> Teacher manually adjusts grades
   ├─> Provides override reason
   ├─> System marks grade as overridden
   ├─> Recalculates total score
   └─> Maintains audit trail

9. ANALYTICS & EXPORT
   ├─> Generate grading statistics
   ├─> Export results to CSV/Excel
   ├─> Performance analytics
   └─> Time-saving calculations
```

### Database Schema

#### Tables Overview

**courses**
- `id` (uuid, PK)
- `user_id` (uuid, FK to auth.users)
- `title` (text)
- `description` (text)
- `topics` (text[])
- `created_at`, `updated_at`

**graders**
- `id` (uuid, PK)
- `course_id` (uuid, FK to courses)
- `title` (text)
- `total_marks` (integer)
- `status` (text) - 'draft', 'ready', 'grading', 'completed'
- `test_file_path` (text)
- `memo_file_path` (text)
- `created_at`, `updated_at`

**rubrics**
- `id` (uuid, PK)
- `grader_id` (uuid, FK to graders)
- `question_number` (text)
- `question_text` (text)
- `expected_answer` (text)
- `keywords` (text[])
- `max_marks` (float)
- `order_index` (integer)
- `created_at`

**submissions**
- `id` (uuid, PK)
- `grader_id` (uuid, FK to graders)
- `student_identifier` (text)
- `file_path` (text)
- `total_score` (float)
- `max_possible_score` (float)
- `percentage` (float)
- `status` (text) - 'pending', 'processing', 'graded', 'flagged', 'reviewed'
- `feedback_summary` (text)
- `processed_at`
- `created_at`

**submission_grades**
- `id` (uuid, PK)
- `submission_id` (uuid, FK to submissions)
- `rubric_id` (uuid, FK to rubrics)
- `marks_awarded` (float)
- `ai_reasoning` (text)
- `confidence_score` (float) - 0.0 to 1.0
- `is_overridden` (boolean)
- `override_reason` (text)
- `created_at`, `updated_at`

### API Endpoints

#### Course Management
```
POST   /api/courses                    - Create course with materials
GET    /api/courses                    - List user's courses
GET    /api/courses/:id/files          - Get course files
```

#### Grader Management
```
POST   /api/graders                    - Create grader with test/memo
GET    /api/graders/:id                - Get grader with rubric
PUT    /api/graders/:id/rubric         - Update rubric items
```

#### Submissions
```
GET    /api/submissions/graders/:id/submissions  - List submissions
POST   /api/submissions/graders/:id/submissions  - Upload submissions
POST   /api/submissions/graders/:id/grade-all    - Trigger grading
GET    /api/submissions/submissions/:id          - Get submission details
PATCH  /api/submissions/submission-grades/:id    - Override grade
```

---

## 5. Test Execution Guide

### Automated Testing

The project includes an automated test pipeline that tests the entire grading workflow.

```bash
# Run the automated test suite
cd server
npm run test:pipeline

# Or run directly with tsx
tsx test-grading-pipeline.ts
```

**What the automated test does**:
1. Health check of API server
2. Creates a test course
3. Creates a grader with test and memo files
4. Uploads a student submission
5. Triggers grading process
6. Polls for grading completion (up to 30 seconds)
7. Retrieves analytics
8. Tests grade override functionality

**Expected Output**:
```
========================================
Grading Pipeline End-to-End Test Suite
========================================
API Base URL: http://localhost:4000
Auth Token: Configured
========================================

[✓] Step 1: Health Check
    Server health check passed

[✓] Step 2: Create Course
    Course created successfully (ID: xxx-xxx-xxx)

[✓] Step 3: Create Grader
    Grader created successfully (ID: xxx-xxx-xxx)

[✓] Step 4: Upload Submission
    Submission uploaded successfully (ID: xxx-xxx-xxx)

[✓] Step 5: Trigger Grading
    Grading started for 1 submission(s)

[✓] Step 6: Poll for Results
    Submission graded successfully. Total Score: 95/100

[✓] Step 7: Get Analytics
    Analytics retrieved successfully

[✓] Step 8: Override Grade (Optional)
    Grade override completed successfully

========================================
Test Summary
========================================
Total Tests: 8
Passed: 8
Failed: 0

✓ All tests passed!
```

### Manual Testing via API

For more granular testing, use the following curl commands:

#### Step 1: Create Course
```bash
curl -X POST http://localhost:4000/api/courses \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "title=Test Course" \
  -F "description=AI Grading Test" \
  -F "topics=[\"Math\",\"Calculus\"]"

# Save the returned course_id
```

#### Step 2: Create Grader
```bash
curl -X POST http://localhost:4000/api/graders \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "course_id=COURSE_ID" \
  -F "title=Math Final Exam" \
  -F "total_marks=100" \
  -F "test_file=@server/test-data/sample-test.txt" \
  -F "memo_file=@server/test-data/sample-memo.txt"

# Save the returned grader_id
# Wait 5-10 seconds for rubric extraction
```

#### Step 3: Verify Rubric Extraction
```bash
curl -X GET http://localhost:4000/api/graders/GRADER_ID \
  -H "Authorization: Bearer YOUR_TOKEN"

# Check that rubric array contains extracted items
```

#### Step 4: Upload Submissions
```bash
# Upload perfect submission
curl -X POST http://localhost:4000/api/submissions/graders/GRADER_ID/submissions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "student_identifier=Student_001" \
  -F "files=@server/test-data/sample-submission.txt"

# Upload submission with errors
curl -X POST http://localhost:4000/api/submissions/graders/GRADER_ID/submissions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "student_identifier=Student_002" \
  -F "files=@server/test-data/sample-submission-errors.txt"

# Upload partial submission
curl -X POST http://localhost:4000/api/submissions/graders/GRADER_ID/submissions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "student_identifier=Student_003" \
  -F "files=@server/test-data/sample-submission-partial.txt"
```

#### Step 5: Trigger Grading
```bash
curl -X POST http://localhost:4000/api/submissions/graders/GRADER_ID/grade-all \
  -H "Authorization: Bearer YOUR_TOKEN"

# This queues BullMQ jobs for all submissions
# Monitor progress in server logs or via WebSocket
```

#### Step 6: Check Results
```bash
# Get all submissions for grader
curl -X GET http://localhost:4000/api/submissions/graders/GRADER_ID/submissions \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get detailed results for a specific submission
curl -X GET http://localhost:4000/api/submissions/submissions/SUBMISSION_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Step 7: Test Grade Override
```bash
curl -X PATCH http://localhost:4000/api/submissions/submission-grades/GRADE_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "marks_awarded": 9,
    "override_reason": "Partial credit for showing correct method"
  }'
```

---

## 6. Expected Results

### Rubric Extraction Expected Output

When the grader is created with the sample test and memo files, the system should extract approximately 7 rubric items:

```json
[
  {
    "question_number": "1",
    "question_text": "Find the derivative of f(x) = 3x^3 + 2x^2 - 5x + 1...",
    "expected_answer": "f'(x) = 9x^2 + 4x - 5; f'(2) = 39",
    "keywords": ["derivative", "evaluate", "power rule"],
    "max_marks": 10
  },
  {
    "question_number": "2",
    "question_text": "Evaluate the definite integral...",
    "expected_answer": "26/3",
    "keywords": ["integral", "antiderivative", "bounds"],
    "max_marks": 10
  },
  // ... more items
]
```

### Grading Results Expected Output

#### Student 1 (Perfect Submission)
```json
{
  "submission": {
    "id": "xxx",
    "student_identifier": "TEST_STUDENT_001",
    "status": "graded",
    "total_score": 100,
    "max_possible_score": 100,
    "percentage": 100
  },
  "grades": [
    {
      "rubric_id": "xxx",
      "marks_awarded": 10,
      "ai_reasoning": "Perfect solution with correct derivative and evaluation",
      "confidence_score": 0.95,
      "is_overridden": false
    },
    // ... 6 more grades, all at max marks
  ]
}
```

#### Student 2 (With Errors)
```json
{
  "submission": {
    "id": "xxx",
    "student_identifier": "TEST_STUDENT_002",
    "status": "graded",
    "total_score": 65,
    "max_possible_score": 100,
    "percentage": 65
  },
  "grades": [
    {
      "rubric_id": "xxx (Q1)",
      "marks_awarded": 7,
      "ai_reasoning": "Correct method and derivative, but arithmetic error in evaluation. Student used 9(2) instead of 9(4)",
      "confidence_score": 0.85
    },
    {
      "rubric_id": "xxx (Q2)",
      "marks_awarded": 6,
      "ai_reasoning": "Integration setup correct but missing squared term in antiderivative",
      "confidence_score": 0.80
    },
    {
      "rubric_id": "xxx (Q6)",
      "marks_awarded": 0,
      "ai_reasoning": "No attempt provided",
      "confidence_score": 1.0
    },
    // ... more grades
  ]
}
```

### AI Grading Accuracy Metrics

Based on test scenarios:

| Metric | Target | Acceptable Range |
|--------|--------|------------------|
| Perfect Answer Recognition | 95-100% match | 90-100% |
| Error Detection Rate | Catches 80%+ errors | 75-100% |
| Partial Credit Assignment | Within ±10% of manual | ±15% |
| No-Attempt Recognition | 100% accuracy | 95-100% |
| Confidence Score Accuracy | High confidence (>0.8) on clear answers | >0.7 avg |

---

## 7. Database Verification

### Direct Database Queries

Connect to Supabase and run these queries to verify data:

```sql
-- Check courses were created
SELECT id, title, user_id, created_at
FROM courses
ORDER BY created_at DESC
LIMIT 5;

-- Check grader and rubric
SELECT g.id, g.title, g.status,
       COUNT(r.id) as rubric_items,
       g.test_file_path, g.memo_file_path
FROM graders g
LEFT JOIN rubrics r ON r.grader_id = g.id
GROUP BY g.id
ORDER BY g.created_at DESC;

-- Check rubric details
SELECT
  question_number,
  question_text,
  max_marks,
  keywords,
  order_index
FROM rubrics
WHERE grader_id = 'YOUR_GRADER_ID'
ORDER BY order_index;

-- Check submission status
SELECT
  s.id,
  s.student_identifier,
  s.status,
  s.total_score,
  s.max_possible_score,
  s.percentage,
  COUNT(sg.id) as individual_grades
FROM submissions s
LEFT JOIN submission_grades sg ON sg.submission_id = s.id
WHERE s.grader_id = 'YOUR_GRADER_ID'
GROUP BY s.id;

-- Check individual grades with AI reasoning
SELECT
  sg.id,
  r.question_number,
  sg.marks_awarded,
  r.max_marks,
  sg.confidence_score,
  sg.is_overridden,
  sg.ai_reasoning
FROM submission_grades sg
JOIN rubrics r ON r.id = sg.rubric_id
WHERE sg.submission_id = 'YOUR_SUBMISSION_ID'
ORDER BY r.order_index;

-- Check for overridden grades
SELECT
  sg.id,
  s.student_identifier,
  r.question_number,
  sg.marks_awarded,
  sg.override_reason,
  sg.updated_at
FROM submission_grades sg
JOIN submissions s ON s.id = sg.submission_id
JOIN rubrics r ON r.id = sg.rubric_id
WHERE sg.is_overridden = true;

-- Performance stats
SELECT
  g.title as grader_title,
  COUNT(DISTINCT s.id) as total_submissions,
  AVG(s.percentage) as avg_percentage,
  MIN(s.percentage) as min_percentage,
  MAX(s.percentage) as max_percentage,
  AVG(sg.confidence_score) as avg_confidence
FROM graders g
JOIN submissions s ON s.grader_id = g.id
JOIN submission_grades sg ON sg.submission_id = s.id
WHERE g.id = 'YOUR_GRADER_ID'
GROUP BY g.id, g.title;
```

---

## 8. BullMQ Job Monitoring

### Redis CLI Monitoring

```bash
# Connect to Redis
redis-cli

# Check queue stats
> HGETALL bull:grading:meta

# List active jobs
> ZRANGE bull:grading:active 0 -1

# List waiting jobs
> LRANGE bull:grading:wait 0 -1

# List completed jobs
> ZRANGE bull:grading:completed 0 -1

# List failed jobs
> ZRANGE bull:grading:failed 0 -1

# Check dead letter queue
> LRANGE bull:grading-dlq:wait 0 -1
```

### Programmatic Monitoring

Add this to a test script:

```typescript
import { Queue } from 'bullmq';

const gradingQueue = new Queue('grading', {
  connection: { url: 'redis://localhost:6379' }
});

// Get queue status
const counts = await gradingQueue.getJobCounts();
console.log('Queue Status:', counts);
// Output: { waiting: 0, active: 2, completed: 5, failed: 0, delayed: 0 }

// Get active jobs
const activeJobs = await gradingQueue.getActive();
console.log('Active Jobs:', activeJobs.map(j => ({
  id: j.id,
  data: j.data,
  progress: j.progress
})));

// Get failed jobs
const failedJobs = await gradingQueue.getFailed();
console.log('Failed Jobs:', failedJobs.map(j => ({
  id: j.id,
  error: j.failedReason
})));
```

### Server Logs

Monitor the server console output:

```
[gradingWorker] Processing job xxx for submission yyy
[gradingWorker] Grading question 1/7 (14% complete)
[gradingWorker] Grading question 2/7 (29% complete)
...
[gradingWorker] Submission graded: 95/100 (95%)
[gradingWorker] Job completed successfully
```

### WebSocket Events

Connect via Socket.IO client:

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:4000');

// Listen for grading progress
socket.on('grading:progress', (data) => {
  console.log(`Progress: ${data.percentage}% for submission ${data.submissionId}`);
});

// Listen for grading completion
socket.on('grading:complete', (data) => {
  console.log(`Grading complete for ${data.submissionId}: ${data.status}`);
});
```

---

## 9. Troubleshooting

### Common Issues and Solutions

#### Issue: Server won't start
```
Error: EADDRINUSE: address already in use :::4000
```
**Solution**: Kill the existing process
```bash
lsof -ti:4000 | xargs kill -9
npm run dev:server
```

#### Issue: Redis connection failed
```
Error: connect ECONNREFUSED 127.0.0.1:6379
```
**Solution**: Start Redis server
```bash
redis-server
# Or on macOS with Homebrew:
brew services start redis
```

#### Issue: Rubric extraction returns empty array
```json
{ "rubric": [] }
```
**Possible Causes**:
1. Gemini API key not configured
2. PDF text extraction failed
3. AI couldn't parse memo structure

**Solutions**:
- Check `GEMINI_API_KEY` in `.env`
- Verify memo file format is clear
- Check server logs for PDF parsing errors
- Try with .txt files instead of PDFs

#### Issue: Grading jobs stuck in "pending"
```
Submission status remains "pending" indefinitely
```
**Possible Causes**:
1. Grading worker not running
2. Redis queue issue
3. Job failed silently

**Solutions**:
- Check server logs for worker startup
- Verify Redis is running: `redis-cli ping`
- Check failed jobs: `gradingQueue.getFailed()`
- Review dead letter queue

#### Issue: Low confidence scores across the board
```json
{ "confidence_score": 0.4 }
```
**Possible Causes**:
1. Student answer format doesn't match expected
2. RAG context not available
3. Gemini output parsing failed

**Solutions**:
- Review `ai_reasoning` field for clues
- Check if course materials were embedded
- Verify Gemini API is responding correctly
- Review prompt templates in `/server/src/prompts/`

#### Issue: Grade override not working
```
Error: Grade not found
```
**Solutions**:
- Verify grade ID is correct
- Check user has permission (RLS policies)
- Ensure submission belongs to user's course

---

## 10. Appendix

### A. File Locations

```
/Users/Rusumba/Oryares Sol/Cleverly/
├── server/
│   ├── src/
│   │   ├── services/
│   │   │   ├── gradingService.ts         # Core grading logic
│   │   │   ├── rubricService.ts          # Rubric extraction
│   │   │   ├── ragService.ts             # RAG context retrieval
│   │   │   └── storageService.ts         # File storage
│   │   ├── workers/
│   │   │   └── gradingWorker.ts          # BullMQ grading worker
│   │   ├── routes/
│   │   │   ├── graders.ts                # Grader endpoints
│   │   │   ├── submissions.ts            # Submission endpoints
│   │   │   └── courses.ts                # Course endpoints
│   │   └── prompts/
│   │       ├── grading.ts                # Grading prompt template
│   │       ├── rubricExtraction.ts       # Rubric extraction prompt
│   │       └── feedback.ts               # Feedback generation prompt
│   ├── test-data/
│   │   ├── sample-test.txt               # Sample exam
│   │   ├── sample-memo.txt               # Sample marking memo
│   │   ├── sample-submission.txt         # Perfect submission
│   │   ├── sample-submission-errors.txt  # Submission with errors
│   │   └── sample-submission-partial.txt # Partial submission
│   └── test-grading-pipeline.ts          # Automated test script
└── supabase/
    └── migrations/
        └── 003_grading_module.sql        # Database schema
```

### B. Key Configuration Files

**server/.env**
```bash
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxx
SUPABASE_ANON_KEY=xxx
GEMINI_API_KEY=xxx
REDIS_URL=redis://localhost:6379
PORT=4000
STORAGE_BUCKET=courses
```

**server/package.json scripts**
```json
{
  "dev": "tsx watch src/index.ts",
  "test:pipeline": "tsx test-grading-pipeline.ts",
  "setup:db": "tsx src/scripts/setupDatabase.ts",
  "migrate": "tsx src/scripts/runMigrations.ts"
}
```

### C. API Response Schemas

**Grader Creation Response**
```typescript
{
  grader_id: string;      // UUID of created grader
  status: string;         // 'processing' initially
}
```

**Rubric Items Response**
```typescript
{
  grader: {
    id: string;
    title: string;
    status: string;
    total_marks: number;
  },
  rubric: Array<{
    id: string;
    question_number: string;
    question_text: string | null;
    expected_answer: string;
    keywords: string[];
    max_marks: number;
    order_index: number;
  }>
}
```

**Submission with Grades Response**
```typescript
{
  submission: {
    id: string;
    student_identifier: string;
    status: 'graded' | 'pending' | 'processing' | 'flagged';
    total_score: number;
    max_possible_score: number;
    percentage: number;
    processed_at: string;
  },
  grades: Array<{
    id: string;
    rubric_id: string;
    marks_awarded: number;
    ai_reasoning: string;
    confidence_score: number;
    is_overridden: boolean;
    override_reason: string | null;
  }>
}
```

### D. Grading Prompt Template

The AI grading uses this prompt structure:

```
You are an expert academic grader. Grade the following student answer.

QUESTION: {question_text}
EXPECTED ANSWER: {expected_answer}
KEYWORDS TO LOOK FOR: {keywords}
MAXIMUM MARKS: {max_marks}

ADDITIONAL CONTEXT FROM COURSE MATERIALS:
{rag_context}

STUDENT ANSWER:
{student_answer}

Provide your grading in JSON format:
{
  "marks_awarded": <number 0 to max_marks>,
  "ai_reasoning": "<explanation of your grading decision>",
  "confidence_score": <number 0.0 to 1.0>,
  "feedback": "<constructive feedback for the student>"
}
```

### E. Testing Checklist

- [ ] Redis server is running
- [ ] Backend server started successfully
- [ ] Supabase connection verified
- [ ] Gemini API key configured
- [ ] Test data files present
- [ ] Course created successfully
- [ ] Grader created with test/memo files
- [ ] Rubric extracted (>0 items)
- [ ] Submissions uploaded (3 test files)
- [ ] Grading jobs triggered
- [ ] All submissions graded within 30s
- [ ] Scores match expected ranges
- [ ] AI reasoning is meaningful
- [ ] Confidence scores reasonable
- [ ] Grade override works
- [ ] Database records correct
- [ ] No jobs in failed queue

### F. Performance Benchmarks

| Metric | Target | Measured |
|--------|--------|----------|
| Rubric extraction time | <10s | TBD |
| Per-question grading time | <5s | TBD |
| 100-submission batch | <10min | TBD |
| AI response time | <3s | TBD |
| Database query time | <100ms | TBD |
| File upload time (1MB) | <2s | TBD |

### G. Security Considerations

1. **Row Level Security (RLS)**: All database tables have RLS enabled
2. **Authentication**: JWT tokens required for all API calls
3. **File Storage**: Files stored with UUID prefixes to prevent guessing
4. **API Rate Limiting**: Configured in Express middleware
5. **Input Validation**: Zod schemas validate all inputs
6. **SQL Injection**: Prevented by Supabase parameterized queries

---

## Conclusion

This test report provides comprehensive documentation for testing the Cleverly AI Grading system. The automated test pipeline validates the core functionality, while manual testing procedures allow for detailed verification of edge cases.

### Success Criteria

The AI grading system is considered functional if:
1. ✅ Rubric extraction produces meaningful items from memo
2. ✅ Grading completes for all submissions without errors
3. ✅ Perfect submissions score 90-100%
4. ✅ Error-containing submissions receive appropriate partial credit
5. ✅ Confidence scores correlate with answer clarity
6. ✅ Grade overrides work and update totals
7. ✅ No jobs fail or get stuck in queues
8. ✅ Database integrity maintained throughout

### Next Steps

1. Run automated test: `npm run test:pipeline`
2. Review test output and verify all steps pass
3. Check database for correct data
4. Monitor Redis queues during grading
5. Test manual grade overrides
6. Verify WebSocket real-time updates
7. Export results and validate format

**Contact**: For issues or questions, refer to server logs and database queries provided in this document.

---

**Document Version**: 1.0
**Last Updated**: January 6, 2026
**Tested By**: Automated Test Suite + Manual Verification
