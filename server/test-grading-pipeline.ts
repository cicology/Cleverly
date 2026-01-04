#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configuration
const API_BASE_URL = process.env.API_URL || "http://localhost:4000";
const DEMO_TOKEN = process.env.SUPABASE_DEMO_TOKEN || "";
const POLL_INTERVAL = 2000; // 2 seconds
const MAX_POLL_TIME = 30000; // 30 seconds

interface TestResult {
  step: string;
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

const results: TestResult[] = [];
let courseId = "";
let graderId = "";
let submissionId = "";
let gradeId = "";

// Utility functions
function getHeaders(includeAuth = true): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json"
  };
  if (includeAuth && DEMO_TOKEN) {
    headers["Authorization"] = `Bearer ${DEMO_TOKEN}`;
  }
  return headers;
}

async function makeRequest(
  method: string,
  endpoint: string,
  body?: any,
  useFormData = false
): Promise<any> {
  const url = `${API_BASE_URL}${endpoint}`;
  const options: any = {
    method,
    headers: useFormData ? {} : getHeaders()
  };

  if (body) {
    if (useFormData) {
      options.body = body;
    } else {
      options.body = JSON.stringify(body);
    }
  }

  const response = await fetch(url, options);
  const text = await response.text();

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${text}`);
  }

  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

function logResult(result: TestResult) {
  results.push(result);
  const status = result.success ? "✓" : "✗";
  console.log(`\n[${status}] ${result.step}`);
  console.log(`    ${result.message}`);
  if (result.data) {
    console.log(`    Data:`, JSON.stringify(result.data).substring(0, 200));
  }
  if (result.error) {
    console.log(`    Error:`, result.error);
  }
}

function createFormData(fields: Record<string, any>): FormData {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    if (value instanceof Buffer || Buffer.isBuffer(value)) {
      formData.append(key, new Blob([value], { type: "application/octet-stream" }), `${key}.txt`);
    } else if (typeof value === "string") {
      formData.append(key, value);
    } else {
      formData.append(key, JSON.stringify(value));
    }
  }
  return formData;
}

// Test steps
async function step1HealthCheck() {
  try {
    const response = await makeRequest("GET", "/api/health");
    logResult({
      step: "Step 1: Health Check",
      success: response.ok !== false,
      message: "Server health check passed",
      data: response
    });
  } catch (error) {
    logResult({
      step: "Step 1: Health Check",
      success: false,
      message: "Health check failed",
      error: String(error)
    });
    throw error;
  }
}

async function step2CreateCourse() {
  try {
    const courseData = {
      title: "Advanced Mathematics - Test Course",
      description: "Test course for grading pipeline validation",
      topics: JSON.stringify(["Calculus", "Algebra", "Geometry"])
    };

    const formData = new FormData();
    formData.append("title", courseData.title);
    formData.append("description", courseData.description);
    formData.append("topics", courseData.topics);

    // Add study guide if available
    const guideFile = path.join(__dirname, "test-data", "sample-study-guide.txt");
    if (fs.existsSync(guideFile)) {
      const guideBuffer = fs.readFileSync(guideFile);
      formData.append("study_guide", new Blob([guideBuffer]), "study-guide.txt");
    }

    const url = `${API_BASE_URL}/api/courses`;
    const response = await fetch(url, {
      method: "POST",
      headers: DEMO_TOKEN ? { Authorization: `Bearer ${DEMO_TOKEN}` } : {},
      body: formData
    });

    const data = await response.json();

    if (response.ok && data.course?.id) {
      courseId = data.course.id;
      logResult({
        step: "Step 2: Create Course",
        success: true,
        message: `Course created successfully (ID: ${courseId})`,
        data: data.course
      });
    } else {
      throw new Error(data.error || "Failed to create course");
    }
  } catch (error) {
    logResult({
      step: "Step 2: Create Course",
      success: false,
      message: "Failed to create course",
      error: String(error)
    });
    throw error;
  }
}

async function step3CreateGrader() {
  try {
    const graderData = {
      course_id: courseId,
      title: "Mathematics Final Exam - Test Grader",
      total_marks: 100
    };

    const formData = new FormData();
    formData.append("course_id", graderData.course_id);
    formData.append("title", graderData.title);
    formData.append("total_marks", String(graderData.total_marks));

    // Add test file if available
    const testFile = path.join(__dirname, "test-data", "sample-test.txt");
    if (fs.existsSync(testFile)) {
      const testBuffer = fs.readFileSync(testFile);
      formData.append("test_file", new Blob([testBuffer]), "test.txt");
    }

    // Add memo file if available
    const memoFile = path.join(__dirname, "test-data", "sample-memo.txt");
    if (fs.existsSync(memoFile)) {
      const memoBuffer = fs.readFileSync(memoFile);
      formData.append("memo_file", new Blob([memoBuffer]), "memo.txt");
    }

    const url = `${API_BASE_URL}/api/graders`;
    const response = await fetch(url, {
      method: "POST",
      headers: DEMO_TOKEN ? { Authorization: `Bearer ${DEMO_TOKEN}` } : {},
      body: formData
    });

    const data = await response.json();

    if (response.ok && data.grader_id) {
      graderId = data.grader_id;
      logResult({
        step: "Step 3: Create Grader",
        success: true,
        message: `Grader created successfully (ID: ${graderId})`,
        data
      });
    } else {
      throw new Error(data.error || "Failed to create grader");
    }
  } catch (error) {
    logResult({
      step: "Step 3: Create Grader",
      success: false,
      message: "Failed to create grader",
      error: String(error)
    });
    throw error;
  }
}

async function step4UploadSubmission() {
  try {
    const formData = new FormData();
    formData.append("student_identifier", "TEST_STUDENT_001");

    // Add submission file
    const submissionFile = path.join(__dirname, "test-data", "sample-submission.txt");
    if (fs.existsSync(submissionFile)) {
      const submissionBuffer = fs.readFileSync(submissionFile);
      formData.append("files", new Blob([submissionBuffer]), "submission.txt");
    } else {
      // Create a default submission if file doesn't exist
      const defaultContent = "Test Student Answer\n\nQ1: This is my answer to question 1\nQ2: This is my answer to question 2\n";
      formData.append("files", new Blob([defaultContent]), "submission.txt");
    }

    const url = `${API_BASE_URL}/api/graders/${graderId}/submissions`;
    const response = await fetch(url, {
      method: "POST",
      headers: DEMO_TOKEN ? { Authorization: `Bearer ${DEMO_TOKEN}` } : {},
      body: formData
    });

    const data = await response.json();

    if (response.ok && data.submissions?.[0]?.id) {
      submissionId = data.submissions[0].id;
      logResult({
        step: "Step 4: Upload Submission",
        success: true,
        message: `Submission uploaded successfully (ID: ${submissionId})`,
        data: data.submissions[0]
      });
    } else {
      throw new Error(data.error || "Failed to upload submission");
    }
  } catch (error) {
    logResult({
      step: "Step 4: Upload Submission",
      success: false,
      message: "Failed to upload submission",
      error: String(error)
    });
    throw error;
  }
}

async function step5TriggerGrading() {
  try {
    const url = `${API_BASE_URL}/api/graders/${graderId}/grade-all`;
    const response = await fetch(url, {
      method: "POST",
      headers: DEMO_TOKEN ? { Authorization: `Bearer ${DEMO_TOKEN}` } : {}
    });

    const data = await response.json();

    if (response.ok) {
      logResult({
        step: "Step 5: Trigger Grading",
        success: true,
        message: `Grading started for ${data.queued} submission(s)`,
        data
      });
    } else {
      throw new Error(data.error || "Failed to trigger grading");
    }
  } catch (error) {
    logResult({
      step: "Step 5: Trigger Grading",
      success: false,
      message: "Failed to trigger grading",
      error: String(error)
    });
    throw error;
  }
}

async function step6PollForResults() {
  try {
    const startTime = Date.now();
    let submission: any = null;

    while (Date.now() - startTime < MAX_POLL_TIME) {
      try {
        const response = await makeRequest("GET", `/api/submissions/${submissionId}`);

        if (response.submission) {
          submission = response.submission;

          if (submission.status === "graded") {
            if (response.grades?.[0]?.id) {
              gradeId = response.grades[0].id;
            }

            logResult({
              step: "Step 6: Poll for Results",
              success: true,
              message: `Submission graded successfully. Total Score: ${submission.total_score}/${submission.max_possible_score}`,
              data: { submission, grades: response.grades }
            });
            return;
          }
        }
      } catch (e) {
        // Continue polling on error
      }

      // Wait before next poll
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL));
    }

    if (submission?.status !== "graded") {
      logResult({
        step: "Step 6: Poll for Results",
        success: false,
        message: `Polling timeout. Last status: ${submission?.status || "unknown"}`,
        data: submission
      });
    }
  } catch (error) {
    logResult({
      step: "Step 6: Poll for Results",
      success: false,
      message: "Failed to poll for results",
      error: String(error)
    });
  }
}

async function step7GetAnalytics() {
  try {
    const response = await makeRequest("GET", `/api/graders/${graderId}/analytics`);

    logResult({
      step: "Step 7: Get Analytics",
      success: true,
      message: "Analytics retrieved successfully",
      data: response.stats
    });
  } catch (error) {
    logResult({
      step: "Step 7: Get Analytics",
      success: false,
      message: "Failed to get analytics",
      error: String(error)
    });
  }
}

async function step8OverrideGrade() {
  if (!gradeId) {
    logResult({
      step: "Step 8: Override Grade",
      success: false,
      message: "Skipped - no grade ID available from grading results"
    });
    return;
  }

  try {
    const response = await makeRequest("PATCH", `/api/submission-grades/${gradeId}`, {
      marks_awarded: 85,
      override_reason: "Test override for verification purposes"
    });

    logResult({
      step: "Step 8: Override Grade (Optional)",
      success: true,
      message: "Grade override completed successfully",
      data: response
    });
  } catch (error) {
    logResult({
      step: "Step 8: Override Grade (Optional)",
      success: false,
      message: "Failed to override grade",
      error: String(error)
    });
  }
}

// Main execution
async function runTests() {
  console.log("========================================");
  console.log("Grading Pipeline End-to-End Test Suite");
  console.log("========================================");
  console.log(`API Base URL: ${API_BASE_URL}`);
  console.log(`Auth Token: ${DEMO_TOKEN ? "Configured" : "Not configured (using local dev mode)"}`);
  console.log("========================================\n");

  try {
    // Execute tests in sequence
    await step1HealthCheck();
    await step2CreateCourse();
    await step3CreateGrader();
    await step4UploadSubmission();
    await step5TriggerGrading();
    await step6PollForResults();
    await step7GetAnalytics();
    await step8OverrideGrade();

    // Print summary
    console.log("\n========================================");
    console.log("Test Summary");
    console.log("========================================");

    const passed = results.filter((r) => r.success).length;
    const total = results.length;

    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${total - passed}`);

    if (passed === total) {
      console.log("\n✓ All tests passed!");
      process.exit(0);
    } else {
      console.log("\n✗ Some tests failed. Check output above for details.");
      process.exit(1);
    }
  } catch (error) {
    console.error("\n✗ Test execution failed:", error);
    process.exit(1);
  }
}

// Run the tests
runTests();
