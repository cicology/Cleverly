"use client"

import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen, Upload, FileText, Download } from "lucide-react"

export function QuickActions() {
  const router = useRouter()

  const actions = [
    {
      icon: BookOpen,
      label: "Create Course",
      description: "Upload materials",
      onClick: () => router.push("/courses/create"),
      variant: "default" as const,
    },
    {
      icon: Upload,
      label: "Upload Test",
      description: "Grade submissions",
      onClick: () => router.push("/grading/upload"),
      variant: "default" as const,
    },
    {
      icon: FileText,
      label: "View Submissions",
      description: "Recent grades",
      onClick: () => router.push("/submissions"),
      variant: "outline" as const,
    },
    {
      icon: Download,
      label: "Export Grades",
      description: "Download CSV",
      onClick: () => {},
      variant: "outline" as const,
    },
  ]

  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {actions.map((action, index) => {
            const Icon = action.icon
            return (
              <Button
                key={index}
                variant={action.variant}
                onClick={action.onClick}
                className="h-auto flex-col items-start gap-2 p-4"
              >
                <Icon className="size-5" />
                <div className="text-left">
                  <div className="font-semibold text-sm">{action.label}</div>
                  <div className="text-xs text-muted-foreground font-normal">{action.description}</div>
                </div>
              </Button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
