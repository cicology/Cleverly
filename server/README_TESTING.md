# Grading Pipeline Testing Suite - Complete Documentation Index

Welcome! This guide helps you navigate all testing resources for the Cleverly AI Grader.

## Where to Start

### I just want to run the tests (2 minutes)
→ Read: **QUICK_START_TESTING.md**
```bash
npm run dev          # Terminal 1
npm run test:pipeline # Terminal 2
```

### I want a quick reference (1 minute)
→ Read: **TESTING_QUICK_REFERENCE.md**
- Command cheat sheet
- Troubleshooting at a glance
- One-liners and patterns

### I want the full picture (30 minutes)
→ Read: **TEST_PIPELINE_README.md**
- Complete configuration guide
- All 10+ troubleshooting scenarios
- CI/CD integration
- Performance tuning

### I want to understand the structure (10 minutes)
→ Read: **TESTING_SETUP_SUMMARY.md**
- Overview of all resources
- File locations
- Integration options

### I want to visualize the test flow (5 minutes)
→ Read: **TEST_FLOW_DIAGRAM.txt**
- Step-by-step diagram
- Data flow
- Timing information

### I want the executive summary (5 minutes)
→ Read: **IMPLEMENTATION_COMPLETE.md**
- What was created
- Quick start
- Success criteria

## Test Files Overview

### 1. Main Test Script
**File:** `test-grading-pipeline.ts`
- Language: TypeScript (runs with tsx)
- Runtime: 30-60 seconds
- Tests: 8 sequential workflow steps
- No external dependencies
- Works with/without auth

**Run:**
```bash
npm run test:pipeline
```

### 2. Alternative: Postman Collection
**File:** `postman-grading-pipeline.json`
- Pre-configured requests
- Built-in test assertions
- Variable auto-population
- Import into Postman and run

**How:**
1. File > Import > postman-grading-pipeline.json
2. Set variables: baseUrl, demoToken
3. Run requests in order

### 3. Sample Test Data
**Location:** `test-data/`
- `sample-study-guide.txt` - Course material
- `sample-test.txt` - Exam questions
- `sample-memo.txt` - Marking scheme
- `sample-submission.txt` - Student answers

All text files, easily replaceable with your own content.

## Documentation Guide

### By Time Available

| Time | Document | Purpose |
|------|----------|---------|
| 2 min | QUICK_START_TESTING.md | Get running fast |
| 1 min | TESTING_QUICK_REFERENCE.md | Cheat sheet |
| 5 min | TEST_FLOW_DIAGRAM.txt | Understand flow |
| 10 min | TESTING_SETUP_SUMMARY.md | Overview |
| 30 min | TEST_PIPELINE_README.md | Deep dive |

### By Use Case

**Getting Started**
1. QUICK_START_TESTING.md
2. TESTING_QUICK_REFERENCE.md

**Using the Tests**
1. TEST_FLOW_DIAGRAM.txt (understand flow)
2. TEST_PIPELINE_README.md (full reference)

**Troubleshooting**
1. TESTING_QUICK_REFERENCE.md (quick fixes)
2. TEST_PIPELINE_README.md (10+ scenarios)

**Integration**
1. TESTING_SETUP_SUMMARY.md (overview)
2. TEST_PIPELINE_README.md (CI/CD examples)

**Understanding Everything**
1. IMPLEMENTATION_COMPLETE.md (summary)
2. TESTING_SETUP_SUMMARY.md (detail)
3. TEST_PIPELINE_README.md (complete reference)

## Quick Command Reference

```bash
# Run tests (basic)
npm run test:pipeline

# Run with custom API URL
API_URL=http://your-api:4000 npm run test:pipeline

# Run with authentication
SUPABASE_DEMO_TOKEN=your_token npm run test:pipeline

# Run with both
API_URL=http://your-api:4000 SUPABASE_DEMO_TOKEN=token npm run test:pipeline

# Run and check result
npm run test:pipeline && echo "PASS" || echo "FAIL"

# Run in background
npm run test:pipeline &

# Run with timeout (60 seconds max)
timeout 60 npm run test:pipeline
```

