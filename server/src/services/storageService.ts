import { supabase } from "../config/supabase.js";
import fs from "fs";
import path from "path";
import { env } from "../config/env.js";
import type { Express } from "express";

const localUploadDir = path.resolve(process.cwd(), "uploads");

function ensureDir(): void {
  if (!fs.existsSync(localUploadDir)) {
    fs.mkdirSync(localUploadDir, { recursive: true });
  }
}

export async function storeFile(
  file: Express.Multer.File,
  prefix: string
): Promise<{ storagePath: string; publicUrl?: string }> {
  ensureDir();
  const safeName = `${prefix}-${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`;
  const fullPath = path.join(localUploadDir, safeName);
  fs.writeFileSync(fullPath, file.buffer);

  if (env.supabaseUrl && env.supabaseServiceRoleKey && env.storageBucket) {
    const { data, error } = await supabase.storage
      .from(env.storageBucket)
      .upload(`uploads/${safeName}`, file.buffer, { contentType: file.mimetype, upsert: true });

    if (error) {
      console.warn("[storage] Supabase upload failed, falling back to local path", error.message);
    } else {
      const { data: urlData } = supabase.storage.from(env.storageBucket).getPublicUrl(data.path);
      return { storagePath: data.path, publicUrl: urlData.publicUrl };
    }
  }

  return { storagePath: fullPath };
}

export async function fetchFileBuffer(storagePath: string): Promise<Buffer | null> {
  // Try Supabase Storage first
  if (env.storageBucket) {
    const { data, error } = await supabase.storage.from(env.storageBucket).download(storagePath);
    if (!error && data) {
      const arrBuffer = await data.arrayBuffer();
      return Buffer.from(arrBuffer);
    }
  }

  // Fall back to local disk if present
  try {
    return fs.readFileSync(path.resolve(storagePath));
  } catch {
    console.warn("[storage] Unable to read file from storagePath", storagePath);
    return null;
  }
}
