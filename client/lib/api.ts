import axios from "axios"
import { getAccessToken } from "./supabase"

async function getAuthToken(): Promise<string | undefined> {
  const token = await getAccessToken()
  if (token) return token

  const demoToken = process.env.NEXT_PUBLIC_SUPABASE_DEMO_TOKEN
  if (demoToken) return demoToken

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