## Test Workflow Summary

```
Start API Server (npm run dev)
         ↓
Run Test Script (npm run test:pipeline)
         ↓
Step 1: Health Check
Step 2: Create Course → Save course_id
Step 3: Create Grader → Save grader_id
Step 4: Upload Submission → Save submission_id
Step 5: Trigger Grading
Step 6: Poll for Results → Save gradeId
Step 7: Get Analytics
Step 8: Override Grade (optional)
         ↓
View Results (Pass/Fail per step)
         ↓
Exit Code: 0 (success) or 1 (failure)
```

## Files Checklist

### Core Files
- [x] test-grading-pipeline.ts - Main test script
- [x] postman-grading-pipeline.json - Postman collection
- [x] package.json - Updated with npm script

### Documentation (Pick Your Level)
- [x] QUICK_START_TESTING.md - 2 minute read
- [x] TESTING_QUICK_REFERENCE.md - 1 minute reference
- [x] TEST_PIPELINE_README.md - 30 minute deep dive
- [x] TESTING_SETUP_SUMMARY.md - 10 minute overview
- [x] TEST_FLOW_DIAGRAM.txt - Visual flow
- [x] IMPLEMENTATION_COMPLETE.md - Executive summary
- [x] README_TESTING.md - This file

### Test Data
- [x] test-data/sample-study-guide.txt
- [x] test-data/sample-test.txt
- [x] test-data/sample-memo.txt
- [x] test-data/sample-submission.txt

## Expected Output

```
========================================
Grading Pipeline End-to-End Test Suite
========================================

[✓] Step 1: Health Check
[✓] Step 2: Create Course
[✓] Step 3: Create Grader
[✓] Step 4: Upload Submission
[✓] Step 5: Trigger Grading
[✓] Step 6: Poll for Results
[✓] Step 7: Get Analytics
[✓] Step 8: Override Grade (Optional)

========================================
Test Summary
========================================
Total Tests: 8
Passed: 8
Failed: 0

✓ All tests passed!
```

## Endpoints Tested

| # | Endpoint | Method | Purpose |
|---|----------|--------|---------|
| 1 | /api/health | GET | Server health |
| 2 | /api/courses | POST | Create course |
| 3 | /api/graders | POST | Create grader |
| 4 | /api/graders/:id | GET | Get details |
| 5 | /api/submissions/graders/:id/submissions | POST | Upload |
| 6 | /api/submissions/graders/:id/submissions | GET | List |
| 7 | /api/submissions/graders/:id/grade-all | POST | Grade |
| 8 | /api/submissions/submissions/:id | GET | Poll |
| 9 | /api/analytics/graders/:id/analytics | GET | Analytics |
| 10 | /api/submission-grades/:id | PATCH | Override |

## Troubleshooting Quick Links

### Common Issues

| Issue | Document Section |
|-------|------------------|
| Connection refused | TEST_PIPELINE_README.md - Troubleshooting |
| Test times out | TESTING_QUICK_REFERENCE.md - Troubleshooting |
| 401 Unauthorized | TEST_PIPELINE_README.md - Auth Handling |
| 404 Not found | TEST_PIPELINE_README.md - API Endpoints |
| Database errors | TEST_PIPELINE_README.md - Troubleshooting |

See **TESTING_QUICK_REFERENCE.md** for quick fixes, or **TEST_PIPELINE_README.md** for detailed troubleshooting of 10+ scenarios.

## Configuration

### Environment Variables

```bash
API_URL                  # Default: http://localhost:4000
SUPABASE_DEMO_TOKEN     # Optional for local dev
```

### Customizable Parameters

In test script:
```typescript
const POLL_INTERVAL = 2000;   // Wait between checks
const MAX_POLL_TIME = 30000;  // Total timeout
```

## Testing Approaches

### Approach 1: Automated Script (Recommended)
```bash
npm run test:pipeline
```
- Fast (30-60 seconds)
- Automated
- Good for CI/CD
- Clear pass/fail

