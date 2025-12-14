import { Request, Response, NextFunction } from "express";
import pino from "pino";

const logger = pino({ transport: { target: "pino-pretty" } });

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  logger.error(err);
  res.status(500).json({ error: "Internal server error", message: err.message });
}
