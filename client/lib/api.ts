import axios from "axios"
import { getAccessToken } from "./supabase"

// Check if we're in production mode
const isProduction = process.env.NODE_ENV === "production"

async function getAuthToken(): Promise<string | undefined> {
  const token = await getAccessToken()
  if (token) return token

  // SECURITY: Demo token fallback is DISABLED in production
  // Only use demo token if explicitly enabled and NOT in production
  const demoToken = process.env.NEXT_PUBLIC_SUPABASE_DEMO_TOKEN
  const allowDemoToken = process.env.NEXT_PUBLIC_ALLOW_DEMO_TOKEN === "true"

  if (!isProduction && allowDemoToken && demoToken) {
    console.warn("⚠️  WARNING: Using demo token fallback (development only)")
    return demoToken
  }

  if (isProduction && demoToken) {
    console.error("❌ SECURITY: Demo token is configured but disabled in production")
  }

  return undefined
}

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api",
})

api.interceptors.request.use(async (config) => {
  const token = await getAuthToken()
  if (token) {
    config.headers = config.headers ?? {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
