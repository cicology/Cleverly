import { GoogleGenerativeAI } from "@google/generative-ai";
import { RUBRIC_EXTRACTION_PROMPT } from "../prompts/rubricExtraction.js";
import { env } from "../config/env.js";
import { RubricItem } from "../types/index.js";

const genAI = env.geminiApiKey ? new GoogleGenerativeAI(env.geminiApiKey) : null;

export async function extractRubricFromText(testText: string, memoText: string): Promise<RubricItem[]> {
  if (!genAI) {
    // Fallback stub for offline work
    return [
      {
        question_number: "1",
        question_text: testText.slice(0, 120) || "Sample question",
        expected_answer: memoText.slice(0, 120) || "Sample answer",
        keywords: ["concept"],
        max_marks: 5
      }
    ];
  }

  const model = genAI.getGenerativeModel({ model: "gemini-pro" });
  const prompt = `${RUBRIC_EXTRACTION_PROMPT}
TEST PAPER:
${testText}

MEMORANDUM:
${memoText}
`;

  const response = await model.generateContent(prompt);
  const text = response.response.text();
  try {
    const parsed = JSON.parse(text) as RubricItem[];
    return parsed;
  } catch (err) {
    console.warn("[rubric] Failed to parse Gemini output, returning raw block");
    return [
      {
        question_number: "1",
        question_text: "Unparsed rubric",
        expected_answer: text,
        max_marks: 0
      }
    ];
  }
}
