import axios from "axios";
import { getAccessToken } from "./supabase";

async function getAuthToken(): Promise<string | undefined> {
  // Try to get Supabase session token
  const token = await getAccessToken();
  if (token) return token;

  // Allow a manual demo token for quick testing
  if (import.meta.env.VITE_SUPABASE_DEMO_TOKEN) {
    return import.meta.env.VITE_SUPABASE_DEMO_TOKEN as string;
  }

  return undefined;
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000/api"
});

// Add request interceptor to include Supabase JWT
api.interceptors.request.use(async (config) => {
  const token = await getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
