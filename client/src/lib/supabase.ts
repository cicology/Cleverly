import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Check if Supabase is properly configured
const isSupabaseConfigured =
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('your-supabase-project') &&
  !supabaseAnonKey.includes('your-anon-key');

// Create Supabase client with graceful fallback for development
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

// Export flag for components to check if auth is available
export const isAuthEnabled = supabase !== null;

// Dev mode message
if (!isAuthEnabled && import.meta.env.DEV) {
  console.warn(
    '[Auth] Supabase not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env'
  );
}

export async function getAccessToken(): Promise<string | undefined> {
  if (!supabase) return undefined;
  const {
    data: { session }
  } = await supabase.auth.getSession();
  return session?.access_token;
}
