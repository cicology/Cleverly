import { Request, Response, NextFunction } from "express";
import { AuthUser } from "../types/index.js";
import { supabase } from "../config/supabase.js";

export interface AuthedRequest extends Request {
  user?: AuthUser;
}

// Development mode: Allow bypassing auth for testing
const isDev = process.env.NODE_ENV !== "production";
const DEV_USER_ID = "0b949b80-e57e-461c-be80-f3f3297818be";

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction): void {
  const bearer = req.headers.authorization;

  // In development mode, allow requests without auth for testing
  if (isDev && !bearer) {
    req.user = { id: DEV_USER_ID, email: "dev@test.local" };
    next();
    return;
  }

  if (!bearer) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const token = bearer.replace("Bearer ", "").trim();
  if (!token) {
    res.status(401).json({ error: "Invalid token" });
    return;
  }

  // In development mode with token "dev-token", bypass Supabase validation
  if (isDev && token === "dev-token") {
    req.user = { id: DEV_USER_ID, email: "dev@test.local" };
    next();
    return;
  }

  supabase.auth
    .getUser(token)
    .then(({ data, error }) => {
      if (error || !data?.user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
      req.user = { id: data.user.id, email: data.user.email ?? undefined };
      next();
    })
    .catch(() => res.status(401).json({ error: "Unauthorized" }));
}
