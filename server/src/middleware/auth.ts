import { Request, Response, NextFunction } from "express";
import { AuthUser } from "../types/index.js";
import { supabase } from "../config/supabase.js";

export interface AuthedRequest extends Request {
  user?: AuthUser;
}

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction): void {
  const bearer = req.headers.authorization;
  if (!bearer) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const token = bearer.replace("Bearer ", "").trim();
  if (!token) {
    res.status(401).json({ error: "Invalid token" });
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
