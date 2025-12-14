export const RUBRIC_EXTRACTION_PROMPT = `
You are an expert educational assessment analyst. You have been given two documents:
1. A TEST PAPER containing questions
2. A MEMORANDUM containing model answers and marking guidelines

Your task is to analyze both documents and extract a structured rubric.

OUTPUT FORMAT (JSON Array):
[
  {
    "question_number": "1.a",
    "question_text": "The actual question text",
    "expected_answer": "The model answer from the memo",
    "keywords": ["key", "terms", "for", "marks"],
    "max_marks": 5
  }
]

RULES:
- Extract EVERY question, including sub-questions (1.a, 1.b, etc.)
- Include mark allocations exactly as specified in the memo
- Identify keywords that are essential for earning marks
- Preserve mathematical notation using LaTeX format where applicable

Analyze the documents and provide the JSON output:
`;
