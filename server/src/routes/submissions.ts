import { Router } from "express";
import { requireAuth, AuthedRequest } from "../middleware/auth.js";
import { supabase } from "../config/supabase.js";
import { storeFile, fetchFileBuffer } from "../services/storageService.js";
import { gradingQueue } from "../workers/gradingWorker.js";
import { extractAnswersFromPdf } from "../services/ocrService.js";
import { extractTextFromBuffer } from "../services/pdfService.js";
import { env } from "../config/env.js";
import { createMemoryUpload } from "../config/uploads.js";
import { getGraderForUser, getSubmissionForUser, getSubmissionGradeForUser } from "../services/ownershipService.js";

const upload = createMemoryUpload({ maxFiles: 20 });
const router = Router();

router.get("/graders/:id/submissions", requireAuth, async (req: AuthedRequest, res) => {
  const grader = await getGraderForUser(req.params.id, req.user!.id);
  if (!grader) return res.status(404).json({ error: "Grader not found" });
  const { data, error } = await supabase
    .from("submissions")
    .select("*")
    .eq("grader_id", req.params.id)
    .order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  return res.json({ submissions: data ?? [] });
});

router.post(
  "/graders/:id/submissions",
  requireAuth,
  upload.array("files", env.maxUploadFiles),
  async (req: AuthedRequest, res) => {
    try {
      const files = (req.files as Express.Multer.File[]) ?? [];
      if (!files.length) return res.status(400).json({ error: "No files provided" });

      // Verify grader exists
      const grader = await getGraderForUser(req.params.id, req.user!.id);
      if (!grader) {
        return res.status(404).json({ error: "Grader not found" });
      }

      const created = await Promise.all(
        files.map(async (file) => {
          const stored = await storeFile(file, `${req.params.id}-submission`);
          const { data, error } = await supabase
            .from("submissions")
            .insert({
              grader_id: req.params.id,
              student_identifier: req.body.student_identifier ?? file.originalname,
              file_path: stored.storagePath,
              status: "pending"
            })
            .select()
            .single();
          if (error) throw new Error(error.message);
          return data;
        })
      );

      return res.status(201).json({ submissions: created });
    } catch (err) {
      console.error("[submissions] Upload error:", err);
      return res.status(500).json({ error: err instanceof Error ? err.message : "Failed to upload submissions" });
    }
  }
);

router.post("/graders/:id/grade-all", requireAuth, async (req: AuthedRequest, res) => {
  const graderId = req.params.id;
  const grader = await getGraderForUser(graderId, req.user!.id);
  if (!grader) return res.status(404).json({ error: "Grader not found" });
  const { data: rubric } = await supabase.from("rubrics").select("*").eq("grader_id", graderId);
  const { data: submissions } = await supabase.from("submissions").select("*").eq("grader_id", graderId);

  if (!rubric || !submissions) return res.status(404).json({ error: "Missing rubric or submissions" });
  if (!gradingQueue) return res.status(500).json({ error: "Queue not configured" });

  await Promise.all(
    submissions.map(async (submission) => {
      let rawText: string | undefined = undefined;
      let extractedAnswers: Record<string, string> = {};
      const fileBuffer = await fetchFileBuffer(submission.file_path);
      if (fileBuffer) {
        const ocrResult = await extractAnswersFromPdf(fileBuffer);
        rawText = ocrResult.rawText || (await extractTextFromBuffer(fileBuffer, submission.file_path));
        extractedAnswers = ocrResult.answers;
      }

      await gradingQueue.add("grade", {
        grader_id: graderId,
        submission_id: submission.id,
        course_id: grader.course_id,
        rubric,
        student_answers: extractedAnswers,
        raw_text: rawText
      });
    })
  );

  await supabase.from("graders").update({ status: "grading" }).eq("id", graderId);
  return res.json({ queued: submissions.length });
});

router.get("/submissions/:id", requireAuth, async (req: AuthedRequest, res) => {
  const submission = await getSubmissionForUser(req.params.id, req.user!.id);
  if (!submission) return res.status(404).json({ error: "Not found" });
  const { data: grades } = await supabase
    .from("submission_grades")
    .select("*")
    .eq("submission_id", submission.id);
  return res.json({ submission, grades: grades ?? [] });
});

router.patch("/submission-grades/:id", requireAuth, async (req: AuthedRequest, res) => {
  const grade = await getSubmissionGradeForUser(req.params.id, req.user!.id);
  if (!grade) return res.status(404).json({ error: "Not found" });
  const { marks_awarded, override_reason } = req.body;
  const { error } = await supabase
    .from("submission_grades")
    .update({ marks_awarded, is_overridden: true, override_reason })
    .eq("id", req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  return res.json({ updated: true });
});

export default router;
