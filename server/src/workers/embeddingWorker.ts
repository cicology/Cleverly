import { Queue, Worker, Job } from "bullmq";
import { env } from "../config/env.js";
import { generateEmbeddings } from "../services/embeddingService.js";
import { supabase } from "../config/supabase.js";
import { fetchFileBuffer } from "../services/storageService.js";
import { extractTextFromBuffer, extractTextFromFile } from "../services/pdfService.js";
import { emitEmbeddingComplete } from "../services/socketService.js";

export const embeddingQueue = new Queue("embedding", { connection: { url: env.redisUrl } });

type EmbeddingJob = { course_file_id: string; file_path?: string; file_name?: string; mime_type?: string; course_id?: string };

async function handleEmbedding(job: Job<EmbeddingJob>): Promise<void> {
  let textContent = "";

  if (job.data.file_path) {
    const buf = await fetchFileBuffer(job.data.file_path);
    if (buf) {
      textContent = await extractTextFromBuffer(buf, job.data.file_name);
    } else {
      textContent = extractTextFromFile(job.data.file_path);
    }
  }

  if (!textContent.trim()) {
    console.warn("[embeddingWorker] No text content extracted; marking as failed");
    await supabase.from("course_files").update({ status: "failed" }).eq("id", job.data.course_file_id);
    if (job.data.course_id) {
      emitEmbeddingComplete(job.data.course_id, "failed");
    }
    return;
  }

  const vectors = await generateEmbeddings(textContent);
  await Promise.all(
    vectors.map(async (vector, idx) => {
      await supabase.from("course_embeddings").insert({
        course_file_id: job.data.course_file_id,
        content_chunk: `Chunk ${idx + 1}`,
        embedding: vector,
        metadata: { idx }
      });
    })
  );

  await supabase.from("course_files").update({ status: "embedded" }).eq("id", job.data.course_file_id);

  // Emit Socket.IO event
  if (job.data.course_id) {
    emitEmbeddingComplete(job.data.course_id, "completed");
  }
}

export const embeddingWorker =
  env.redisUrl &&
  new Worker<EmbeddingJob>("embedding", handleEmbedding, {
    connection: { url: env.redisUrl }
  });
