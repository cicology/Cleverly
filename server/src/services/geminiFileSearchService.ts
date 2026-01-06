import { GoogleGenAI, createUserContent, createPartFromUri } from "@google/genai";
import { env } from "../config/env.js";
import { supabase } from "../config/supabase.js";
import { cleanupTempFile, writeTempFile } from "./tempFileService.js";

const ai = env.geminiApiKey && env.geminiFileSearchEnabled
  ? new GoogleGenAI({ apiKey: env.geminiApiKey })
  : null;

type UploadParams = {
  courseId: string;
  fileName: string;
  mimeType: string;
  buffer: Buffer;
};

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForOperation(operation: any): Promise<void> {
  if (!operation || operation.done) return;
  const deadline = Date.now() + env.geminiFileSearchMaxWaitMs;
  let op = operation;
  while (!op.done && Date.now() < deadline) {
    await delay(env.geminiFileSearchPollMs);
    const opRef = typeof op === "string" ? op : op.name ?? op;
    op = await ai!.operations.get({ operation: opRef });
  }
  if (!op.done) {
    throw new Error("Gemini File Search import timed out.");
  }
}

export async function ensureCourseFileSearchStore(
  courseId: string
): Promise<{ name: string; created: boolean } | null> {
  const { data: course, error } = await supabase
    .from("courses")
    .select("id, title, file_search_store_name")
    .eq("id", courseId)
    .single();

  if (error || !course) {
    return null;
  }

  if (course.file_search_store_name) {
    return { name: course.file_search_store_name, created: false };
  }

  if (!ai || !env.geminiFileSearchEnabled) {
    return null;
  }

  const displayName = `${env.geminiFileSearchStorePrefix}${course.title || course.id}`.slice(0, 60);
  const store = await ai.fileSearchStores.create({
    config: { displayName }
  });

  await supabase
    .from("courses")
    .update({ file_search_store_name: store.name })
    .eq("id", courseId);

  return { name: store.name, created: true };
}

export async function uploadFileToFileSearchStore(params: UploadParams): Promise<void> {
  if (!ai || !env.geminiFileSearchEnabled) return;
  const storeInfo = await ensureCourseFileSearchStore(params.courseId);
  if (!storeInfo) return;

  const tempPath = await writeTempFile(params.buffer, params.fileName);
  try {
    const operation = await ai.fileSearchStores.uploadToFileSearchStore({
      file: tempPath,
      fileSearchStoreName: storeInfo.name,
      config: { displayName: params.fileName }
    });
    await waitForOperation(operation);
  } finally {
    await cleanupTempFile(tempPath);
  }
}

export async function fetchFileSearchContext(courseId: string, query: string): Promise<string> {
  if (!ai || !env.geminiFileSearchEnabled) return "";
  const storeInfo = await ensureCourseFileSearchStore(courseId);
  if (!storeInfo) return "";

  const prompt = [
    "You are a retrieval assistant for grading.",
    "Use file search to find the most relevant excerpts.",
    "Return only the relevant excerpts (no commentary), in plain text.",
    "Limit to ~1200 characters total.",
    "",
    `Query: ${query}`
  ].join("\n");

  const response = await ai.models.generateContent({
    model: env.geminiFileSearchModel,
    contents: prompt,
    config: {
      tools: [
        {
          fileSearch: {
            fileSearchStoreNames: [storeInfo.name]
          }
        }
      ]
    }
  });

  const rawText = (response as { text?: unknown }).text;
  const responseText = typeof rawText === "function" ? rawText() : rawText;
  return typeof responseText === "string" ? responseText.trim() : "";
}

export async function uploadFileForModel(params: {
  fileName: string;
  mimeType: string;
  buffer: Buffer;
}) {
  if (!ai) return null;
  const tempPath = await writeTempFile(params.buffer, params.fileName);
  try {
    return await ai.files.upload({
      file: tempPath,
      config: { mimeType: params.mimeType }
    });
  } finally {
    await cleanupTempFile(tempPath);
  }
}

export function createFilePrompt(fileUri: string, mimeType: string, instruction: string) {
  return createUserContent([
    instruction,
    createPartFromUri(fileUri, mimeType)
  ]);
}

export function getGeminiFileSearchClient() {
  return ai;
}
