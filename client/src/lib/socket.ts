import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function initializeSocket() {
  const serverUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || "http://localhost:4000";

  socket = io(serverUrl, {
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5
  });

  socket.on("connect", () => {
    console.log("[Socket.IO] Connected to server");
  });

  socket.on("disconnect", () => {
    console.log("[Socket.IO] Disconnected from server");
  });

  socket.on("connect_error", (error) => {
    console.error("[Socket.IO] Connection error:", error);
  });

  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnect() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
