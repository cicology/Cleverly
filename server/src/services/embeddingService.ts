import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../config/env.js";

const genAI = env.geminiApiKey ? new GoogleGenerativeAI(env.geminiApiKey) : null;

function chunkText(text: string, size = 800, overlap = 50): string[] {
  const words = text.split(/\s+/);
  const chunks: string[] = [];
  for (let i = 0; i < words.length; i += size - overlap) {
    const slice = words.slice(i, i + size).join(" ").trim();
    if (slice) chunks.push(slice);
  }
  return chunks.length ? chunks : [text];
}

export async function generateEmbeddings(content: string): Promise<{ chunk: string; embedding: number[] }[]> {
  if (!content.trim()) return [];
  const chunks = chunkText(content);

  if (!genAI) {
    // Offline fallback for local dev
    return chunks.map((chunk, idx) => ({
      chunk,
      embedding: Array.from({ length: 10 }, () => Math.sin(idx))
    }));
  }

  const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
  const embeddings: { chunk: string; embedding: number[] }[] = [];

  for (const chunk of chunks) {
    const result = await model.embedContent(chunk);
    embeddings.push({
      chunk,
      embedding: result.embedding.values
    });
  }

  return embeddings;
}

/**
 * Generate a single embedding for a query text (no chunking)
 */
export async function generateQueryEmbedding(query: string): Promise<number[]> {
  if (!query.trim()) return [];

  if (!genAI) {
    // Offline fallback for local dev
    return Array.from({ length: 768 }, () => Math.random());
  }

  const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
  const result = await model.embedContent(query);
  return result.embedding.values;
}
