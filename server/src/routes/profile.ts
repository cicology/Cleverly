import { Router } from "express";
import { z } from "zod";
import { requireAuth, AuthedRequest } from "../middleware/auth.js";
import { validateBody } from "../middleware/validateRequest.js";
import { supabase } from "../config/supabase.js";

const router = Router();

const updateProfileSchema = z.object({
  full_name: z.string().min(1).optional(),
  avatar_url: z.string().url().optional(),
  email: z.string().email().optional()
});

router.get("/profile", requireAuth, async (req: AuthedRequest, res) => {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, avatar_url")
    .eq("id", req.user!.id)
    .single();

  if (!error && data) {
    return res.json({ profile: data });
  }

  const { data: created, error: createError } = await supabase
    .from("profiles")
    .upsert({ id: req.user!.id, email: req.user!.email ?? null })
    .select("id, email, full_name, avatar_url")
    .single();

  if (createError || !created) {
    return res.status(500).json({ error: createError?.message ?? "Failed to load profile" });
  }

  return res.json({ profile: created });
});

router.put("/profile", requireAuth, validateBody(updateProfileSchema), async (req: AuthedRequest, res) => {
  const updates = req.body as z.infer<typeof updateProfileSchema>;
  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", req.user!.id)
    .select("id, email, full_name, avatar_url")
    .single();

  if (error || !data) {
    return res.status(500).json({ error: error?.message ?? "Failed to update profile" });
  }

  return res.json({ profile: data });
});

export default router;
