# Quick Start Guide - Testing the Grading Pipeline

Get the test suite running in minutes!

## 1. Start Your API Server (Terminal 1)

```bash
cd server
npm run dev
```

Wait for this message:
```
Server listening on http://localhost:4000
```

## 2. Run the Test Suite (Terminal 2)

```bash
cd server
npm run test:pipeline
```

## That's It!

The test should complete in 30-60 seconds and show you the results.

### Expected Output

```
========================================
Grading Pipeline End-to-End Test Suite
========================================
API Base URL: http://localhost:4000
Auth Token: Not configured (using local dev mode)
========================================

[✓] Step 1: Health Check
    Server health check passed

[✓] Step 2: Create Course
    Course created successfully (ID: ...)

[✓] Step 3: Create Grader
    Grader created successfully (ID: ...)

[✓] Step 4: Upload Submission
    Submission uploaded successfully (ID: ...)

[✓] Step 5: Trigger Grading
    Grading started for 1 submission(s)

[✓] Step 6: Poll for Results
    Submission graded successfully. Total Score: 85/100

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

## Troubleshooting

### "Connection refused"
- Make sure API is running: `npm run dev` in terminal 1
- Check that it's on port 4000
- Try: `curl http://localhost:4000/api/health`

### Test times out waiting for grading
- This is normal for the first run (model initialization)
- Grading can take 10-30 seconds
- Check server logs for any errors
- You can increase timeout in `test-grading-pipeline.ts` if needed

### "HTTP 500" errors
- Check API server logs for detailed error messages
- Ensure Supabase/database is configured correctly
- Check `.env` file in server directory

### File upload errors
- Test data files are in `server/test-data/`
- If missing, the script creates dummy content
- You can replace with real PDF files if needed

## Alternative: Use Postman

If you prefer GUI testing:

1. Open Postman
2. Click "Import"
3. Select `server/postman-grading-pipeline.json`
4. Set variables:
   - `baseUrl`: http://localhost:4000
   - `demoToken`: (leave empty for local dev)
5. Run requests in order from the collection

## What Gets Tested

1. **Health Check** - Is the server running?
2. **Course Creation** - Can we create courses?
3. **Grader Setup** - Can we create graders with rubrics?
4. **File Upload** - Can we upload student submissions?
5. **Grading** - Does the automated grading work?
6. **Results** - Can we retrieve grades?
7. **Analytics** - Do statistics work?
8. **Grade Override** - Can we manually adjust grades?

## With Authentication

If your API requires Supabase tokens:

```bash
SUPABASE_DEMO_TOKEN=your_token npm run test:pipeline
```

Or in Postman: Set the `demoToken` variable before running.

## With Different API URL

```bash
API_URL=http://api.example.com npm run test:pipeline
```

## Common Next Steps

1. **Review test output** - Check what passed/failed
2. **Check database** - See created courses/submissions in Supabase
3. **Adjust test data** - Edit files in `test-data/` directory
4. **Extend tests** - Add more test scenarios to the script
5. **Integrate CI/CD** - Add to your GitHub Actions/deployment pipeline

## Still Having Issues?

Check the detailed guide: `TEST_PIPELINE_README.md`

It includes:
- Detailed configuration options
- All environment variables
- Troubleshooting for specific errors
- How to customize test data
- CI/CD integration examples
- API endpoint documentation
