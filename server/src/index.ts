import express from "express";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import pino from "pino";
import { createServer } from "http";
import { env, validateEnv } from "./config/env.js";
import coursesRouter from "./routes/courses.js";
import gradersRouter from "./routes/graders.js";
import submissionsRouter from "./routes/submissions.js";
import analyticsRouter from "./routes/analytics.js";
import dashboardRouter from "./routes/dashboard.js";
import profileRouter from "./routes/profile.js";
import settingsRouter from "./routes/settings.js";
import exportRouter from "./routes/export.js";
import ltiRouter from "./routes/lti.js";
import adminRouter from "./routes/admin.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { initializeSocketIO } from "./services/socketService.js";
import { initializeLtiServer } from "./services/ltiService.js";
import "./workers/embeddingWorker.js";
import "./workers/gradingWorker.js";

validateEnv();
const app = express();
const httpServer = createServer(app);
const logger = pino({ transport: { target: "pino-pretty" } });

// Initialize Socket.IO
initializeSocketIO(httpServer);

// Security middleware
app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" } // Allow cross-origin requests for Socket.IO
}));

// CORS configuration with allowlist
const allowedOrigins = Array.from(
  new Set([
    env.clientUrl,
    "http://localhost:3000",
    "http://localhost:5173",
    ...env.corsAllowedOrigins
  ].filter(Boolean))
);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api", limiter);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.use("/api/courses", coursesRouter);
app.use("/api/graders", gradersRouter);
app.use("/api", submissionsRouter);
app.use("/api", analyticsRouter);
app.use("/api", dashboardRouter);
app.use("/api", profileRouter);
app.use("/api", settingsRouter);
app.use("/api", exportRouter);
app.use("/api/lti", ltiRouter);
app.use("/api/admin", adminRouter);
app.use(errorHandler);

initializeLtiServer().catch((error) => {
  logger.error({ error }, "Failed to start LTI server");
});

httpServer.listen(env.port, () => {
  logger.info(`Server listening on http://localhost:${env.port}`);
});
