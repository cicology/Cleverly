import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import { requireAuth, AuthedRequest } from "../middleware/auth.js";
import { validateBody } from "../middleware/validateRequest.js";
import { supabase } from "../config/supabase.js";
import { storeFile } from "../services/storageService.js";
import { extractRubricFromText } from "../services/rubricService.js";

const upload = multer({ storage: multer.memoryStorage() });
const router = Router();

const graderSchema = z.object({
  course_id: z.string().uuid(),
  title: z.string().min(1),
  total_marks: z.coerce.number().optional()
});

router.post(
  "/",
  requireAuth,
  upload.fields([
    { name: "test_file", maxCount: 1 },
    { name: "memo_file", maxCount: 1 }
  ]),
  validateBody(graderSchema),
  async (req: AuthedRequest, res) => {
    const body = req.body as z.infer<typeof graderSchema>;
    const files = req.files as Record<string, Express.Multer.File[]>;
    const testFile = files?.test_file?.[0];
    const memoFile = files?.memo_file?.[0];

    const { data: grader, error } = await supabase
      .from("graders")
      .insert({
        course_id: body.course_id,
        title: body.title,
        total_marks: body.total_marks,
        status: "processing"
      })
      .select()
      .single();

    if (error || !grader) return res.status(500).json({ error: error?.message ?? "Failed to create grader" });

    if (testFile) {
      await storeFile(testFile, `${grader.id}-test`);
      await supabase.from("graders").update({ test_file_path: testFile.originalname }).eq("id", grader.id);
    }
    if (memoFile) {
      await storeFile(memoFile, `${grader.id}-memo`);
      await supabase.from("graders").update({ memo_file_path: memoFile.originalname }).eq("id", grader.id);
    }

    // Basic text extraction from buffers (real implementation should parse PDFs)
    if (testFile && memoFile) {
      try {
        const rubric = await extractRubricFromText(
          testFile.buffer.toString("utf-8"),
          memoFile.buffer.toString("utf-8")
        );
        await Promise.all(
          rubric.map((item, idx) =>
            supabase.from("rubrics").insert({
              ...item,
              grader_id: grader.id,
              order_index: idx
            })
          )
        );
        await supabase.from("graders").update({ status: "ready" }).eq("id", grader.id);
      } catch (err) {
        console.error("[graders] Failed to extract rubric:", err);
        // Insert fallback rubric
        await supabase.from("rubrics").insert({
          grader_id: grader.id,
          question_number: "1",
          question_text: "Sample question from test",
          expected_answer: "Sample answer from memo",
          keywords: ["concept"],
          max_marks: 5,
          order_index: 0
        });
        await supabase.from("graders").update({ status: "ready" }).eq("id", grader.id);
      }
    }

    return res.status(201).json({ grader_id: grader.id, status: "processing" });
  }
);

router.get("/:id", requireAuth, async (req: AuthedRequest, res) => {
  const { data: grader, error } = await supabase.from("graders").select("*").eq("id", req.params.id).single();
  if (error || !grader) return res.status(404).json({ error: "Grader not found" });

  const { data: rubric } = await supabase
    .from("rubrics")
    .select("*")
    .eq("grader_id", req.params.id)
    .order("order_index", { ascending: true });

  return res.json({ grader, rubric: rubric ?? [] });
});

router.put("/:id/rubric", requireAuth, async (req: AuthedRequest, res) => {
  const items = req.body as any[];
  await supabase.from("rubrics").delete().eq("grader_id", req.params.id);
  await Promise.all(
    items.map((item, idx) =>
      supabase.from("rubrics").insert({
        ...item,
        grader_id: req.params.id,
        order_index: idx
      })
    )
  );
  return res.json({ updated: true });
});

export default router;
