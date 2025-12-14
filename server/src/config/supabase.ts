import { createClient } from "@supabase/supabase-js";
import { env } from "./env.js";

if (!env.supabaseUrl || !env.supabaseServiceRoleKey) {
  console.warn("[supabase] Missing URL or service role key; API calls will fail until configured.");
}

export const supabase = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
  auth: { autoRefreshToken: true, persistSession: false },
  global: { headers: { "x-client-info": "cleverly-server" } }
});
