"use client"

import { ConfidenceIndicator } from "@/components/cleverly/confidence-indicator"
import { cn } from "@/lib/utils"
import { User } from "lucide-react"

interface Submission {
  id: string
  student: string
  course: string
  questionsGraded: number
  totalQuestions: number
  confidence: number
  status: "pending" | "in-progress" | "review" | "completed"
}

interface SubmissionsQueueProps {
  submissions: Submission[]
  selectedId: string
  onSelect: (id: string) => void
}

export function SubmissionsQueue({ submissions, selectedId, onSelect }: SubmissionsQueueProps) {
  return (
    <div className="space-y-2 overflow-y-auto flex-1">
      {submissions.map((submission) => (
        <div
          key={submission.id}
          onClick={() => onSelect(submission.id)}
          className={cn(
            "p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md",
            selectedId === submission.id
              ? "bg-primary/10 border-primary shadow-sm"
              : "bg-card border-border hover:border-primary/50",
          )}
        >
          <div className="flex items-start gap-3">
            <div className="p-2 bg-muted rounded-full">
              <User className="size-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm mb-1 truncate">{submission.student}</div>
              <div className="text-xs text-muted-foreground mb-2">
                {submission.questionsGraded}/{submission.totalQuestions} questions reviewed
              </div>
              <ConfidenceIndicator score={submission.confidence} size="sm" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
