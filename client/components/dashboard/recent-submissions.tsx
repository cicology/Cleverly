"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ConfidenceIndicator } from "@/components/cleverly/confidence-indicator"
import { Button } from "@/components/ui/button"
import { Eye } from "lucide-react"
import { useRecentSubmissions } from "@/hooks/useApi"

const formatConfidence = (value: number) => (value <= 1 ? Math.round(value * 100) : Math.round(value))
const formatScore = (value: number | null) => (value === null ? "—" : `${Math.round(value)}%`)
const formatDate = (value: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString()
}

export function RecentSubmissions() {
  const { data, isLoading, isError } = useRecentSubmissions(4)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Submissions</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && <div className="text-sm text-muted-foreground">Loading submissions...</div>}
        {isError && <div className="text-sm text-destructive">Failed to load submissions.</div>}
        {!isLoading && !isError && (
          <div className="space-y-4">
            {(data ?? []).map((submission) => (
              <div key={submission.submission_id} className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium">{submission.student_identifier}</p>
                    <Badge variant="outline" className="text-xs">
                      {submission.course_title}
                    </Badge>
                  </div>
                  <ConfidenceIndicator score={formatConfidence(submission.confidence_avg)} size="sm" />
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold">{formatScore(submission.score_percent)}</div>
                  <div className="text-xs text-muted-foreground">{formatDate(submission.submitted_at)}</div>
                </div>
                <Button variant="ghost" size="icon-sm">
                  <Eye className="size-4" />
                </Button>
              </div>
            ))}
            {(data ?? []).length === 0 && <div className="text-sm text-muted-foreground">No submissions yet.</div>}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
