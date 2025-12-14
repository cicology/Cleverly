import express from "express";
import cors from "cors";
import pino from "pino";
import { createServer } from "http";
import { env, validateEnv } from "./config/env.js";
import coursesRouter from "./routes/courses.js";
import gradersRouter from "./routes/graders.js";
import submissionsRouter from "./routes/submissions.js";
import analyticsRouter from "./routes/analytics.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { initializeSocketIO } from "./services/socketService.js";
import "./workers/embeddingWorker.js";
import "./workers/gradingWorker.js";

validateEnv();
const app = express();
const httpServer = createServer(app);
const logger = pino({ transport: { target: "pino-pretty" } });

// Initialize Socket.IO
initializeSocketIO(httpServer);

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.use("/api/courses", coursesRouter);
app.use("/api/graders", gradersRouter);
app.use("/api", submissionsRouter);
app.use("/api", analyticsRouter);
app.use(errorHandler);

httpServer.listen(env.port, () => {
  logger.info(`Server listening on http://localhost:${env.port}`);
});