### Approach 2: Postman GUI
1. Import collection
2. Set variables
3. Run requests manually
- Interactive
- Good for exploration
- Good for debugging
- Step-by-step control

### Approach 3: Manual curl
```bash
curl http://localhost:4000/api/health
```
- Full control
- Good for specific endpoints
- More manual work

## Integration Examples

### GitHub Actions
```yaml
- run: npm run test:pipeline --prefix server
```

### GitLab CI
```yaml
script:
  - cd server && npm run test:pipeline
```

### Pre-commit Hook
```bash
npm run test:pipeline || exit 1
```

## Performance

- **Duration:** 30-60 seconds
- **Bottleneck:** Grading job (10-30 seconds)
- **API Calls:** 10 total
- **Data:** ~15 KB total
- **Database:** Creates real records (can cleanup)

## Key Features

- ✓ No external dependencies
- ✓ Clear output
- ✓ Smart polling
- ✓ Flexible auth
- ✓ CI/CD ready
- ✓ Works locally and remote
- ✓ Easy to customize

## Next Steps

### First Time?
1. Read: QUICK_START_TESTING.md (2 min)
2. Run: `npm run test:pipeline` (1 min)
3. Check results (1 min)

### Want Details?
1. Read: TEST_FLOW_DIAGRAM.txt (5 min)
2. Read: TESTING_SETUP_SUMMARY.md (10 min)
3. Reference: TEST_PIPELINE_README.md (as needed)

### Ready to Integrate?
1. Check: IMPLEMENTATION_COMPLETE.md (5 min)
2. See: TEST_PIPELINE_README.md - CI/CD section (10 min)
3. Implement: Add to your pipeline

### Need Help?
1. Check: TESTING_QUICK_REFERENCE.md (quick fixes)
2. Search: TEST_PIPELINE_README.md (detailed help)
3. Review: API code in src/routes/*.ts

## File Structure

```
server/
├── test-grading-pipeline.ts           ← Main test (run this)
├── postman-grading-pipeline.json      ← Alternative
├── package.json                       ← Updated
├── QUICK_START_TESTING.md             ← Start here (2 min)
├── TESTING_QUICK_REFERENCE.md         ← Cheat sheet (1 min)
├── TEST_PIPELINE_README.md            ← Full guide (30 min)
├── TESTING_SETUP_SUMMARY.md           ← Overview (10 min)
├── TEST_FLOW_DIAGRAM.txt              ← Diagrams (5 min)
├── README_TESTING.md                  ← This file
└── test-data/
    ├── sample-study-guide.txt
    ├── sample-test.txt
    ├── sample-memo.txt
    └── sample-submission.txt
```

## Support Resources

| Need | Resource |
|------|----------|
| Quick start | QUICK_START_TESTING.md |
| Command ref | TESTING_QUICK_REFERENCE.md |
| Full guide | TEST_PIPELINE_README.md |
| Overview | TESTING_SETUP_SUMMARY.md |
| Visuals | TEST_FLOW_DIAGRAM.txt |
| Summary | IMPLEMENTATION_COMPLETE.md |
| This | README_TESTING.md |

## Success Criteria

Tests pass when:
- ✓ All 8 steps complete
- ✓ Each step returns success
- ✓ Exit code is 0
- ✓ Summary shows "All tests passed!"

## Questions?

1. **How do I run?** → QUICK_START_TESTING.md
2. **What's being tested?** → TEST_FLOW_DIAGRAM.txt
3. **Why did it fail?** → TEST_PIPELINE_README.md troubleshooting
4. **How do I customize?** → TEST_PIPELINE_README.md customization
5. **How do I integrate?** → IMPLEMENTATION_COMPLETE.md or TEST_PIPELINE_README.md CI/CD section
6. **What files were created?** → TESTING_SETUP_SUMMARY.md

## Ready to Test?

```bash
cd server
npm run test:pipeline
```

Expected: See 8 checkmarks and "All tests passed!" in 30-60 seconds.

---

**Status:** Production-Ready
**Version:** 1.0
**Last Updated:** December 2024

For complete details, see individual documentation files.
