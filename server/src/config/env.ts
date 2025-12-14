import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: Number(process.env.PORT || 4000),
  supabaseUrl: process.env.SUPABASE_URL ?? "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY ?? "",
  geminiApiKey: process.env.GEMINI_API_KEY ?? "",
  redisUrl: process.env.REDIS_URL ?? "redis://localhost:6379",
  storageBucket: process.env.STORAGE_BUCKET ?? "courses"
};

export const requiredEnv = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "GEMINI_API_KEY"];

export function validateEnv(): void {
  const missing = requiredEnv.filter((key) => !(process.env as Record<string, string | undefined>)[key]);
  if (missing.length) {
    console.warn(`[env] Missing variables: ${missing.join(", ")}`);
  }
}
