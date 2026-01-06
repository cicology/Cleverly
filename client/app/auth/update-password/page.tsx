"use client"

import Image from "next/image"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase"

type StatusState = {
  type: "error" | "success"
  message: string
}

export default function UpdatePasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [status, setStatus] = useState<StatusState | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [validSession, setValidSession] = useState(false)

  useEffect(() => {
    // Check if there's a valid recovery session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setValidSession(true)
      } else {
        setStatus({
          type: "error",
          message: "Invalid or expired password reset link. Please request a new one.",
        })
      }
    })
  }, [])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submitting) return

    setStatus(null)

    if (password !== confirmPassword) {
      setStatus({ type: "error", message: "Passwords do not match." })
      return
    }

    if (password.length < 6) {
      setStatus({ type: "error", message: "Password must be at least 6 characters long." })
      return
    }

    setSubmitting(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      })

      if (error) {
        setStatus({ type: "error", message: error.message })
        return
      }

      setStatus({
        type: "success",
        message: "Password updated successfully! Redirecting...",
      })

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push("/")
      }, 2000)
    } finally {
      setSubmitting(false)
    }
  }

  if (!validSession && status?.type !== "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-cyan-50 dark:from-[#0f0a1a] dark:via-[#1a1025] dark:to-[#0f0a1a]">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <div className="size-10 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
          <span className="text-sm">Verifying reset link...</span>
        </div>
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
          <h1 className="text-4xl font-semibold text-balance">Create a new password</h1>
          <p className="text-muted-foreground text-lg text-pretty">
            Choose a strong password to secure your account.
          </p>
        </div>

        <Card className="w-full">
          <CardHeader className="space-y-2">
            <CardTitle>Update your password</CardTitle>
            <CardDescription>Enter your new password below.</CardDescription>
          </CardHeader>

          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="password">New password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Enter your new password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  disabled={!validSession}
                />
              </div>

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
                  disabled={!validSession}
                />
              </div>

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

              <Button type="submit" className="w-full" disabled={submitting || !validSession}>
                {submitting ? "Updating..." : "Update password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
