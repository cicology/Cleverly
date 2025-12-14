# Grading Pipeline End-to-End Test Suite

A comprehensive test script to verify the entire grading pipeline workflow, from course creation to grade retrieval and override functionality.

## Overview

This test suite validates the following workflow:

1. **Health Check** - Verify the API server is running
2. **Create Course** - Create a test course with study materials
3. **Create Grader** - Set up a grader with test files and marking memo
4. **Upload Submission** - Submit a student answer document
5. **Trigger Grading** - Start the automated grading process
6. **Poll for Results** - Wait for grading to complete with polling
7. **Get Analytics** - Retrieve grading statistics
8. **Override Grade** (Optional) - Test manual grade adjustment

## Prerequisites

- Backend API running at `http://localhost:4000` (or configured via `API_URL`)
- Node.js 16+ with `tsx` installed
- (Optional) Supabase authentication token for auth-protected endpoints

## Installation

The test script is already set up in the server directory. No additional installation needed beyond the existing project dependencies.

## Usage

### Basic Usage

Run the test suite from the server directory:

```bash
npm run test:pipeline
```

Or directly with tsx:

```bash
tsx test-grading-pipeline.ts
```

### With Custom API URL

```bash
API_URL=http://your-api-server:4000 npm run test:pipeline
```

### With Authentication Token

If your backend requires Supabase authentication:

```bash
SUPABASE_DEMO_TOKEN=your_demo_token npm run test:pipeline
```

### Full Configuration Example

```bash
API_URL=http://localhost:4000 \
SUPABASE_DEMO_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... \
npm run test:pipeline
```

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `API_URL` | `http://localhost:4000` | Backend API base URL |
| `SUPABASE_DEMO_TOKEN` | (none) | Supabase auth token (optional for local dev) |

### Test Parameters

Edit these constants in `test-grading-pipeline.ts` to customize behavior:

```typescript
const API_BASE_URL = process.env.API_URL || "http://localhost:4000";
const DEMO_TOKEN = process.env.SUPABASE_DEMO_TOKEN || "";
const POLL_INTERVAL = 2000; // 2 seconds between polls
const MAX_POLL_TIME = 30000; // 30 seconds max wait time
```

## Test Data

Sample test files are located in `server/test-data/`:

- **sample-study-guide.txt** - Course material uploaded during course creation
- **sample-test.txt** - Exam questions uploaded during grader creation
- **sample-memo.txt** - Marking memorandum uploaded during grader creation
- **sample-submission.txt** - Student submission uploaded for grading

These files can be edited to test different content or replaced with actual PDF files if your backend supports PDF uploads.

## Test Output

The test suite provides detailed output for each step:

### Success Output Example

```
========================================
Grading Pipeline End-to-End Test Suite
========================================
API Base URL: http://localhost:4000
Auth Token: Not configured (using local dev mode)
========================================

[✓] Step 1: Health Check
    Server health check passed
    Data: {"ok":true}

[✓] Step 2: Create Course
    Course created successfully (ID: 550e8400-e29b-41d4-a716-446655440000)
    Data: {"id":"550e8400-e29b-41d4-a716-446655440000","title":"Advanced Mathematics...

[✓] Step 3: Create Grader
    Grader created successfully (ID: 550e8400-e29b-41d4-a716-446655440001)
    Data: {"grader_id":"550e8400-e29b-41d4-a716-446655440001","status":"processing"}

[✓] Step 4: Upload Submission
    Submission uploaded successfully (ID: 550e8400-e29b-41d4-a716-446655440002)
    Data: {"id":"550e8400-e29b-41d4-a716-446655440002","status":"pending"}

[✓] Step 5: Trigger Grading
    Grading started for 1 submission(s)
    Data: {"queued":1}

[✓] Step 6: Poll for Results
    Submission graded successfully. Total Score: 85/100
    Data: {"submission":{"id":"...","status":"graded","total_score":85}...

[✓] Step 7: Get Analytics
    Analytics retrieved successfully
    Data: {"graded_count":1,"pending_count":0,"average_percentage":85}

[✓] Step 8: Override Grade (Optional)
    Grade override completed successfully
    Data: {"updated":true}

========================================
Test Summary
========================================
Total Tests: 8
Passed: 8
Failed: 0

✓ All tests passed!
```

### Failure Output Example

If a step fails, the output will show:

```
[✗] Step 2: Create Course
    Failed to create course
    Error: HTTP 500: {"error":"Database connection failed"}
```

## Exit Codes

- **0** - All tests passed
- **1** - One or more tests failed or execution error

This allows the test to be used in CI/CD pipelines:

```bash
npm run test:pipeline && echo "Tests passed!" || echo "Tests failed!"
```

## Troubleshooting

### Connection Refused

**Error:** `Error: HTTP connection refused`

**Solution:** Ensure the backend API is running:
```bash
npm run dev:server
```

### 404 Not Found Errors

**Error:** `HTTP 404: Not found`

**Cause:** The API endpoints may have changed or the server is not serving the expected routes.

**Solution:**
- Check that the API routes match those defined in `src/routes/`
- Verify the API base URL is correct

### Authentication Errors

**Error:** `HTTP 401: Unauthorized`

