import { Server, Socket } from "socket.io";
import { Server as HTTPServer } from "http";

let io: Server | null = null;

export function initializeSocketIO(httpServer: HTTPServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  io.on("connection", (socket: Socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    socket.on("disconnect", () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function getSocketIO(): Server {
  if (!io) {
    throw new Error("Socket.IO has not been initialized. Call initializeSocketIO first.");
  }
  return io;
}

export function emitEmbeddingComplete(courseId: string, status: string) {
  if (io) {
    io.emit("embedding:complete", { course_id: courseId, status });
    console.log(`[Socket.IO] Emitted embedding:complete for course ${courseId}`);
  }
}

export function emitGradingComplete(graderId: string, submissionId: string, status: string) {
  if (io) {
    io.emit("grading:complete", { grader_id: graderId, submission_id: submissionId, status });
    console.log(`[Socket.IO] Emitted grading:complete for submission ${submissionId}`);
  }
}

export function emitGradingProgress(percentage: number, submissionId: string) {
  if (io) {
    io.emit("grading:progress", { percentage, submission_id: submissionId });
    console.log(`[Socket.IO] Emitted grading:progress ${percentage}% for submission ${submissionId}`);
  }
}
