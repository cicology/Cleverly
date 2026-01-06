import { Router } from "express";
import { z } from "zod";
import { env } from "../config/env.js";
import { supabase } from "../config/supabase.js";
import { fetchFileBuffer } from "../services/storageService.js";
import { ensureCourseFileSearchStore, uploadFileToFileSearchStore } from "../services/geminiFileSearchService.js";

const router = Router();

const precreateSchema = z.object({
  course_id: z.string().uuid().optional(),
  upload_files: z.boolean().optional(),
  force_reupload: z.boolean().optional(),
  limit: z.coerce.number().int().positive().max(500).optional()
});

function requireAdminKey(req: any, res: any, next: any) {
  if (!env.adminApiKey) {
    return res.status(500).json({ error: "Admin API key not configured" });
  }

  const authHeader = req.headers.authorization ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;
  if (token !== env.adminApiKey) {
    return res.status(403).json({ error: "Forbidden" });
  }

  return next();
}

function guessMimeType(fileName: string): string {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".doc")) return "application/msword";
  if (lower.endsWith(".docx")) return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  if (lower.endsWith(".txt")) return "text/plain";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  return "application/pdf";
}

router.post("/file-search/precreate", requireAdminKey, async (req, res) => {
  const parsed = precreateSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const { course_id, upload_files, force_reupload, limit } = parsed.data;
  const shouldUpload = upload_files ?? true;

  const coursesQuery = supabase.from("courses").select("id, title, file_search_store_name");
  if (course_id) {
    coursesQuery.eq("id", course_id);
  } else if (limit) {
    coursesQuery.limit(limit);
  }

  const { data: courses, error: courseError } = await coursesQuery;
  if (courseError) {
    return res.status(500).json({ error: courseError.message });
  }

  const results: Array<{ course_id: string; store_created: boolean; files_uploaded: number; skipped: number }> = [];

  for (const course of courses ?? []) {
    const storeInfo = await ensureCourseFileSearchStore(course.id);
    if (!storeInfo) {
      results.push({ course_id: course.id, store_created: false, files_uploaded: 0, skipped: 0 });
      continue;
    }

    let filesUploaded = 0;
    let skipped = 0;

    if (shouldUpload && (storeInfo.created || force_reupload)) {
      const { data: files, error: fileError } = await supabase
        .from("course_files")
        .select("file_path, file_name")
        .eq("course_id", course.id);

      if (fileError) {
        results.push({ course_id: course.id, store_created: storeInfo.created, files_uploaded: 0, skipped: 0 });
        continue;
      }

      for (const file of files ?? []) {
        const buffer = await fetchFileBuffer(file.file_path);
        if (!buffer) {
          skipped++;
          continue;
        }
        try {
          await uploadFileToFileSearchStore({
            courseId: course.id,
            fileName: file.file_name,
            mimeType: guessMimeType(file.file_name),
            buffer
          });
          filesUploaded++;
        } catch {
          skipped++;
        }
      }
    }

    results.push({
      course_id: course.id,
      store_created: storeInfo.created,
      files_uploaded: filesUploaded,
      skipped
    });
  }

  return res.json({ processed: results.length, results });
});

export default router;
