import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../config/env.js";
import pdfParse from "pdf-parse";
import { createFilePrompt, getGeminiFileSearchClient, uploadFileForModel } from "./geminiFileSearchService.js";

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
  const fileSearchClient = getGeminiFileSearchClient();
  const ocrModel = env.geminiFileSearchEnabled ? env.geminiFileSearchModel : env.ocrModel;

  if (fileSearchClient && env.geminiFileSearchEnabled) {
    const fileSearchResult = await extractWithFileSearch(buffer, ocrModel);
    if (fileSearchResult) {
      return fileSearchResult;
    }
  }

  if (!genAI) {
    console.warn("[OCR] No Gemini API key, falling back to pdf-parse");
    return fallbackPdfParse(buffer);
  }

  try {
    const model = genAI.getGenerativeModel({ model: ocrModel });
    const base64Data = buffer.toString("base64");

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            { text: OCR_INSTRUCTIONS },
            {
              inlineData: {
                mimeType: "application/pdf",
                data: base64Data
              }
            }
          ]
        }
      ],
      generationConfig: {
        responseMimeType: "application/json"
      }
    });

    const responseText = result.response.text();

    // Robust JSON parsing with multiple fallback strategies
    const parsedResult = parseGeminiResponse(responseText);

    if (parsedResult) {
      return parsedResult;
    }

    // If JSON parsing completely fails, fall back to text extraction
    console.warn("[OCR] All JSON parsing attempts failed, falling back to text extraction");
    const extracted = extractAnswersFromText(responseText);
    return {
      answers: extracted,
      rawText: responseText
    };
  } catch (error) {
    console.error("[OCR] Gemini Vision API error:", error);
    // Fall back to pdf-parse
    return fallbackPdfParse(buffer);
  }
}

async function extractWithFileSearch(
  buffer: Buffer,
  modelName: string
): Promise<{ answers: Record<string, string>; rawText: string } | null> {
  const ai = getGeminiFileSearchClient();
  if (!ai) return null;

  try {
    const uploaded = await uploadFileForModel({
      fileName: "submission.pdf",
      mimeType: "application/pdf",
      buffer
    });

    const fileRecord = uploaded as { uri?: string; mimeType?: string } | null;
    const fileUri = fileRecord?.uri;
    const fileMime = fileRecord?.mimeType ?? "application/pdf";

    if (!fileUri) {
      console.warn("[OCR] File upload failed; falling back to inline OCR.");
      return null;
    }

    const content = createFilePrompt(fileUri, fileMime, OCR_INSTRUCTIONS);
    const response = await ai.models.generateContent({
      model: modelName,
      contents: content,
      config: {
        responseMimeType: "application/json"
      }
    });

    const rawText = (response as { text?: unknown }).text;
    const responseText = typeof rawText === "function" ? rawText() : rawText ?? "";
    const parsedResult = parseGeminiResponse(responseText);

    if (parsedResult) {
      return parsedResult;
    }

    console.warn("[OCR] File search OCR JSON parsing failed, attempting text extraction");
    const extracted = extractAnswersFromText(responseText);
    return {
      answers: extracted,
      rawText: responseText
    };
  } catch (error) {
    console.error("[OCR] File search OCR failed:", error);
    return null;
  }
}

/**
 * Robust JSON parsing with multiple strategies and validation
 */
function parseGeminiResponse(responseText: string): { answers: Record<string, string>; rawText: string } | null {
  try {
    // Strategy 1: Remove markdown code blocks
    let jsonText = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    let parsed: any;

    try {
      parsed = JSON.parse(jsonText);
    } catch (firstError) {
      // Strategy 2: Try to find JSON object in the text
      const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[0]);
        } catch (secondError) {
          // Strategy 3: Try to fix common JSON issues
          const fixedJson = fixCommonJsonIssues(jsonMatch[0]);
          try {
            parsed = JSON.parse(fixedJson);
          } catch (thirdError) {
            console.warn("[OCR] All JSON parsing strategies failed:", {
              first: firstError instanceof Error ? firstError.message : String(firstError),
              second: secondError instanceof Error ? secondError.message : String(secondError),
              third: thirdError instanceof Error ? thirdError.message : String(thirdError)
            });
            return null;
          }
        }
      } else {
        console.warn("[OCR] No JSON object found in response");
        return null;
      }
    }

    // Validate the parsed JSON has the expected structure
    if (!parsed || typeof parsed !== "object") {
      console.warn("[OCR] Parsed result is not an object");
      return null;
    }

    // Extract answers with validation
    const answers: Record<string, string> = {};
    if (parsed.answers && typeof parsed.answers === "object") {
      // Ensure all answer values are strings
      for (const [key, value] of Object.entries(parsed.answers)) {
        if (typeof value === "string") {
          answers[key] = value;
        } else if (value != null) {
          // Convert non-string values to strings
          answers[key] = String(value);
        }
      }
    }

    // If no valid answers found, return null to trigger fallback
    if (Object.keys(answers).length === 0) {
      console.warn("[OCR] No valid answers found in parsed JSON");
      return null;
    }

    return {
      answers,
      rawText: typeof parsed.raw_text === "string" ? parsed.raw_text : responseText
    };
  } catch (error) {
    console.error("[OCR] Unexpected error in parseGeminiResponse:", error);
    return null;
  }
}

/**
 * Attempt to fix common JSON syntax issues
 */
function fixCommonJsonIssues(jsonStr: string): string {
  return jsonStr
    // Fix trailing commas in objects and arrays
    .replace(/,(\s*[}\]])/g, "$1")
    // Fix single quotes to double quotes (basic attempt)
    .replace(/'/g, '"')
    // Remove any potential BOM or zero-width characters
    .replace(/^\uFEFF/, "")
    .trim();
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
