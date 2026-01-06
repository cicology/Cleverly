import { Router } from "express";
import { z } from "zod";
import { requireAuth, AuthedRequest } from "../middleware/auth.js";
import { validateBody } from "../middleware/validateRequest.js";
import { supabase } from "../config/supabase.js";
import { storeFile } from "../services/storageService.js";
import { embeddingQueue } from "../workers/embeddingWorker.js";
import { createMemoryUpload } from "../config/uploads.js";

const upload = createMemoryUpload({ maxFiles: 9 });

const router = Router();

const courseSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  topics: z
    .preprocess((val) => {
      if (typeof val === "string") {
        try {
          return JSON.parse(val);
        } catch {
          return [];
        }
      }
      return val;
    }, z.array(z.string()).optional())
});

router.get("/", requireAuth, async (req: AuthedRequest, res) => {
  const { data, error } = await supabase.from("courses").select("*").eq("user_id", req.user!.id);
  if (error) return res.status(500).json({ error: error.message });
  return res.json({ courses: data ?? [] });
});

router.post(
  "/",
  requireAuth,
  upload.fields([
    { name: "study_guide", maxCount: 3 },
    { name: "textbook", maxCount: 3 },
    { name: "extra_content", maxCount: 3 }
  ]),
  validateBody(courseSchema),
  async (req: AuthedRequest, res) => {
    const { title, description, topics } = req.body as z.infer<typeof courseSchema>;

    const { data, error } = await supabase
      .from("courses")
      .insert({
        title,
        description,
        topics,
        user_id: req.user!.id
      })
      .select()
      .single();

    if (error || !data) return res.status(500).json({ error: error?.message ?? "Failed to create course" });

    const files = req.files as Record<string, Express.Multer.File[]>;
    const uploads = Object.entries(files ?? {}).flatMap(([fileType, fileArr]) =>
      fileArr.map(async (file) => {
        const stored = await storeFile(file, `${data.id}-${fileType}`);
        const { data: fileRow, error: fileError } = await supabase
          .from("course_files")
          .insert({
            course_id: data.id,
            file_name: file.originalname,
            file_type: fileType,
            file_path: stored.storagePath,
            file_size: file.size,
            status: "processing"
          })
          .select()
          .single();

        if (!fileError && fileRow && embeddingQueue) {
          await embeddingQueue.add("embed", {
            course_file_id: fileRow.id,
            course_id: data.id,
            file_path: stored.storagePath,
            file_name: file.originalname,
            mime_type: file.mimetype
          });
        }
      })
    );

    await Promise.all(uploads);
    return res.status(201).json({ course: data });
  }
);

router.get("/:id/files", requireAuth, async (req: AuthedRequest, res) => {
  // First verify the course belongs to the user
  const { data: course, error: courseError } = await supabase
    .from("courses")
    .select("id")
    .eq("id", req.params.id)
    .eq("user_id", req.user!.id)
    .single();

  if (courseError || !course) {
    return res.status(404).json({ error: "Course not found" });
  }

  const { data, error } = await supabase
    .from("course_files")
    .select("*")
    .eq("course_id", req.params.id)
    .order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  return res.json({ files: data ?? [] });
});

export default router;
