"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { AppLayout } from "@/components/layout/app-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { User, Bell, Key, Palette } from "lucide-react"
import { useProfile, useSettings, useUpdateProfile, useUpdateSettings } from "@/hooks/useApi"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/components/auth/auth-provider"

export default function SettingsPage() {
  const { user } = useAuth()
  const profileQuery = useProfile()
  const settingsQuery = useSettings()
  const updateProfile = useUpdateProfile()
  const updateSettings = useUpdateSettings()
  const { setTheme } = useTheme()

  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [emailChangeStatus, setEmailChangeStatus] = useState<{
    type: "success" | "error"
    message: string
  } | null>(null)
  const [changingEmail, setChangingEmail] = useState(false)
  const [notificationsEmail, setNotificationsEmail] = useState(true)
  const [notificationsGradingComplete, setNotificationsGradingComplete] = useState(true)
  const [theme, setThemePreference] = useState<"light" | "dark" | "system">("system")
  const [geminiApiKey, setGeminiApiKey] = useState("")
  const apiKeyConfigured = settingsQuery.data?.api_key_configured ?? false
  const apiKeyLast4 = settingsQuery.data?.api_key_last4

  useEffect(() => {
    if (profileQuery.data) {
      setFullName(profileQuery.data.full_name ?? "")
      setEmail(profileQuery.data.email ?? "")
    }
  }, [profileQuery.data])

  useEffect(() => {
    if (settingsQuery.data) {
      setNotificationsEmail(settingsQuery.data.settings.notifications_email)
      setNotificationsGradingComplete(settingsQuery.data.settings.notifications_grading_complete)
      setThemePreference(settingsQuery.data.settings.theme)
      setTheme(settingsQuery.data.settings.theme)
    }
  }, [settingsQuery.data, setTheme])

  const handleProfileSave = () => {
    updateProfile.mutate({ full_name: fullName })
  }

  const handleEmailChange = async () => {
    if (!newEmail.trim() || newEmail === email) {
      setEmailChangeStatus({
        type: "error",
        message: "Please enter a valid new email address.",
      })
      return
    }

    setEmailChangeStatus(null)
    setChangingEmail(true)

    try {
      const { error } = await supabase.auth.updateUser({
        email: newEmail.trim(),
      })

      if (error) {
        setEmailChangeStatus({
          type: "error",
          message: error.message,
        })
        return
      }

      setEmailChangeStatus({
        type: "success",
        message: "Check both your current and new email to confirm the change.",
      })
      setNewEmail("")
    } finally {
      setChangingEmail(false)
    }
  }

  const handleSettingsSave = () => {
    updateSettings.mutate({
      notifications_email: notificationsEmail,
      notifications_grading_complete: notificationsGradingComplete,
      theme,
    })
    setTheme(theme)
  }

  const handleApiKeySave = () => {
    if (!geminiApiKey.trim()) return
    updateSettings.mutate({ gemini_api_key: geminiApiKey.trim() })
    setGeminiApiKey("")
  }

  return (
    <AppLayout>
      <div className="max-w-4xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
          <p className="text-muted-foreground">Manage your account and application preferences.</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="size-5" />
              <CardTitle>Profile</CardTitle>
            </div>
            <CardDescription>Update your personal information.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" value={fullName} onChange={(event) => setFullName(event.target.value)} />
            </div>
            <div>
              <Label htmlFor="current-email">Current Email</Label>
              <Input id="current-email" type="email" value={email} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground mt-1">
                To change your email, use the form below.
              </p>
            </div>
            <Button onClick={handleProfileSave} disabled={updateProfile.isPending}>
              {updateProfile.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="size-5" />
              <CardTitle>Change Email</CardTitle>
            </div>
            <CardDescription>Update your email address. You'll need to verify both your current and new email.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="new-email">New Email Address</Label>
              <Input
                id="new-email"
                type="email"
                placeholder="newemail@school.edu"
                value={newEmail}
                onChange={(event) => setNewEmail(event.target.value)}
              />
            </div>
            {emailChangeStatus && (
              <div
                className={`rounded-md border px-3 py-2 text-sm ${
                  emailChangeStatus.type === "error"
                    ? "border-destructive/40 bg-destructive/10 text-destructive"
                    : "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                }`}
              >
                {emailChangeStatus.message}
              </div>
            )}
            <Button onClick={handleEmailChange} disabled={changingEmail || !newEmail.trim()}>
              {changingEmail ? "Updating..." : "Change Email"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="size-5" />
              <CardTitle>Notifications</CardTitle>
            </div>
            <CardDescription>Configure how you receive notifications.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Email Notifications</div>
                <div className="text-sm text-muted-foreground">Receive updates via email</div>
              </div>
              <input
                type="checkbox"
                checked={notificationsEmail}
                onChange={(event) => setNotificationsEmail(event.target.checked)}
                className="size-5"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Grading Complete</div>
                <div className="text-sm text-muted-foreground">Notify when grading finishes</div>
              </div>
              <input
                type="checkbox"
                checked={notificationsGradingComplete}
                onChange={(event) => setNotificationsGradingComplete(event.target.checked)}
                className="size-5"
              />
            </div>
            <Button onClick={handleSettingsSave} disabled={updateSettings.isPending}>
              {updateSettings.isPending ? "Saving..." : "Save Preferences"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Key className="size-5" />
              <CardTitle>API Keys</CardTitle>
            </div>
            <CardDescription>Manage your Gemini AI API configuration.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 text-sm">
              <Badge variant={apiKeyConfigured ? "success" : "warning"}>
                {apiKeyConfigured ? "Configured" : "Not configured"}
              </Badge>
              <span className="text-muted-foreground">
                {apiKeyConfigured
                  ? apiKeyLast4
                    ? `Key ends with ••••${apiKeyLast4}`
                    : "Using server default key"
                  : "Add a key to enable AI grading"}
              </span>
            </div>
            <div>
              <Label htmlFor="api-key">Gemini API Key</Label>
              <Input
                id="api-key"
                type="password"
                placeholder="••••••••••••••••"
                value={geminiApiKey}
                onChange={(event) => setGeminiApiKey(event.target.value)}
              />
            </div>
            <Button onClick={handleApiKeySave} disabled={updateSettings.isPending || !geminiApiKey.trim()}>
              {updateSettings.isPending ? "Saving..." : "Update API Key"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Palette className="size-5" />
              <CardTitle>Appearance</CardTitle>
            </div>
            <CardDescription>Customize the look and feel.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Dark Mode</div>
                <div className="text-sm text-muted-foreground">Switch to dark theme</div>
              </div>
              <input
                type="checkbox"
                checked={theme === "dark"}
                onChange={(event) => setThemePreference(event.target.checked ? "dark" : "light")}
                className="size-5"
              />
            </div>
            <Button onClick={handleSettingsSave} disabled={updateSettings.isPending}>
              {updateSettings.isPending ? "Saving..." : "Save Appearance"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
