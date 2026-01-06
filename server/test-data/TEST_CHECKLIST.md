# AI Grading Test Checklist

Use this checklist to verify all aspects of the AI grading functionality.

## Pre-Test Setup

- [ ] Redis server is running (`redis-cli ping` returns PONG)
- [ ] Environment variables configured in `server/.env`:
  - [ ] `SUPABASE_URL`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`
  - [ ] `GEMINI_API_KEY`
  - [ ] `REDIS_URL`
- [ ] Database migrations applied
- [ ] Test data files exist in `server/test-data/`

## Test Execution

### 1. Server Startup
- [ ] Server starts without errors
- [ ] Console shows: "Server running on port 4000"
- [ ] Console shows: "Grading worker started"
- [ ] Console shows: "Embedding worker started"
- [ ] Health endpoint responds: `curl http://localhost:4000/api/health`

### 2. Course Creation
- [ ] Course created via API
- [ ] Course record in database (check `courses` table)
- [ ] Course materials uploaded to Supabase Storage
- [ ] Embedding jobs queued (if materials uploaded)

### 3. Grader Creation
- [ ] Grader created with test file
- [ ] Grader created with memo file
- [ ] Both files stored in Supabase Storage
- [ ] Grader record in database with status "processing"
- [ ] Console shows PDF/text extraction logs

### 4. Rubric Extraction
- [ ] Wait 5-10 seconds for processing
- [ ] Grader status updated to "ready"
- [ ] Rubric items created in database (check `rubrics` table)
- [ ] Number of rubric items matches questions (expected: 7 for sample-memo.txt)
- [ ] Total marks in rubric matches test total (expected: 100)
- [ ] Each rubric item has:
  - [ ] `question_number`
  - [ ] `expected_answer`
  - [ ] `max_marks`
  - [ ] `keywords` (array)
- [ ] Rubric items ordered correctly (`order_index`)

### 5. Submission Upload
- [ ] Single submission uploads successfully
- [ ] Multiple submissions upload in batch
- [ ] Submission records created with status "pending"
- [ ] Files stored in Supabase Storage
- [ ] Student identifiers recorded correctly

### 6. Grading Process
- [ ] "Grade All" triggered successfully
- [ ] Console shows grading jobs queued
- [ ] BullMQ jobs added to Redis queue
- [ ] Worker processes jobs (check console logs)
- [ ] Console shows progress: "Grading question X/Y"
- [ ] All submissions processed within reasonable time (~30s per submission)
- [ ] No jobs in failed queue (`redis-cli` check)

### 7. Grading Results
- [ ] Submission status updated to "graded"
- [ ] `processed_at` timestamp set
- [ ] `total_score` calculated correctly
- [ ] `max_possible_score` matches rubric total
- [ ] `percentage` calculated correctly
- [ ] Individual grades created in `submission_grades` table
- [ ] Each grade has:
  - [ ] `marks_awarded` (0 to max_marks)
  - [ ] `ai_reasoning` (not empty)
  - [ ] `confidence_score` (0.0 to 1.0)
  - [ ] Reference to correct rubric item

### 8. AI Grading Quality
- [ ] **Perfect submission** (sample-submission.txt):
  - [ ] Score: 90-100/100
  - [ ] Confidence: High (>0.8 average)
  - [ ] Reasoning mentions correct answers
- [ ] **Submission with errors** (sample-submission-errors.txt):
  - [ ] Score: 60-70/100
  - [ ] Partial credit given appropriately
  - [ ] Errors detected in reasoning
  - [ ] Skipped questions score 0
- [ ] **Minimal submission** (sample-submission-partial.txt):
  - [ ] Score: 15-25/100
  - [ ] Incomplete answers scored appropriately
  - [ ] No-attempt questions score 0

### 9. Grade Override Functionality
- [ ] Override grade via API/UI
- [ ] New marks_awarded saved
- [ ] `is_overridden` flag set to true
- [ ] `override_reason` recorded
- [ ] `updated_at` timestamp updated
- [ ] Total score recalculated
- [ ] Percentage updated accordingly

### 10. WebSocket Events (if applicable)
- [ ] Connect to Socket.IO server
- [ ] Receive `grading:progress` events
- [ ] Receive `grading:complete` event
- [ ] Events contain correct submission_id
- [ ] Progress percentage accurate

### 11. Analytics & Export
- [ ] Analytics endpoint returns statistics
- [ ] Average scores calculated correctly
- [ ] Confidence metrics accurate
- [ ] Time-saved calculations reasonable
- [ ] Export to CSV works (if implemented)

### 12. Error Handling
- [ ] Invalid rubric handled gracefully
- [ ] Missing student answer handled
- [ ] AI API failures don't crash worker
- [ ] Failed jobs go to DLQ
- [ ] Error messages are descriptive

### 13. Database Integrity
- [ ] No orphaned records (use verification SQL)
- [ ] Foreign keys intact
- [ ] No negative marks
- [ ] No marks exceeding max_marks
- [ ] All confidence scores between 0 and 1
- [ ] RLS policies working (users can't see others' data)

### 14. Performance
- [ ] Rubric extraction completes in <10 seconds
- [ ] Single question grading in <5 seconds
- [ ] 3-submission batch in <2 minutes
- [ ] Database queries fast (<100ms)
- [ ] No memory leaks (monitor server)

## Test Results Documentation

### Test Run Information
- **Date**: _______________
- **Tester**: _______________
- **Environment**: _______________
- **Server Version**: _______________

### Results Summary

| Test Category | Pass | Fail | Notes |
|---------------|------|------|-------|
| Server Startup | [ ] | [ ] | |
| Course Creation | [ ] | [ ] | |
| Grader Creation | [ ] | [ ] | |
| Rubric Extraction | [ ] | [ ] | |
| Submission Upload | [ ] | [ ] | |
| Grading Process | [ ] | [ ] | |
| Grading Results | [ ] | [ ] | |
| AI Quality | [ ] | [ ] | |
| Grade Override | [ ] | [ ] | |
| Database Integrity | [ ] | [ ] | |
| Performance | [ ] | [ ] | |

### Sample Scores Achieved

| Test File | Expected | Actual | Match? |
|-----------|----------|--------|--------|
| sample-submission.txt | 95-100 | _____ | [ ] |
| sample-submission-errors.txt | 60-70 | _____ | [ ] |
| sample-submission-partial.txt | 15-25 | _____ | [ ] |

### Issues Found

1. ____________________________________________
2. ____________________________________________
3. ____________________________________________

### Observations

____________________________________________________
____________________________________________________
____________________________________________________
____________________________________________________

### Overall Test Status

- [ ] **PASS** - All critical features working, AI grading accurate
- [ ] **PASS WITH WARNINGS** - Core features work, minor issues noted
- [ ] **FAIL** - Critical issues prevent proper grading

### Next Steps

- [ ] Fix identified issues
- [ ] Re-test failed scenarios
- [ ] Document AI accuracy metrics
- [ ] Prepare for production deployment

---

**Signature**: _______________  **Date**: _______________
