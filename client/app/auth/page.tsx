"use client"

import Image from "next/image"
import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/components/auth/auth-provider"
import { isAuthEnabled, supabase } from "@/lib/supabase"

type StatusState = {
  type: "error" | "success"
  message: string
}

const featureHighlights = [
  "AI-assisted rubric generation",
  "Course materials ingestion",
  "Handwritten submission grading",
]

export default function AuthPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading } = useAuth()

  const redirectTo = useMemo(() => {
    const raw = searchParams.get("redirect")
    if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/"
    return raw
  }, [searchParams])

  const [mode, setMode] = useState<"sign_in" | "sign_up">("sign_in")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [status, setStatus] = useState<StatusState | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!loading && user) {
      router.replace(redirectTo)
    }
  }, [loading, redirectTo, router, user])

  const handleSocialAuth = async (provider: "google" | "github") => {
    setStatus(null)
    setSubmitting(true)

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth?redirect=${encodeURIComponent(redirectTo)}`,
        },
      })

      if (error) {
        setStatus({ type: "error", message: error.message })
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submitting) return

    setStatus(null)

    if (mode === "sign_up" && password !== confirmPassword) {
      setStatus({ type: "error", message: "Passwords do not match." })
      return
    }

    setSubmitting(true)

    try {
      if (mode === "sign_in") {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) {
          setStatus({ type: "error", message: error.message })
          return
        }
        router.replace(redirectTo)
        return
      }

      const emailRedirectTo = `${window.location.origin}/auth?redirect=${encodeURIComponent(redirectTo)}`
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo,
          data: {
            full_name: fullName,
          },
        },
      })

      if (error) {
        setStatus({ type: "error", message: error.message })
        return
      }

      if (!data.session) {
        setStatus({
          type: "success",
          message: "Check your email to confirm your account before signing in.",
        })
        return
      }

      router.replace(redirectTo)
    } finally {
      setSubmitting(false)
    }
  }

  if (!isAuthEnabled) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-cyan-50 dark:from-[#0f0a1a] dark:via-[#1a1025] dark:to-[#0f0a1a] p-6">
        <Card className="max-w-lg w-full">
          <CardHeader>
            <CardTitle>Authentication not configured</CardTitle>
            <CardDescription>
              Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable login.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Once those environment variables are set, refresh this page to sign in or sign up.
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-cyan-50 dark:from-[#0f0a1a] dark:via-[#1a1025] dark:to-[#0f0a1a] flex items-center justify-center p-6">
      <div className="w-full max-w-5xl grid gap-10 lg:grid-cols-[1.05fr_0.95fr] items-center">
        <div className="hidden lg:flex flex-col gap-6 pr-6">
          <div className="flex items-center gap-3">
            <Image src="/cleverly-icon.svg" alt="Cleverly" width={44} height={44} />
            <span className="text-2xl font-bold cleverly-gradient-text">Cleverly</span>
          </div>
          <h1 className="text-4xl font-semibold text-balance">Grade smarter with a secure workspace.</h1>
          <p className="text-muted-foreground text-lg text-pretty">
            Sign in to manage courses, generate rubrics, and review AI-powered grading insights.
          </p>
          <div className="space-y-3">
            {featureHighlights.map((item) => (
              <div key={item} className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="size-2 rounded-full bg-primary" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <Card className="w-full">
          <CardHeader className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <CardTitle>{mode === "sign_in" ? "Welcome back" : "Create your account"}</CardTitle>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStatus(null)
                  setMode(mode === "sign_in" ? "sign_up" : "sign_in")
                }}
              >
                {mode === "sign_in" ? "Sign up" : "Sign in"}
              </Button>
            </div>
            <CardDescription>
              {mode === "sign_in"
                ? "Sign in with the email you used to set up your workspace."
                : "Use a work email to create your Cleverly account."}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="space-y-4 mb-6">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => handleSocialAuth("google")}
                disabled={submitting}
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => handleSocialAuth("github")}
                disabled={submitting}
              >
                <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                Continue with GitHub
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or continue with email</span>
                </div>
              </div>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@school.edu"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>

              {mode === "sign_up" && (
                <div className="space-y-2">
                  <Label htmlFor="full-name">Full name</Label>
                  <Input
                    id="full-name"
                    type="text"
                    autoComplete="name"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    required
                  />
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  {mode === "sign_in" && (
                    <Link
                      href="/auth/reset-password"
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Forgot password?
                    </Link>
                  )}
                </div>
                <Input
                  id="password"
                  type="password"
                  autoComplete={mode === "sign_in" ? "current-password" : "new-password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </div>

              {mode === "sign_up" && (
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    required
                  />
                </div>
              )}

              {status && (
                <div
                  className={`rounded-md border px-3 py-2 text-sm ${
                    status.type === "error"
                      ? "border-destructive/40 bg-destructive/10 text-destructive"
                      : "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                  }`}
                >
                  {status.message}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting
                  ? "Working..."
                  : mode === "sign_in"
                    ? "Sign in"
                    : "Create account"}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col gap-2 text-sm text-muted-foreground">
            <span>
              {mode === "sign_in"
                ? "No account yet? Create one in seconds."
                : "Already have an account? Sign in to continue."}
            </span>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
