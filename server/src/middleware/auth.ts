import { Request, Response, NextFunction } from "express";
import { AuthUser } from "../types/index.js";
import { supabase } from "../config/supabase.js";
import { env } from "../config/env.js";

export interface AuthedRequest extends Request {
  user?: AuthUser;
}

// Development mode: Allow bypassing auth for testing
// SECURITY: This bypass is ONLY active when NODE_ENV !== 'production' AND explicitly enabled
const isDev = env.nodeEnv !== "production" && env.allowDevAuthBypass;
const DEV_USER_ID = "0b949b80-e57e-461c-be80-f3f3297818be";

if (env.nodeEnv !== "production" && env.allowDevAuthBypass) {
  console.warn("⚠️  WARNING: Development authentication bypass is ENABLED");
  console.warn("⚠️  This allows unauthenticated requests and 'dev-token' for testing");
  console.warn("⚠️  Set NODE_ENV=production or ALLOW_DEV_AUTH_BYPASS=false to disable this bypass");
}

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction): void {
  const bearer = req.headers.authorization;

  // SECURITY: Development mode bypass - ONLY works when NODE_ENV !== 'production'
  // In development mode, allow requests without auth for testing
  if (isDev && !bearer) {
    console.warn("⚠️  Using dev auth bypass (no bearer token)");
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

  // SECURITY: Development mode bypass - ONLY works when NODE_ENV !== 'production'
  // In development mode with token "dev-token", bypass Supabase validation
  if (isDev && token === "dev-token") {
    console.warn("⚠️  Using dev auth bypass (dev-token)");
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
