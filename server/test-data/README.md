# Test Data for AI Grading Pipeline

This directory contains all test materials for validating the Cleverly AI grading functionality.

## 📁 Files in This Directory

### Exam & Memo Files

**sample-test.txt**
- Mathematics final examination
- 7 questions totaling 100 marks
- Topics: Calculus (derivatives, integrals), Linear Algebra, Series, Optimization
- Used for creating test graders

**sample-memo.txt**
- Comprehensive marking memorandum
- Detailed solutions with step-by-step marking
- Keywords for each question
- Mark allocation breakdown
- Used for AI rubric extraction

### Student Submission Files

**sample-submission.txt** (TEST_STUDENT_001)
- Perfect submission with all correct answers
- Complete working shown
- Expected AI score: 95-100/100
- Expected AI confidence: High (>0.85)

**sample-submission-errors.txt** (TEST_STUDENT_002)
- Submission containing several errors:
  - Q1: Arithmetic error (calculation mistake)
  - Q2: Integration error (missing term)
  - Q4: Conceptual error (wrong conclusion)
  - Q6: Skipped entirely
  - Q7: Incomplete
- Expected AI score: 60-70/100
- Tests partial credit assignment

**sample-submission-partial.txt** (TEST_STUDENT_003)
- Very incomplete submission
- Multiple no-attempts
- Some questions only partially answered
- Expected AI score: 15-25/100
- Tests handling of minimal effort

### Additional Materials

**sample-study-guide.txt**
- Course material for RAG context
- Used to test context-enhanced grading

### Verification & Testing

**verify-grading-data.sql**
- 15 comprehensive database verification queries
- Data integrity checks
- Performance analysis
- Grading accuracy metrics
- Run in Supabase SQL Editor

**TEST_CHECKLIST.md**
- Complete testing checklist
- Pre-test setup verification
- Step-by-step execution guide
- Results documentation template

## 🚀 Quick Usage

### Using with Automated Test

The automated test script automatically uses these files:

```bash
cd /Users/Rusumba/Oryares\ Sol/Cleverly/server
npm run test:pipeline
```

The script will:
1. Create a test course
2. Create a grader using `sample-test.txt` and `sample-memo.txt`
3. Upload `sample-submission.txt`
4. Trigger grading
5. Verify results

### Using Manually with API

#### Create Grader
```bash
curl -X POST http://localhost:4000/api/graders \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "course_id=YOUR_COURSE_ID" \
  -F "title=Math Final Exam" \
  -F "total_marks=100" \
  -F "test_file=@test-data/sample-test.txt" \
  -F "memo_file=@test-data/sample-memo.txt"
```

#### Upload Submissions
```bash
# Perfect submission
curl -X POST http://localhost:4000/api/submissions/graders/GRADER_ID/submissions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "student_identifier=Student_001" \
  -F "files=@test-data/sample-submission.txt"

# Submission with errors
curl -X POST http://localhost:4000/api/submissions/graders/GRADER_ID/submissions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "student_identifier=Student_002" \
  -F "files=@test-data/sample-submission-errors.txt"

# Partial submission
curl -X POST http://localhost:4000/api/submissions/graders/GRADER_ID/submissions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "student_identifier=Student_003" \
  -F "files=@test-data/sample-submission-partial.txt"
```

#### Trigger Grading
```bash
curl -X POST http://localhost:4000/api/submissions/graders/GRADER_ID/grade-all \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 📊 Expected Results

### Rubric Extraction

From `sample-memo.txt`, the AI should extract **7 rubric items**:

| Q# | Topic | Marks | Keywords |
|----|-------|-------|----------|
| 1 | Derivatives | 10 | derivative, evaluate, power rule |
| 2 | Definite Integrals | 10 | integral, antiderivative, bounds |
| 3 | Linear Equations | 10 | system, substitution, solve |
| 4 | Series Convergence | 10 | series, p-series, converges |
| 5 | Profit Optimization | 20 | profit, derivative, maximum |
| 6 | FTC Integration | 20 | integral, FTC, antiderivative |
| 7 | Matrix Analysis | 20 | eigenvalue, matrix, diagonalizable |

### Grading Results

| File | Student | Expected Score | Key Characteristics |
|------|---------|---------------|---------------------|
| sample-submission.txt | 001 | 95-100/100 | All correct, high confidence |
| sample-submission-errors.txt | 002 | 60-70/100 | Errors detected, partial credit |
| sample-submission-partial.txt | 003 | 15-25/100 | Incomplete, no-attempts |

### AI Confidence

- **Perfect answers**: Confidence > 0.85
- **Correct with minor issues**: Confidence 0.7-0.85
- **Partial attempts**: Confidence 0.5-0.7
- **No attempts**: Confidence 1.0 (certain it's empty)

## 🔍 Verification Steps

### 1. Check Rubric Extraction
```sql
SELECT
  question_number,
  max_marks,
  keywords,
  LEFT(expected_answer, 50) as answer_preview
