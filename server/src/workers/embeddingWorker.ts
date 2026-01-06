import { Queue, Worker, Job } from "bullmq";
import { env } from "../config/env.js";
import { generateEmbeddings } from "../services/embeddingService.js";
import { supabase } from "../config/supabase.js";
import { fetchFileBuffer } from "../services/storageService.js";
import { extractTextFromBuffer, extractTextFromFile } from "../services/pdfService.js";
import { emitEmbeddingComplete } from "../services/socketService.js";
import { uploadFileToFileSearchStore } from "../services/geminiFileSearchService.js";

const defaultJobOptions = {
  attempts: 3,
  backoff: { type: "exponential", delay: 5000 },
  removeOnComplete: { count: 1000 },
  removeOnFail: { count: 1000 }
};

export const embeddingQueue = new Queue("embedding", {
  connection: { url: env.redisUrl },
  defaultJobOptions
});

export const embeddingDLQ = new Queue<EmbeddingJob & { error?: string }>("embedding-dlq", {
  connection: { url: env.redisUrl }
});

type EmbeddingJob = { course_file_id: string; file_path?: string; file_name?: string; mime_type?: string; course_id?: string };

async function handleEmbedding(job: Job<EmbeddingJob>): Promise<void> {
  try {
    let textContent = "";
    let fileBuffer: Buffer | null = null;
    let fileSearchUploaded = false;

    if (job.data.file_path) {
      fileBuffer = await fetchFileBuffer(job.data.file_path);
      if (fileBuffer && job.data.course_id) {
        try {
          await uploadFileToFileSearchStore({
            courseId: job.data.course_id,
            fileName: job.data.file_name ?? "course-file",
            mimeType: job.data.mime_type ?? "application/pdf",
            buffer: fileBuffer
          });
          fileSearchUploaded = true;
        } catch (error) {
          console.warn("[embeddingWorker] File search upload failed:", error);
        }
      }

      if (fileBuffer) {
        textContent = await extractTextFromBuffer(fileBuffer, job.data.file_name);
      } else {
        textContent = extractTextFromFile(job.data.file_path);
      }
    }

    if (!textContent.trim()) {
      if (fileSearchUploaded) {
        console.warn("[embeddingWorker] No text extracted; file search upload succeeded.");
        await supabase.from("course_files").update({ status: "embedded" }).eq("id", job.data.course_file_id);
        if (job.data.course_id) {
          emitEmbeddingComplete(job.data.course_id, "completed");
        }
        return;
      } else {
        console.warn("[embeddingWorker] No text content extracted; marking as failed");
        await supabase.from("course_files").update({ status: "failed" }).eq("id", job.data.course_file_id);
        if (job.data.course_id) {
          emitEmbeddingComplete(job.data.course_id, "failed");
        }
        return;
      }
    }

    const embeddings = await generateEmbeddings(textContent);
    await Promise.all(
      embeddings.map(async ({ chunk, embedding }, idx) => {
        await supabase.from("course_embeddings").insert({
          course_file_id: job.data.course_file_id,
          content_chunk: chunk,
          embedding: embedding,
          metadata: { idx }
        });
      })
    );

    await supabase.from("course_files").update({ status: "embedded" }).eq("id", job.data.course_file_id);

    // Emit Socket.IO event
    if (job.data.course_id) {
      emitEmbeddingComplete(job.data.course_id, "completed");
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[embeddingWorker] Embedding failed:", message);
    await supabase.from("course_files").update({ status: "failed" }).eq("id", job.data.course_file_id);
    if (job.data.course_id) {
      emitEmbeddingComplete(job.data.course_id, "failed");
    }
    throw error;
  }
}

export const embeddingWorker =
  env.redisUrl &&
  new Worker<EmbeddingJob>("embedding", handleEmbedding, {
    connection: { url: env.redisUrl }
  });

if (embeddingWorker) {
  embeddingWorker.on("failed", async (job, err) => {
    if (!job) return;
    await embeddingDLQ.add("embed-failed", {
      ...job.data,
      error: err?.message ?? "Unknown error"
    });
  });
}
