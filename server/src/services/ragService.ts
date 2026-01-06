import { supabase } from "../config/supabase.js";
import { env } from "../config/env.js";
import { generateQueryEmbedding } from "./embeddingService.js";
import { fetchFileSearchContext } from "./geminiFileSearchService.js";

async function fetchVectorContext(courseId: string, query: string): Promise<string> {
  try {
    const queryEmbedding = await generateQueryEmbedding(query);

    if (!queryEmbedding || queryEmbedding.length === 0) {
      console.warn("[rag] Failed to generate query embedding, returning empty context");
      return "";
    }

    // Call the Supabase vector similarity search function
    const { data, error } = await supabase.rpc("match_course_embeddings", {
      query_embedding: queryEmbedding,
      course_id: courseId,
      match_count: 3
    });

    if (error) {
      console.warn("[rag] match_course_embeddings error:", error);
      return "";
    }

    if (!data || data.length === 0) {
      console.warn("[rag] No matching embeddings found for course", courseId);
      return "";
    }

    return data.map((row: { content_chunk: string }) => row.content_chunk).join("\n\n");
  } catch (error) {
    console.error("[rag] Error fetching RAG context:", error);
    return "";
  }
}

export async function fetchRagContext(courseId: string, query: string): Promise<string> {
  if (!query.trim()) return "";

  const contextChunks: string[] = [];

  const tasks: Promise<string>[] = [
    env.geminiFileSearchEnabled ? fetchFileSearchContext(courseId, query) : Promise.resolve(""),
    fetchVectorContext(courseId, query)
  ];

  const [fileSearchResult, vectorResult] = await Promise.allSettled(tasks);
  const fileSearchContext = fileSearchResult.status === "fulfilled" ? fileSearchResult.value : "";
  const vectorContext = vectorResult.status === "fulfilled" ? vectorResult.value : "";

  if (fileSearchContext) {
    contextChunks.push(fileSearchContext.slice(0, 1200));
  }

  if (vectorContext) {
    contextChunks.push(vectorContext.slice(0, 1200));
  }

  return contextChunks.filter(Boolean).join("\n\n---\n\n");
}