FROM rubrics
WHERE grader_id = 'YOUR_GRADER_ID'
ORDER BY order_index;
```

Expected: 7 rows with questions 1-7

### 2. Check Grading Results
```sql
SELECT
  s.student_identifier,
  s.total_score,
  s.percentage,
  COUNT(sg.id) as grades_count,
  AVG(sg.confidence_score)::numeric(3,2) as avg_confidence
FROM submissions s
LEFT JOIN submission_grades sg ON sg.submission_id = s.id
WHERE s.grader_id = 'YOUR_GRADER_ID'
GROUP BY s.id;
```

Expected: 3 submissions with scores matching expected ranges

### 3. Check Individual Grades
```sql
SELECT
  r.question_number,
  sg.marks_awarded,
  r.max_marks,
  sg.confidence_score,
  LEFT(sg.ai_reasoning, 100) as reasoning
FROM submission_grades sg
JOIN rubrics r ON r.id = sg.rubric_id
WHERE sg.submission_id = 'YOUR_SUBMISSION_ID'
ORDER BY r.order_index;
```

Expected: 7 individual grades with appropriate marks and reasoning

## 📝 Creating Your Own Test Data

### Test File Format

Your test file should clearly indicate:
- Question numbers
- Question text
- Mark allocation per question

Example:
```
Question 1: (10 marks)
What is the derivative of f(x) = x²?

Question 2: (15 marks)
Solve for x: 2x + 3 = 7
```

### Memo File Format

Your memo should include:
- Question numbers matching test
- Expected answers
- Mark breakdown
- Optional keywords

Example:
```
Question 1: (10 marks)
Answer: f'(x) = 2x
Marking:
- Correct derivative: 10 marks
- Partial: 5 marks if method shown
Keywords: derivative, power rule

Question 2: (15 marks)
Answer: x = 2
Working:
2x = 7 - 3 = 4
x = 2
Keywords: equation, solve, variable
```

### Submission File Format

Student submissions should:
- Clearly indicate question numbers
- Show working where applicable
- Be readable plain text

Example:
```
STUDENT ANSWER SHEET

Question 1:
f(x) = x²
f'(x) = 2x

Question 2:
2x + 3 = 7
2x = 4
x = 2
```

## 🐛 Troubleshooting

### Rubric Not Extracted

**Symptoms**: Empty rubric array after grader creation

**Possible Causes**:
- Gemini API key not configured
- Memo file format unclear
- PDF parsing failed

**Solutions**:
- Check `GEMINI_API_KEY` in `.env`
- Use `.txt` files instead of PDFs
- Ensure memo follows clear format
- Check server logs for errors

### Grading Takes Too Long

**Symptoms**: Submissions stuck in "pending" or "processing"

**Possible Causes**:
- Worker not running
- Redis connection issue
- AI API slow/failing

**Solutions**:
- Check server logs for "Worker started"
- Verify Redis: `redis-cli ping`
- Check Gemini API quota
- Review failed jobs in Redis

### Incorrect Scores

**Symptoms**: AI scores don't match expectations

**Possible Causes**:
- Rubric extraction inaccurate
- Student answer format unclear
- Missing RAG context

**Solutions**:
- Review extracted rubric items
- Check `ai_reasoning` for explanation
- Ensure memo has clear expected answers
- Verify course materials uploaded

## 📚 Related Documentation

- **GRADING_TEST_REPORT.md** - Comprehensive testing guide
- **QUICK_TEST_GUIDE.md** - 5-minute quick start
- **GRADING_TEST_SUMMARY.md** - Overview of all test resources
- **TEST_CHECKLIST.md** - Testing checklist (in this directory)

## 🎯 Testing Goals

Use these files to verify:

✅ Rubric extraction accuracy
✅ AI grading correctness
✅ Partial credit assignment
✅ Error detection capability
✅ No-attempt handling
✅ Confidence score reliability
✅ Grade override functionality
✅ Performance benchmarks
✅ Database integrity

## 🔄 Updating Test Data

When creating new test scenarios:

1. Create exam file with clear questions
2. Create corresponding memo with detailed solutions
3. Create multiple student submissions:
   - One perfect (100%)
   - One with errors (60-80%)
   - One minimal (20-40%)
4. Document expected scores
5. Test and verify results
6. Add to this README

## 📞 Support

For issues with test data:
1. Check file format matches examples above
2. Review server logs for parsing errors
3. Verify AI API configuration
4. Test with provided sample files first
5. Consult comprehensive documentation

---

**Last Updated**: January 6, 2026
**Test Data Version**: 1.0
