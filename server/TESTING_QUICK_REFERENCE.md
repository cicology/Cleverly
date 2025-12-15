# Grading Pipeline Testing - Quick Reference Card

## Run Tests in 2 Commands

```bash
# Terminal 1: Start API Server
npm run dev

# Terminal 2: Run Tests
npm run test:pipeline
```

## Test Commands

```bash
# Run with custom API URL
API_URL=http://your-api:4000 npm run test:pipeline

# Run with authentication
SUPABASE_DEMO_TOKEN=your_token npm run test:pipeline

# Run both
API_URL=http://your-api:4000 SUPABASE_DEMO_TOKEN=token npm run test:pipeline
```

## Expected Success Output

```
[✓] Step 1: Health Check
[✓] Step 2: Create Course
[✓] Step 3: Create Grader
[✓] Step 4: Upload Submission
[✓] Step 5: Trigger Grading
[✓] Step 6: Poll for Results
[✓] Step 7: Get Analytics
[✓] Step 8: Override Grade

✓ All tests passed! (Exit code: 0)
```

## Test Files Created

| File | Location | Purpose |
|------|----------|---------|
| Test Script | `server/test-grading-pipeline.ts` | Main automated tests |
| Postman Collection | `server/postman-grading-pipeline.json` | GUI testing alternative |
| Quick Start | `server/QUICK_START_TESTING.md` | 2-minute setup guide |
| Full Guide | `server/TEST_PIPELINE_README.md` | 60+ page reference |
| Summary | `server/TESTING_SETUP_SUMMARY.md` | Overview of all resources |
| Test Data | `server/test-data/*.txt` | Sample files for testing |

## Test Endpoints

```
1. GET /api/health                          ← Health check
2. POST /api/courses                        ← Create course
3. POST /api/graders                        ← Create grader
4. GET /api/graders/:id                     ← Get grader details
5. POST /api/submissions/graders/:id/...    ← Upload submission
6. GET /api/submissions/graders/:id/...     ← List submissions
7. POST /api/submissions/graders/:id/...    ← Trigger grading
8. GET /api/submissions/submissions/:id     ← Poll for results
9. GET /api/analytics/graders/:id/...       ← Get analytics
10. PATCH /api/submission-grades/:id        ← Override grade
```

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Connection refused | Start API: `npm run dev` |
| Times out | Increase MAX_POLL_TIME in script |
| 401 Unauthorized | Add SUPABASE_DEMO_TOKEN |
| 404 Not found | Check API endpoint paths |
| Database error | Check .env Supabase config |

## Environment Variables

```bash
API_URL                 # Default: http://localhost:4000
SUPABASE_DEMO_TOKEN    # Optional for local dev
NODE_ENV               # Optional
```

## Test Execution Flow

```
Health Check
    ↓
Create Course (save ID)
    ↓
Create Grader (save ID)
    ↓
Upload Submission (save ID)
    ↓
Trigger Grading
    ↓
Poll for Completion (up to 30 sec)
    ↓
Retrieve Analytics
    ↓
Override Grade (optional)
```

## What Gets Tested

- ✓ Server is running and healthy
- ✓ Course creation with metadata
- ✓ Grader setup with test files
- ✓ File upload and storage
- ✓ Grading job processing
- ✓ Result retrieval and polling
- ✓ Analytics generation
- ✓ Grade override functionality

## Exit Codes

```
0 = All tests passed
1 = One or more tests failed
```

## CI/CD Integration

```bash
# GitHub Actions
- run: npm run test:pipeline --prefix server

# Or in shell script
npm run test:pipeline && echo "OK" || echo "FAIL"
```

## Using Postman Instead

1. Import: `File > Import > postman-grading-pipeline.json`
2. Set variables: `baseUrl`, `demoToken` (optional)
3. Run collection or each request manually
4. Check built-in test assertions

## Customize Tests

```typescript
// Edit timeout (default 30 seconds)
const MAX_POLL_TIME = 60000;

// Edit polling interval (default 2 seconds)
const POLL_INTERVAL = 5000;

// Add custom test step
async function step9MyTest() { ... }
await step9MyTest(); // Add to runTests()
```

## Test Data Location

```
server/test-data/
├── sample-study-guide.txt      (Course material)
├── sample-test.txt             (Exam questions)
├── sample-memo.txt             (Marking scheme)
└── sample-submission.txt       (Student answer)
```

## Performance Notes

- **Duration:** 30-60 seconds typical
- **Bottleneck:** Grading job processing (10-30 sec)
- **Network:** Local API assumed
- **Database:** Real data created (can be cleaned up)

## Key Features

- ✓ No external test dependencies
- ✓ Clear pass/fail output
- ✓ Automatic polling for async operations
- ✓ Proper error handling and reporting
- ✓ Configurable via environment variables
- ✓ Works with or without authentication
- ✓ Can be integrated into CI/CD pipelines

## Common Patterns

### Run and check exit code
```bash
npm run test:pipeline
echo $?  # 0 = pass, 1 = fail
```

### Run in background
```bash
npm run test:pipeline &
```

### Run with timeout (Unix)
```bash
timeout 120 npm run test:pipeline
```

### Run in Docker
```dockerfile
WORKDIR /app/server
RUN npm ci
CMD ["npm", "run", "test:pipeline"]
```

## One-Liners

```bash
# Run and show exit code
npm run test:pipeline; echo "Exit: $?"

# Run with custom URL
API_URL=http://localhost:4000 npm run test:pipeline

# Run test and log output
npm run test:pipeline > test-results.log 2>&1

# Run tests repeatedly
for i in {1..3}; do npm run test:pipeline; done
```

## Further Reading

- **Quick Setup:** `QUICK_START_TESTING.md`
- **Full Guide:** `TEST_PIPELINE_README.md`
- **Complete Overview:** `TESTING_SETUP_SUMMARY.md`
- **API Docs:** Check `src/routes/*.ts`

---

**Summary:** A complete, production-ready testing suite for the Cleverly grading pipeline. Run with `npm run test:pipeline` for instant validation.
