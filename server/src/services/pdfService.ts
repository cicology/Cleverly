import fs from "fs";
import path from "path";
import pdfParse from "pdf-parse";

export async function extractTextFromBuffer(buffer: Buffer, filename?: string): Promise<string> {
  const lower = (filename ?? "").toLowerCase();

  if (lower.endsWith(".pdf")) {
    try {
      const parsed = await pdfParse(buffer);
      return parsed.text || "";
    } catch (err) {
      console.warn("[pdfService] pdf-parse failed, returning empty text", err);
      return "";
    }
  }

  if (lower.endsWith(".txt") || lower.endsWith(".md")) {
    return buffer.toString("utf-8");
  }

  // Fallback for other doc types (docx, etc.) — could integrate a converter here.
  return buffer.toString("utf-8");
}

export function extractTextFromFile(filePath: string): string {
  try {
    const buffer = fs.readFileSync(path.resolve(filePath));
    return buffer.toString("utf-8");
  } catch (err) {
    console.warn("[pdfService] Failed to read local file", err);
    return "";
  }
}
