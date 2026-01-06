import { Queue, Worker, Job } from "bullmq";
import { env } from "../config/env.js";
import { gradeAnswer } from "../services/gradingService.js";
import { supabase } from "../config/supabase.js";
import { RubricItem } from "../types/index.js";
import { emitGradingComplete, emitGradingProgress } from "../services/socketService.js";

type GradingJob = {
  grader_id: string;
  submission_id: string;
  course_id: string;
  rubric: RubricItem[];
  student_answers: Record<string, string>;
  raw_text?: string;
};

const defaultJobOptions = {
  attempts: 3,
  backoff: { type: "exponential", delay: 5000 },
  removeOnComplete: { count: 1000 },
  removeOnFail: { count: 1000 }
};

export const gradingQueue = new Queue<GradingJob>("grading", {
  connection: { url: env.redisUrl },
  defaultJobOptions
});

export const gradingDLQ = new Queue<GradingJob & { error?: string }>("grading-dlq", {
  connection: { url: env.redisUrl }
});

async function handleGrade(job: Job<GradingJob>): Promise<void> {
  try {
    const { rubric, student_answers } = job.data;
    let totalScore = 0;
    let maxScore = 0;

    await supabase.from("submission_grades").delete().eq("submission_id", job.data.submission_id);

    if (rubric.length === 0) {
      throw new Error("No rubric items available for grading.");
    }

    // Process each rubric item
    for (let idx = 0; idx < rubric.length; idx++) {
      const item = rubric[idx];
      const answer = student_answers[item.question_number] ?? job.data.raw_text ?? "";
      const result = await gradeAnswer(job.data.course_id, item, answer);
      totalScore += result.marks_awarded;
      maxScore += item.max_marks;

      await supabase.from("submission_grades").insert({
        submission_id: job.data.submission_id,
        rubric_id: item.id,
        marks_awarded: result.marks_awarded,
        ai_reasoning: result.ai_reasoning,
        confidence_score: result.confidence_score
      });

      // Emit progress update
      const progressPercentage = Math.round(((idx + 1) / rubric.length) * 100);
      emitGradingProgress(job.data.grader_id, progressPercentage, job.data.submission_id);
    }

    const percentage = maxScore ? (totalScore / maxScore) * 100 : 0;
    await supabase
      .from("submissions")
      .update({
        total_score: totalScore,
        max_possible_score: maxScore,
        percentage,
        status: "graded",
        processed_at: new Date().toISOString()
      })
      .eq("id", job.data.submission_id);

    // Emit completion event
    emitGradingComplete(job.data.grader_id, job.data.submission_id, "completed");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[gradingWorker] Grading failed:", message);
    await supabase
      .from("submissions")
      .update({
        status: "flagged",
        feedback_summary: `Grading failed: ${message}`,
        processed_at: new Date().toISOString()
      })
      .eq("id", job.data.submission_id);
    emitGradingComplete(job.data.grader_id, job.data.submission_id, "failed");
    throw error;
  }
}

export const gradingWorker =
  env.redisUrl &&
  new Worker<GradingJob>("grading", handleGrade, {
    connection: { url: env.redisUrl }
  });

if (gradingWorker) {
  gradingWorker.on("failed", async (job, err) => {
    if (!job) return;
    await gradingDLQ.add("grade-failed", {
      ...job.data,
      error: err?.message ?? "Unknown error"
    });
  });
}
