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
  nodeEnv: process.env.NODE_ENV ?? "development",
  supabaseUrl: process.env.SUPABASE_URL ?? "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY ?? "",
  geminiApiKey: process.env.GEMINI_API_KEY ?? "",
  geminiFileSearchEnabled: parseBool(process.env.GEMINI_FILE_SEARCH_ENABLED, true),
  geminiFileSearchModel: process.env.GEMINI_FILE_SEARCH_MODEL ?? "gemini-2.0-flash",
  geminiFileSearchStorePrefix: process.env.GEMINI_FILE_SEARCH_STORE_PREFIX ?? "cleverly-course-",
  geminiFileSearchPollMs: parseNumber(process.env.GEMINI_FILE_SEARCH_POLL_MS, 5000),
  geminiFileSearchMaxWaitMs: parseNumber(process.env.GEMINI_FILE_SEARCH_MAX_WAIT_MS, 120000),
  geminiGradingModel: process.env.GEMINI_GRADING_MODEL ?? "gemini-2.0-flash",
  ocrModel: process.env.OCR_MODEL ?? "gemini-1.5-pro",
  redisUrl: process.env.REDIS_URL ?? "redis://localhost:6379",
  storageBucket: process.env.STORAGE_BUCKET ?? "courses",
  clientUrl: process.env.CLIENT_URL ?? "http://localhost:3000",
  corsAllowedOrigins: (process.env.CORS_ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean),
  allowDevAuthBypass: parseBool(process.env.ALLOW_DEV_AUTH_BYPASS, false),
  allowUserGeminiKeys: parseBool(process.env.ALLOW_USER_GEMINI_KEYS, false),
  maxUploadMb: parseNumber(process.env.MAX_UPLOAD_MB, 10),
  maxUploadFiles: parseNumber(process.env.MAX_UPLOAD_FILES, 20),
  ltiEnabled: parseBool(process.env.LTI_ENABLED, false),
  ltiPort: parseNumber(process.env.LTI_PORT, 4001),
  ltiKey: process.env.LTI_KEY ?? "",
  ltiDbUrl: process.env.LTI_DB_URL ?? "",
  ltiDbSsl: parseBool(process.env.LTI_DB_SSL, true),
  ltiCookieSameSite: process.env.LTI_COOKIE_SAMESITE ?? "None",
  ltiToolUrl: process.env.LTI_TOOL_URL ?? "",
  ltiAutoCreateByEmail: parseBool(process.env.LTI_AUTO_CREATE_BY_EMAIL, false),
  ltiPlatformUrl: process.env.LTI_PLATFORM_URL ?? "",
  ltiPlatformName: process.env.LTI_PLATFORM_NAME ?? "",
  ltiClientId: process.env.LTI_CLIENT_ID ?? "",
  ltiAuthEndpoint: process.env.LTI_AUTH_ENDPOINT ?? "",
  ltiTokenEndpoint: process.env.LTI_TOKEN_ENDPOINT ?? "",
  ltiKeysetUrl: process.env.LTI_KEYSET_URL ?? "",
  ltiAuthServer: process.env.LTI_AUTH_SERVER ?? "",
  ltiDynRegUrl: process.env.LTI_DYN_REG_URL ?? "",
  ltiToolName: process.env.LTI_TOOL_NAME ?? "Cleverly AI Grader",
  adminApiKey: process.env.ADMIN_API_KEY ?? "",
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
