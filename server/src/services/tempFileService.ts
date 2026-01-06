import fs from "fs";
import os from "os";
import path from "path";
import { randomUUID } from "crypto";

export async function writeTempFile(buffer: Buffer, filename: string): Promise<string> {
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const tempPath = path.join(os.tmpdir(), `${Date.now()}-${randomUUID()}-${safeName}`);
  await fs.promises.writeFile(tempPath, buffer);
  return tempPath;
}

export async function cleanupTempFile(filePath: string): Promise<void> {
  try {
    await fs.promises.unlink(filePath);
  } catch {
    // Best effort cleanup.
  }
}
