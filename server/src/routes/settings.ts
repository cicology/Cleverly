import { Router } from "express";
import { z } from "zod";
import { requireAuth, AuthedRequest } from "../middleware/auth.js";
import { validateBody } from "../middleware/validateRequest.js";
import { supabase } from "../config/supabase.js";
import { env } from "../config/env.js";

const router = Router();

const settingsSchema = z.object({
  notifications_email: z.boolean().optional(),
  notifications_grading_complete: z.boolean().optional(),
  theme: z.enum(["light", "dark", "system"]).optional(),
  gemini_api_key: z.string().min(1).optional()
});

function defaultSettings() {
  return {
    notifications_email: env.defaultNotifyEmail,
    notifications_grading_complete: env.defaultNotifyGradingComplete,
    theme: env.defaultTheme
  };
}

router.get("/settings", requireAuth, async (req: AuthedRequest, res) => {
  const defaults = defaultSettings();
  const { data, error } = await supabase
    .from("user_settings")
    .select("notifications_email, notifications_grading_complete, theme, gemini_api_key")
    .eq("user_id", req.user!.id)
    .single();

  if (error && !error.message.includes("does not exist")) {
    return res.status(500).json({ error: error.message });
  }

  const apiKey = env.allowUserGeminiKeys ? data?.gemini_api_key ?? "" : "";
  const settings = {
    notifications_email: data?.notifications_email ?? defaults.notifications_email,
    notifications_grading_complete: data?.notifications_grading_complete ?? defaults.notifications_grading_complete,
    theme: data?.theme ?? defaults.theme
  };

  return res.json({
    settings,
    api_key_configured: Boolean(env.geminiApiKey || apiKey),
    api_key_last4: apiKey ? apiKey.slice(-4) : undefined
  });
});

router.put("/settings", requireAuth, validateBody(settingsSchema), async (req: AuthedRequest, res) => {
  const updates = req.body as z.infer<typeof settingsSchema>;
  if (updates.gemini_api_key && !env.allowUserGeminiKeys) {
    return res.status(400).json({ error: "User-provided API keys are disabled." });
  }
  const payload = {
    user_id: req.user!.id,
    notifications_email: updates.notifications_email,
    notifications_grading_complete: updates.notifications_grading_complete,
    theme: updates.theme,
    gemini_api_key: env.allowUserGeminiKeys ? updates.gemini_api_key : undefined
  };

  const { data, error } = await supabase
    .from("user_settings")
    .upsert(payload, { onConflict: "user_id" })
    .select("notifications_email, notifications_grading_complete, theme, gemini_api_key")
    .single();

  if (error || !data) {
    return res.status(500).json({ error: error?.message ?? "Failed to update settings" });
  }

  return res.json({
    settings: {
      notifications_email: data.notifications_email,
      notifications_grading_complete: data.notifications_grading_complete,
      theme: data.theme
    },
    api_key_configured: Boolean(data.gemini_api_key || env.geminiApiKey),
    api_key_last4: data.gemini_api_key ? data.gemini_api_key.slice(-4) : undefined
  });
});

export default router;
