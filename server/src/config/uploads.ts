import multer from "multer";
import { env } from "./env.js";

const DEFAULT_ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
  "image/webp",
  "text/plain"
]);

type UploadOptions = {
  maxFiles?: number;
  allowedMimeTypes?: string[];
};

export function createMemoryUpload(options: UploadOptions = {}): multer.Multer {
  const maxFileSize = env.maxUploadMb * 1024 * 1024;
  const maxFiles = options.maxFiles ?? env.maxUploadFiles;
  const allowed = options.allowedMimeTypes
    ? new Set(options.allowedMimeTypes)
    : DEFAULT_ALLOWED_MIME_TYPES;

  return multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: maxFileSize,
      files: maxFiles
    },
    fileFilter: (_req, file, cb) => {
      if (!allowed.has(file.mimetype)) {
        return cb(new Error("Invalid file type"));
      }
      return cb(null, true);
    }
  });
}
