"use client"

import { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AppLayout } from "@/components/layout/app-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ConfidenceIndicator } from "@/components/cleverly/confidence-indicator"
import { Input } from "@/components/ui/input"
import { Download, Search, Eye, Filter } from "lucide-react"
import { useSubmissions } from "@/hooks/useApi"

const formatDate = (value: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString()
}

function SubmissionsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const graderId = searchParams.get("graderId") ?? ""
  const [graderInput, setGraderInput] = useState(graderId)
  const submissionsQuery = useSubmissions(graderId || undefined)

  const handleLoad = () => {
    if (!graderInput.trim()) return
    router.push(`/submissions?graderId=${graderInput.trim()}`)
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Submissions</h1>
            <p className="text-muted-foreground">View submissions by grader ID.</p>
          </div>
          <Button className="gap-2" disabled>
            <Download className="size-4" />
            Export Grades
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Enter grader ID"
              className="pl-9"
              value={graderInput}
              onChange={(event) => setGraderInput(event.target.value)}
            />
          </div>
          <Button onClick={handleLoad} disabled={!graderInput.trim()}>
            Load Submissions
          </Button>
          <Button variant="outline" size="icon" disabled>
            <Filter className="size-4" />
          </Button>
        </div>

        {submissionsQuery.isLoading && <div className="text-sm text-muted-foreground">Loading submissions...</div>}
        {submissionsQuery.isError && (
          <div className="text-sm text-destructive">
            Failed to load submissions.{" "}
            {submissionsQuery.error instanceof Error ? submissionsQuery.error.message : "Please try again."}
          </div>
        )}

        {submissionsQuery.data && (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4 font-semibold text-sm">Student</th>
                      <th className="text-left p-4 font-semibold text-sm">Grader</th>
                      <th className="text-left p-4 font-semibold text-sm">Grade</th>
                      <th className="text-left p-4 font-semibold text-sm">Confidence</th>
                      <th className="text-left p-4 font-semibold text-sm">Date</th>
                      <th className="text-left p-4 font-semibold text-sm">Status</th>
                      <th className="text-right p-4 font-semibold text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissionsQuery.data.map((submission) => {
                      const hasScore =
                        typeof submission.total_score === "number" &&
                        typeof submission.max_possible_score === "number" &&
                        submission.max_possible_score > 0
                      const gradePercent = hasScore
                        ? Math.round((submission.total_score! / submission.max_possible_score!) * 100)
                        : null

                      return (
                        <tr key={submission.id} className="border-b hover:bg-muted/50 transition-colors">
                          <td className="p-4 font-medium">{submission.student_identifier}</td>
                          <td className="p-4 text-sm text-muted-foreground">{submission.grader_id}</td>
                          <td className="p-4">
                            <span className="text-lg font-bold">{gradePercent ?? "—"}{gradePercent !== null ? "%" : ""}</span>
                          </td>
                          <td className="p-4">
                            <div className="w-32">
                              <ConfidenceIndicator score={0} size="sm" />
                            </div>
                          </td>
                          <td className="p-4 text-sm text-muted-foreground">{formatDate(submission.created_at)}</td>
                          <td className="p-4">
                            <Badge
                              variant={submission.status === "graded" ? "success" : submission.status === "flagged" ? "warning" : "outline"}
                            >
                              {submission.status}
                            </Badge>
                          </td>
                          <td className="p-4 text-right">
                            <Button variant="ghost" size="icon-sm">
                              <Eye className="size-4" />
                            </Button>
                          </td>
                        </tr>
                      )
                    })}
                    {submissionsQuery.data.length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-6 text-center text-sm text-muted-foreground">
                          No submissions yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  )
}

export default function SubmissionsPage() {
  return (
    <Suspense fallback={<AppLayout><div className="text-muted-foreground">Loading...</div></AppLayout>}>
      <SubmissionsContent />
    </Suspense>
  )
}
