import { Server, Socket } from "socket.io";
import { Server as HTTPServer } from "http";
import { supabase } from "../config/supabase.js";
import { env } from "../config/env.js";

let io: Server | null = null;

export function initializeSocketIO(httpServer: HTTPServer) {
  io = new Server(httpServer, {
    cors: {
      origin: env.corsAllowedOrigins.length > 0 ? env.corsAllowedOrigins : env.clientUrl,
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  // Authentication middleware
  io.use(async (socket: Socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        console.log(`[Socket.IO] Connection rejected: No token provided`);
        return next(new Error("Authentication error: No token provided"));
      }

      // Verify JWT token with Supabase
      const { data: { user }, error } = await supabase.auth.getUser(token);

      if (error || !user) {
        console.log(`[Socket.IO] Connection rejected: Invalid token`);
        return next(new Error("Authentication error: Invalid token"));
      }

      // Attach user info to socket
      socket.data.userId = user.id;
      socket.data.userEmail = user.email;

      console.log(`[Socket.IO] User authenticated: ${user.email} (${user.id})`);
      next();
    } catch (error) {
      console.error(`[Socket.IO] Authentication error:`, error);
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket: Socket) => {
    const userId = socket.data.userId;
    console.log(`[Socket.IO] Client connected: ${socket.id} (User: ${userId})`);

    // Join user-specific room
    socket.join(`user:${userId}`);
    console.log(`[Socket.IO] User ${userId} joined room: user:${userId}`);

    socket.on("disconnect", () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id} (User: ${userId})`);
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

/**
 * Emit embedding complete event to the course owner's room
 * @param courseId - The course ID
 * @param status - The status of the embedding process
 */
export async function emitEmbeddingComplete(courseId: string, status: string) {
  if (!io) return;

  try {
    // Fetch course to get owner
    const { data: course, error } = await supabase
      .from("courses")
      .select("user_id")
      .eq("id", courseId)
      .single();

    if (error || !course) {
      console.error(`[Socket.IO] Failed to fetch course ${courseId}:`, error);
      return;
    }

    // Emit to user's room only
    io.to(`user:${course.user_id}`).emit("embedding:complete", {
      course_id: courseId,
      status
    });
    console.log(`[Socket.IO] Emitted embedding:complete for course ${courseId} to user ${course.user_id}`);
  } catch (error) {
    console.error(`[Socket.IO] Error emitting embedding:complete:`, error);
  }
}

/**
 * Emit grading complete event to the grader owner's room
 * @param graderId - The grader ID
 * @param submissionId - The submission ID
 * @param status - The status of the grading process
 */
export async function emitGradingComplete(graderId: string, submissionId: string, status: string) {
  if (!io) return;

  try {
    // Fetch grader to get owner
    const { data: grader, error } = await supabase
      .from("graders")
      .select("id, course_id, courses!inner(user_id)")
      .eq("id", graderId)
      .single();

    if (error || !grader || !(grader as any).courses?.user_id) {
      console.error(`[Socket.IO] Failed to fetch grader ${graderId}:`, error);
      return;
    }

    // Emit to user's room only
    const ownerId = (grader as any).courses.user_id as string;
    io.to(`user:${ownerId}`).emit("grading:complete", {
      grader_id: graderId,
      submission_id: submissionId,
      status
    });
    console.log(`[Socket.IO] Emitted grading:complete for submission ${submissionId} to user ${ownerId}`);
  } catch (error) {
    console.error(`[Socket.IO] Error emitting grading:complete:`, error);
  }
}

/**
 * Emit grading progress event to the grader owner's room
 * @param graderId - The grader ID
 * @param submissionId - The submission ID
 * @param percentage - The progress percentage
 */
export async function emitGradingProgress(graderId: string, percentage: number, submissionId: string) {
  if (!io) return;

  try {
    // Fetch grader to get owner
    const { data: grader, error } = await supabase
      .from("graders")
      .select("id, course_id, courses!inner(user_id)")
      .eq("id", graderId)
      .single();

    if (error || !grader || !(grader as any).courses?.user_id) {
      console.error(`[Socket.IO] Failed to fetch grader ${graderId}:`, error);
      return;
    }

    // Emit to user's room only
    const ownerId = (grader as any).courses.user_id as string;
    io.to(`user:${ownerId}`).emit("grading:progress", {
      percentage,
      submission_id: submissionId
    });
    console.log(`[Socket.IO] Emitted grading:progress ${percentage}% for submission ${submissionId} to user ${ownerId}`);
  } catch (error) {
    console.error(`[Socket.IO] Error emitting grading:progress:`, error);
  }
}
