import dotenv from "dotenv";

dotenv.config();

const parseBool = (value: string | undefined, fallback: boolean) => {
  if (value === undefined) return fallback;
  return value === "true" || value === "1";
};

const parseNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const env = {
  port: Number(process.env.PORT || 4000),
  supabaseUrl: process.env.SUPABASE_URL ?? "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY ?? "",
  geminiApiKey: process.env.GEMINI_API_KEY ?? "",
  redisUrl: process.env.REDIS_URL ?? "redis://localhost:6379",
  storageBucket: process.env.STORAGE_BUCKET ?? "courses",
  dashboardRecentLimit: parseNumber(process.env.DASHBOARD_RECENT_LIMIT, 5),
  dashboardMinutesSavedPerSubmission: parseNumber(process.env.DASHBOARD_MINUTES_SAVED_PER_SUBMISSION, 10),
  defaultNotifyEmail: parseBool(process.env.DEFAULT_NOTIFY_EMAIL, true),
  defaultNotifyGradingComplete: parseBool(process.env.DEFAULT_NOTIFY_GRADING_COMPLETE, true),
  defaultTheme: process.env.DEFAULT_THEME ?? "system"
};

export const requiredEnv = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "GEMINI_API_KEY"];

export function validateEnv(): void {
  const missing = requiredEnv.filter((key) => !(process.env as Record<string, string | undefined>)[key]);
  if (missing.length) {
    console.warn(`[env] Missing variables: ${missing.join(", ")}`);
  }
}
