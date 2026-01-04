import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../config/env.js";
import { GRADING_PROMPT } from "../prompts/grading.js";
import { RubricItem } from "../types/index.js";
import { fetchRagContext } from "./ragService.js";

const genAI = env.geminiApiKey ? new GoogleGenerativeAI(env.geminiApiKey) : null;

interface GradeResult {
  marks_awarded: number;
  ai_reasoning: string;
  confidence_score: number;
  feedback: string;
}

function fillPrompt(template: string, values: Record<string, string | number>): string {
  return Object.entries(values).reduce(
    (acc, [key, val]) => acc.replaceAll(`{${key}}`, String(val)),
    template
  );
}

export async function gradeAnswer(
  courseId: string,
  rubric: RubricItem,
  studentAnswer: string
): Promise<GradeResult> {
  const ragContext = await fetchRagContext(courseId, rubric.question_text ?? rubric.expected_answer);

  if (!genAI) {
    // Offline fallback scoring
    const containsKeyword =
      (rubric.keywords ?? []).some((kw) => studentAnswer.toLowerCase().includes(kw.toLowerCase())) ||
      studentAnswer.length > 0;
    const score = containsKeyword ? rubric.max_marks : 0;
    return {
      marks_awarded: score,
      ai_reasoning: "Local fallback grading used.",
      confidence_score: 0.5,
      feedback: containsKeyword ? "Looks correct." : "No relevant content found."
    };
  }

  const model = genAI.getGenerativeModel({ model: "gemini-pro" });
  const prompt = fillPrompt(GRADING_PROMPT, {
    question_text: rubric.question_text ?? "",
    expected_answer: rubric.expected_answer,
    keywords: (rubric.keywords ?? []).join(", "),
    max_marks: rubric.max_marks,
    rag_context: ragContext || "No extra context available.",
    student_answer: studentAnswer
  });

  const response = await model.generateContent(prompt);
  const text = response.response.text();
  try {
    const parsed = JSON.parse(text) as GradeResult;
    return parsed;
  } catch (err) {
    const numericScore = Number(text.match(/-?\d+(\.\d+)?/)?.[0]) || 0;
    return {
      marks_awarded: Math.min(numericScore, rubric.max_marks),
      ai_reasoning: text,
      confidence_score: 0.4,
      feedback: "Auto-parsed score; please review."
    };
  }
}
