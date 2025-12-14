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

export const gradingQueue = new Queue<GradingJob>("grading", { connection: { url: env.redisUrl } });

async function handleGrade(job: Job<GradingJob>): Promise<void> {
  const { rubric, student_answers } = job.data;
  let totalScore = 0;
  let maxScore = 0;

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
    emitGradingProgress(progressPercentage, job.data.submission_id);
  }

  const percentage = maxScore ? (totalScore / maxScore) * 100 : 0;
  await supabase
    .from("submissions")
    .update({ total_score: totalScore, max_possible_score: maxScore, percentage, status: "graded" })
    .eq("id", job.data.submission_id);

  // Emit completion event
  emitGradingComplete(job.data.grader_id, job.data.submission_id, "completed");
}

export const gradingWorker =
  env.redisUrl &&
  new Worker<GradingJob>("grading", handleGrade, {
    connection: { url: env.redisUrl }
  });
