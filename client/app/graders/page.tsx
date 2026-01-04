"use client"

import { Suspense, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AppLayout } from "@/components/layout/app-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Plus, Clock, CheckCircle } from "lucide-react"
import { EmptyGradersState } from "@/components/onboarding/empty-states"
import { useGrader } from "@/hooks/useApi"

const formatDate = (value: string | undefined) => {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString()
}

function GradersContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const graderId = searchParams.get("graderId") ?? ""
  const [graderInput, setGraderInput] = useState(graderId)
  const graderQuery = useGrader(graderId || undefined)

  const stats = useMemo(() => {
    if (!graderQuery.data) return null
    const rubric = graderQuery.data.rubric ?? []
    const totalPoints = rubric.reduce((sum, item) => sum + (item.marks ?? 0), 0)
    return {
      questionCount: rubric.length,
      totalPoints,
    }
  }, [graderQuery.data])

  const handleLoad = () => {
    if (!graderInput.trim()) return
    router.push(`/graders?graderId=${graderInput.trim()}`)
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Graders</h1>
            <p className="text-muted-foreground">Manage your grading rubrics and assignments.</p>
          </div>
          <Button onClick={() => router.push("/graders/create")} className="gap-2">
            <Plus className="size-4" />
            Create Grader
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Find a grader</CardTitle>
            <CardDescription>Enter a grader ID to load rubric details.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="grader UUID"
              value={graderInput}
              onChange={(event) => setGraderInput(event.target.value)}
            />
            <Button onClick={handleLoad} disabled={!graderInput.trim()}>
              Load Grader
            </Button>
          </CardContent>
        </Card>

        {graderQuery.isLoading && <div className="text-sm text-muted-foreground">Loading grader...</div>}
        {graderQuery.isError && (
          <div className="text-sm text-destructive">
            Failed to load grader.{" "}
            {graderQuery.error instanceof Error ? graderQuery.error.message : "Please try again."}
          </div>
        )}

        {!graderQuery.data && !graderQuery.isLoading && (
          <EmptyGradersState onCreateGrader={() => router.push("/graders/create")} />
        )}

        {graderQuery.data && (
          <Card
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => router.push(`/graders/${graderQuery.data.grader.id}`)}
          >
            <CardHeader>
              <div className="flex items-start gap-2 mb-2">
                <Badge variant={graderQuery.data.grader.status === "ready" ? "success" : "outline"}>
                  {graderQuery.data.grader.status}
                </Badge>
              </div>
              <CardTitle>{graderQuery.data.grader.title}</CardTitle>
              <CardDescription>Course ID: {graderQuery.data.grader.course_id}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="text-2xl font-bold text-primary">{stats?.questionCount ?? 0}</div>
                  <div className="text-xs text-muted-foreground">Questions</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary">{stats?.totalPoints ?? 0}</div>
                  <div className="text-xs text-muted-foreground">Total Points</div>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <CheckCircle className="size-4" />
                  Rubric loaded
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="size-4" />
                  {formatDate(graderQuery.data.grader.created_at)}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  )
}

export default function GradersPage() {
  return (
    <Suspense fallback={<AppLayout><div className="text-muted-foreground">Loading...</div></AppLayout>}>
      <GradersContent />
    </Suspense>
  )
}
