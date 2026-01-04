"use client"

import { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AppLayout } from "@/components/layout/app-layout"
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Download } from "lucide-react"
import { useGraderAnalytics } from "@/hooks/useApi"

function AnalyticsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const graderId = searchParams.get("graderId") ?? ""
  const [graderInput, setGraderInput] = useState(graderId)
  const analyticsQuery = useGraderAnalytics(graderId || undefined)

  const handleSetGrader = () => {
    if (!graderInput.trim()) return
    router.push(`/analytics?graderId=${graderInput.trim()}`)
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Analytics</h1>
            <p className="text-muted-foreground">Grader-level statistics from the backend API.</p>
          </div>
          <Button className="gap-2" disabled>
            <Download className="size-4" />
            Export Report
          </Button>
        </div>

        <Card>
          <CardContent className="p-4 flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="Enter grader ID"
              value={graderInput}
              onChange={(event) => setGraderInput(event.target.value)}
            />
            <Button onClick={handleSetGrader} disabled={!graderInput.trim()}>
              Load Analytics
            </Button>
          </CardContent>
        </Card>

        {analyticsQuery.isLoading && <div className="text-sm text-muted-foreground">Loading analytics...</div>}
        {analyticsQuery.isError && (
          <div className="text-sm text-destructive">
            Failed to load analytics: {analyticsQuery.error instanceof Error ? analyticsQuery.error.message : "Unknown"}
          </div>
        )}

        {analyticsQuery.data && (
          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Average Grade</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{analyticsQuery.data.average_percentage}%</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Graded Submissions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{analyticsQuery.data.graded_count}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Pending Submissions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{analyticsQuery.data.pending_count}</div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  )
}

export default function AnalyticsPage() {
  return (
    <Suspense fallback={<AppLayout><div className="text-muted-foreground">Loading...</div></AppLayout>}>
      <AnalyticsContent />
    </Suspense>
  )
}
