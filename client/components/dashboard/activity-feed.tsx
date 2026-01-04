"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, AlertCircle, Clock } from "lucide-react"

const activities = [
  {
    type: "success",
    icon: CheckCircle2,
    title: "Grading Complete",
    description: "Chemistry Test 3 - 24 submissions graded",
    time: "2 minutes ago",
  },
  {
    type: "pending",
    icon: Clock,
    title: "Grading in Progress",
    description: "English Essay - 12 of 30 submissions",
    time: "15 minutes ago",
  },
  {
    type: "warning",
    icon: AlertCircle,
    title: "Low Confidence Detected",
    description: "Math Quiz 5 - Review 3 submissions",
    time: "1 hour ago",
  },
  {
    type: "success",
    icon: CheckCircle2,
    title: "Course Created",
    description: "Biology Advanced Topics",
    time: "2 hours ago",
  },
]

export function ActivityFeed() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Feed</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity, index) => {
            const Icon = activity.icon
            return (
              <div key={index} className="flex gap-3">
                <div
                  className={`p-2 rounded-full h-fit ${
                    activity.type === "success"
                      ? "bg-green-50 dark:bg-green-950 text-green-600"
                      : activity.type === "warning"
                        ? "bg-yellow-50 dark:bg-yellow-950 text-yellow-600"
                        : "bg-blue-50 dark:bg-blue-950 text-blue-600"
                  }`}
                >
                  <Icon className="size-4" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{activity.title}</p>
                    <span className="text-xs text-muted-foreground">{activity.time}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{activity.description}</p>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
