"use client"

import Image from "next/image"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase"
import Link from "next/link"

type StatusState = {
  type: "error" | "success"
  message: string
}

export default function ResetPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<StatusState | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submitting) return

    setStatus(null)
    setSubmitting(true)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      })

      if (error) {
        setStatus({ type: "error", message: error.message })
        return
      }

      setStatus({
        type: "success",
        message: "Check your email for a password reset link.",
      })
      setEmail("")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-cyan-50 dark:from-[#0f0a1a] dark:via-[#1a1025] dark:to-[#0f0a1a] flex items-center justify-center p-6">
      <div className="w-full max-w-5xl grid gap-10 lg:grid-cols-[1.05fr_0.95fr] items-center">
        <div className="hidden lg:flex flex-col gap-6 pr-6">
          <div className="flex items-center gap-3">
            <Image src="/cleverly-icon.svg" alt="Cleverly" width={44} height={44} />
            <span className="text-2xl font-bold cleverly-gradient-text">Cleverly</span>
          </div>
          <h1 className="text-4xl font-semibold text-balance">Reset your password</h1>
          <p className="text-muted-foreground text-lg text-pretty">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        <Card className="w-full">
          <CardHeader className="space-y-2">
            <CardTitle>Forgot your password?</CardTitle>
            <CardDescription>
              No worries! Enter your email and we'll send you reset instructions.
            </CardDescription>
          </CardHeader>

          <CardContent>
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
                {submitting ? "Sending..." : "Send reset link"}
              </Button>

              <div className="text-center">
                <Link
                  href="/auth"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  ← Back to sign in
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
