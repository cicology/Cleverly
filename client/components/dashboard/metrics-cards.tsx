"use client"

import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card"
import { ClipboardCheck, Clock, TrendingUp, BookOpen } from "lucide-react"
import { useDashboardMetrics } from "@/hooks/useApi"

const formatConfidence = (value: number) => {
  if (!value) return "0%"
  const percent = value <= 1 ? value * 100 : value
  return `${Math.round(percent)}%`
}

export function MetricsCards() {
  const { data, isLoading, isError } = useDashboardMetrics()
  const timeSaved = data?.time_saved_hours ?? 0

  const metrics = [
    {
      title: "Submissions Graded",
      value: data ? `${data.graded_submissions}` : "—",
      change: "Total graded",
      icon: ClipboardCheck,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950",
    },
    {
      title: "Time Saved",
      value: data ? `${timeSaved} hrs` : "—",
      change: "Estimated",
      icon: Clock,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950",
    },
    {
      title: "Avg Confidence",
      value: data ? formatConfidence(data.avg_confidence) : "—",
      change: "Across grades",
      icon: TrendingUp,
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-950",
    },
    {
      title: "Active Courses",
      value: data ? `${data.active_courses}` : "—",
      change: "Courses with graders",
      icon: BookOpen,
      color: "text-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-950",
    },
  ]

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {isLoading && !data && (
        <div className="text-sm text-muted-foreground sm:col-span-2 lg:col-span-4">Loading metrics...</div>
      )}
      {isError && (
        <div className="text-sm text-destructive sm:col-span-2 lg:col-span-4">Failed to load metrics.</div>
      )}
      {metrics.map((metric, index) => {
        const Icon = metric.icon
        return (
          <Card key={index}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardDescription className="text-xs">{metric.title}</CardDescription>
                <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                  <Icon className={`size-4 ${metric.color}`} />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-1">{metric.value}</div>
              <p className="text-xs text-muted-foreground">{metric.change}</p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
