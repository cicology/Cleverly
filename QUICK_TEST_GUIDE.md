# Quick Test Guide - AI Grading Functionality

## Prerequisites Check

```bash
# 1. Check Redis is running
redis-cli ping
# Expected: PONG

# 2. Check environment variables
cat server/.env | grep -E "GEMINI_API_KEY|SUPABASE_URL|REDIS_URL"
# Ensure all are set
```

## Quick Start (5 Minutes)

### Option 1: Automated Test (Recommended)

```bash
# Terminal 1: Start the server
cd server
npm run dev

# Wait for this message:
# "Server running on port 4000"
# "Grading worker started"

# Terminal 2: Run the test
cd server
npm run test:pipeline
```

**Expected Result**: All 8 tests should pass in ~30-40 seconds.

### Option 2: Manual API Testing

```bash
# 1. Start server
cd server
npm run dev

# 2. Create a user and get auth token (if needed)
# Use Supabase dashboard or signup endpoint

# 3. Create course
curl -X POST http://localhost:4000/api/courses \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "title=Test Course" \
  -F "description=Testing AI Grading"

# 4. Create grader (replace COURSE_ID)
curl -X POST http://localhost:4000/api/graders \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "course_id=COURSE_ID" \
  -F "title=Math Test" \
  -F "total_marks=100" \
  -F "test_file=@test-data/sample-test.txt" \
  -F "memo_file=@test-data/sample-memo.txt"

# Wait 5 seconds for rubric extraction

# 5. Upload submission (replace GRADER_ID)
curl -X POST http://localhost:4000/api/submissions/graders/GRADER_ID/submissions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "student_identifier=Test Student" \
  -F "files=@test-data/sample-submission.txt"

# 6. Trigger grading
curl -X POST http://localhost:4000/api/submissions/graders/GRADER_ID/grade-all \
  -H "Authorization: Bearer YOUR_TOKEN"

# 7. Wait 20-30 seconds, then check results
curl http://localhost:4000/api/submissions/graders/GRADER_ID/submissions \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Verify Results

### Check in Supabase Dashboard

1. Go to your Supabase project
2. Navigate to Table Editor
3. Check these tables:
   - `graders` - Should have your test grader with status "ready" or "completed"
   - `rubrics` - Should have 7 items extracted from memo
   - `submissions` - Should show status "graded"
   - `submission_grades` - Should have individual question grades

### Check Server Logs

Look for these messages:
```
✓ Grading worker started
✓ Rubric extracted: 7 items
✓ Grading job queued
✓ Submission graded: 95/100
```

### Check Redis Queue

```bash
redis-cli
> HGETALL bull:grading:meta
> ZRANGE bull:grading:completed 0 -1
```

## Troubleshooting Quick Fixes

### Server won't start
```bash
# Kill any existing process
lsof -ti:4000 | xargs kill -9
# Restart
npm run dev
```

### Redis not running
```bash
# macOS
brew services start redis

# Linux
sudo systemctl start redis

# Manual
redis-server
```

### No rubric items extracted
- Check server logs for errors
- Verify `GEMINI_API_KEY` is set in `.env`
- Try with .txt files instead of PDFs
- Check memo file format is clear

### Grading stuck
- Check worker started: Look for "Grading worker started" in logs
- Check Redis: `redis-cli ping`
- Check failed jobs: In Redis CLI, run `ZRANGE bull:grading:failed 0 -1`

## Test Data Files

All test files are located in `/server/test-data/`:

1. **sample-test.txt** - Mathematics exam with 7 questions (100 marks)
2. **sample-memo.txt** - Marking memorandum with solutions
3. **sample-submission.txt** - Perfect submission (should score ~100%)
4. **sample-submission-errors.txt** - Submission with errors (should score ~65%)
5. **sample-submission-partial.txt** - Minimal effort (should score ~20%)

## Expected Test Results

| Test File | Expected Score | Expected Status |
|-----------|---------------|-----------------|
| sample-submission.txt | 95-100/100 | graded |
| sample-submission-errors.txt | 60-70/100 | graded |
| sample-submission-partial.txt | 15-25/100 | graded |

## What Success Looks Like

✅ **Successful Test Run**:
```
[✓] Step 1: Health Check - Server health check passed
[✓] Step 2: Create Course - Course created successfully
[✓] Step 3: Create Grader - Grader created successfully
[✓] Step 4: Upload Submission - Submission uploaded successfully
[✓] Step 5: Trigger Grading - Grading started for 1 submission(s)
[✓] Step 6: Poll for Results - Submission graded successfully. Total Score: 95/100
[✓] Step 7: Get Analytics - Analytics retrieved successfully
[✓] Step 8: Override Grade - Grade override completed successfully

Total Tests: 8
Passed: 8
Failed: 0
✓ All tests passed!
```

## Next Steps After Successful Test

1. Review the comprehensive test report: `GRADING_TEST_REPORT.md`
2. Check database records in Supabase
3. Review AI reasoning for grades
4. Test with your own exam materials
5. Test grade override functionality
6. Export results to CSV

## Common Questions

**Q: How long should grading take?**
A: ~5 seconds per question. A 7-question exam should complete in 30-40 seconds.

**Q: What if confidence scores are low?**
A: Low confidence (<0.6) indicates the AI is unsure. Review the `ai_reasoning` field to understand why.

**Q: Can I test with PDFs?**
A: Yes, the system supports PDFs. Just ensure they're text-based, not scanned images.

**Q: How do I test batch grading?**
A: Upload multiple submissions before triggering grading. The system will process them in parallel.

**Q: Where are graded files stored?**
A: In Supabase Storage bucket named "courses" with UUID prefixes.

## Support

- Full documentation: `GRADING_TEST_REPORT.md`
- Server logs: Check terminal where `npm run dev` is running
- Database queries: See Appendix G in test report
- Redis monitoring: `redis-cli` commands in test report

---

**Quick Test Completed?** ✅

Move on to the comprehensive test report for detailed testing procedures, database verification, and advanced scenarios.
