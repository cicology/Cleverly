import { Request, Response, NextFunction } from "express";
import pino from "pino";
import multer from "multer";

const logger = pino({ transport: { target: "pino-pretty" } });

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  logger.error(err);
  if (err instanceof multer.MulterError) {
    res.status(400).json({ error: "Upload error", message: err.message, code: err.code });
    return;
  }

  if (err.message?.includes("Invalid file type")) {
    res.status(400).json({ error: "Upload error", message: err.message });
    return;
  }

  res.status(500).json({ error: "Internal server error", message: err.message });
}
