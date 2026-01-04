import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../config/env.js";
import pdfParse from "pdf-parse";

const genAI = env.geminiApiKey ? new GoogleGenerativeAI(env.geminiApiKey) : null;

const OCR_INSTRUCTIONS = `You are an expert at reading handwritten exam papers. Extract ALL handwritten text from this exam paper.

IMPORTANT INSTRUCTIONS:
1. Identify question numbers (e.g., "1", "1.a", "2.b", "Q1", etc.) and their corresponding answers
2. Preserve mathematical notation using plain text or LaTeX where appropriate
3. Handle poor handwriting with best-effort transcription
4. Ignore metadata like student names, dates, or headers unless they are part of question answers
5. Return your response as a JSON object with this exact structure:
{
  "answers": {
    "1": "Student's answer to question 1",
    "1.a": "Student's answer to question 1.a",
    "2": "Student's answer to question 2"
  },
  "raw_text": "Complete transcription of all text found in the document"
}

If you cannot identify clear question numbers, put all text under a single "1" key.
Return ONLY the JSON object, no additional text.`;

export async function extractAnswersFromPdf(
  buffer: Buffer
): Promise<{ answers: Record<string, string>; rawText: string }> {
  if (!genAI) {
    console.warn("[OCR] No Gemini API key, falling back to pdf-parse");
    return fallbackPdfParse(buffer);
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const base64Data = buffer.toString("base64");

    const result = await model.generateContent([
      OCR_INSTRUCTIONS,
      {
        inlineData: {
          mimeType: "application/pdf",
          data: base64Data
        }
      }
    ]);

    const responseText = result.response.text();

    // Try to parse JSON response
    try {
      // Remove markdown code blocks if present
      const jsonText = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const parsed = JSON.parse(jsonText);

      return {
        answers: parsed.answers || {},
        rawText: parsed.raw_text || responseText
      };
    } catch (parseError) {
      console.warn("[OCR] Failed to parse Gemini JSON response, attempting text extraction");
      // Fall back to regex-based extraction
      const extracted = extractAnswersFromText(responseText);
      return {
        answers: extracted,
        rawText: responseText
      };
    }
  } catch (error) {
    console.error("[OCR] Gemini Vision API error:", error);
    // Fall back to pdf-parse
    return fallbackPdfParse(buffer);
  }
}

/**
 * Extract question-answer pairs from plain text using pattern matching
 */
function extractAnswersFromText(text: string): Record<string, string> {
  const answers: Record<string, string> = {};

  // Patterns for question numbers: "1.", "1.a)", "Q1:", "Question 1:", etc.
  const questionPattern = /(?:Question\s*|Q\.?\s*)?(\d+(?:\.\d+)?(?:[a-z])?)[:\.)]\s*/gi;
  const matches = [...text.matchAll(questionPattern)];

  if (matches.length === 0) {
    // No clear question markers, return all text as question 1
    return { "1": text.trim() };
  }

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const questionNum = match[1];
    const startIdx = match.index! + match[0].length;
    const endIdx = i < matches.length - 1 ? matches[i + 1].index! : text.length;
    const answerText = text.slice(startIdx, endIdx).trim();

    if (answerText) {
      answers[questionNum] = answerText;
    }
  }

  return answers;
}

/**
 * Fallback to pdf-parse for basic text extraction
 */
async function fallbackPdfParse(buffer: Buffer): Promise<{ answers: Record<string, string>; rawText: string }> {
  try {
    const data = await pdfParse(buffer);
    const rawText = data.text || "";
    const answers = extractAnswersFromText(rawText);

    return { answers, rawText };
  } catch (error) {
    console.error("[OCR] pdf-parse error:", error);
    return { answers: {}, rawText: "" };
  }
}
