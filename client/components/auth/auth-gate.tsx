"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { isAuthEnabled } from "@/lib/supabase"
import { useAuth } from "@/components/auth/auth-provider"

const publicRoutes = ["/auth"]

function isPublicRoute(pathname: string) {
  return publicRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`))
}

export function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, loading } = useAuth()
  const allowPublic = isPublicRoute(pathname)

  useEffect(() => {
    if (!isAuthEnabled || loading || allowPublic) return
    if (!user) {
      const nextPath =
        typeof window === "undefined" ? pathname : `${window.location.pathname}${window.location.search}`
      router.replace(`/auth?redirect=${encodeURIComponent(nextPath)}`)
    }
  }, [allowPublic, loading, router, user])

  if (!isAuthEnabled || allowPublic) {
    return <>{children}</>
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-cyan-50 dark:from-[#0f0a1a] dark:via-[#1a1025] dark:to-[#0f0a1a]">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <div className="size-10 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
          <span className="text-sm">Checking your session...</span>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-cyan-50 dark:from-[#0f0a1a] dark:via-[#1a1025] dark:to-[#0f0a1a]">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <div className="size-10 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
          <span className="text-sm">Redirecting to sign in...</span>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