**Solution:**
- For local development without auth: Don't set `SUPABASE_DEMO_TOKEN`
- For production: Ensure the token is valid and hasn't expired
- Check that auth middleware is correctly configured in `src/middleware/auth.ts`

### Timeout Waiting for Grading

**Error:** `Polling timeout. Last status: pending`

**Cause:** The grading worker may not be running or processing submissions.

**Solution:**
- Verify the grading worker is initialized in `src/workers/gradingWorker.ts`
- Check server logs for processing errors
- Increase `MAX_POLL_TIME` constant if needed for slower systems

### Form Data Errors

**Error:** `HTTP 400: Bad request` during file uploads

**Cause:** Form data structure may not match API expectations.

**Solution:**
- Ensure files are attached with correct field names: `test_file`, `memo_file`, `files`
- Verify the file content is not empty
- Check Content-Type headers are set correctly (multipart/form-data)

## API Endpoints Tested

### 1. Health Check
```
GET /api/health
```

### 2. Create Course
```
POST /api/courses
- Fields: title, description, topics
- Files: study_guide, textbook, extra_content (optional)
```

### 3. Create Grader
```
POST /api/graders
- Fields: course_id, title, total_marks
- Files: test_file, memo_file (optional)
```

### 4. Upload Submission
```
POST /api/submissions/graders/:graderId/submissions
- Fields: student_identifier
- Files: files (array)
```

### 5. Trigger Grading
```
POST /api/submissions/graders/:graderId/grade-all
```

### 6. Get Submission
```
GET /api/submissions/submissions/:submissionId
```

### 7. Get Analytics
```
GET /api/analytics/graders/:graderId/analytics
```

### 8. Override Grade
```
PATCH /api/submission-grades/:gradeId
- Body: { marks_awarded, override_reason }
```

## Integration with CI/CD

### GitHub Actions Example

```yaml
name: Test Grading Pipeline

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:latest
        env:
          POSTGRES_PASSWORD: postgres
      api:
        image: your-api-image
        ports:
          - 4000:4000

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18

      - name: Install dependencies
        working-directory: ./server
        run: npm ci

      - name: Run grading pipeline tests
        working-directory: ./server
        env:
          API_URL: http://localhost:4000
          SUPABASE_DEMO_TOKEN: ${{ secrets.DEMO_TOKEN }}
        run: npm run test:pipeline
```

## Test Data Customization

To use different test data:

1. **Replace test files** in `server/test-data/`:
   - Update `.txt` files with new content
   - Or convert PDF files to text content

2. **Add more test cases** by extending the test script:
   ```typescript
   async function step9CustomTest() {
     try {
       // Your test logic
       logResult({
         step: "Step 9: Custom Test",
         success: true,
         message: "Custom test passed",
         data: response
       });
     } catch (error) {
       logResult({
         step: "Step 9: Custom Test",
         success: false,
         message: "Custom test failed",
         error: String(error)
       });
     }
   }

   // Add to runTests():
   await step9CustomTest();
   ```

3. **Modify test parameters** in the script:
   - Change course titles, descriptions
   - Adjust grader configurations
   - Update student identifiers

## Performance Notes

- **Polling**: Defaults to 2-second intervals with 30-second timeout. Adjust `POLL_INTERVAL` and `MAX_POLL_TIME` based on your grading service performance
- **File Size**: Test files are kept small (~5KB) for quick uploads. Larger files will take more time
- **Concurrency**: Tests run sequentially to maintain dependencies. Parallel execution would require refactoring

## API Response Expectations

The test expects specific response formats. If your API returns different structures, update the parsing logic:

```typescript
// Example: If API returns different course ID field
if (response.ok && data.courseId) {  // Changed from data.course.id
  courseId = data.courseId;
}
```

## Limitations

1. **No SSL/TLS Testing** - Script assumes HTTP or handles HTTPS automatically
2. **No Load Testing** - Single sequential requests, not concurrent
3. **No Database Cleanup** - Test data remains in the database
4. **Text Files Only** - Sample test data uses `.txt` format; real PDFs may process differently

## Database Cleanup

To clean up test data after running tests:

```sql
-- PostgreSQL example
DELETE FROM submission_grades WHERE submission_id IN (
  SELECT id FROM submissions WHERE grader_id IN (
    SELECT id FROM graders WHERE title LIKE 'Mathematics Final Exam - Test Grader%'
  )
);

DELETE FROM submissions WHERE grader_id IN (
  SELECT id FROM graders WHERE title LIKE 'Mathematics Final Exam - Test Grader%'
);

DELETE FROM graders WHERE title LIKE 'Mathematics Final Exam - Test Grader%';

DELETE FROM courses WHERE title LIKE 'Advanced Mathematics - Test Course%';
```

## Contributing

To extend the test suite:

1. Add new test step functions (step9, step10, etc.)
2. Follow the same `logResult()` pattern
3. Use proper error handling with try/catch
4. Document the new test in this README
5. Update the `runTests()` function to include new steps

## Support

For issues or questions:

1. Check the troubleshooting section above
2. Review server logs: `npm run dev:server`
3. Verify API endpoints match `src/routes/*.ts` definitions
4. Test individual endpoints manually with curl or Postman

## License

Part of the Cleverly AI Grader project.
