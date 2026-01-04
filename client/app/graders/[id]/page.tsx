"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { AppLayout } from "@/components/layout/app-layout"
import { Button } from "@/components/ui/button"
import { RubricEditor } from "@/components/rubric/rubric-editor"
import { ArrowLeft, Save, Eye } from "lucide-react"
import { useGrader, useUpdateRubric } from "@/hooks/useApi"
import type { BackendRubric, RubricRow } from "@/services/apiService"

interface RubricCriterion {
  description: string
  points: number
}

interface RubricQuestion {
  question: string
  criteria: RubricCriterion[]
  totalPoints: number
}

const mapRubric = (rows: BackendRubric[]): RubricQuestion[] => {
  const grouped = new Map<string, RubricQuestion>()
  rows.forEach((row) => {
    const key = row.question_number || row.question_text || row.id
    if (!grouped.has(key)) {
      grouped.set(key, {
        question: row.question_text || `Question ${row.question_number}`,
        criteria: [],
        totalPoints: 0,
      })
    }
    const entry = grouped.get(key)
    if (entry) {
      entry.criteria.push({ description: row.expected_answer, points: row.marks })
    }
  })

  return Array.from(grouped.values()).map((item) => ({
    ...item,
    totalPoints: item.criteria.reduce((sum, criterion) => sum + criterion.points, 0),
  }))
}

const extractQuestionNumber = (question: string, fallback: number) => {
  const match = question.match(/\d+/)
  return match ? match[0] : String(fallback)
}

const toRubricRows = (rubric: RubricQuestion[]): RubricRow[] =>
  rubric.flatMap((question, index) => {
    const questionNumber = extractQuestionNumber(question.question, index + 1)
    return question.criteria.map((criterion) => ({
      question_number: questionNumber,
      question_text: question.question,
      expected_answer: criterion.description,
      marks: criterion.points,
    }))
  })

export default function GraderDetailPage() {
  const router = useRouter()
  const params = useParams()
  const graderId = typeof params.id === "string" ? params.id : params.id?.[0]
  const graderQuery = useGrader(graderId)
  const updateRubric = useUpdateRubric(graderId ?? "")
  const [rubric, setRubric] = useState<RubricQuestion[]>([])

  useEffect(() => {
    if (graderQuery.data) {
      setRubric(mapRubric(graderQuery.data.rubric))
    }
  }, [graderQuery.data])

  const rubricRows = useMemo(() => toRubricRows(rubric), [rubric])

  const handleSave = () => {
    if (!graderId) return
    updateRubric.mutate(rubricRows)
  }

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon-sm" onClick={() => router.back()}>
              <ArrowLeft className="size-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {graderQuery.data?.grader.title ?? "Grader"}
              </h1>
              <p className="text-muted-foreground">Course ID: {graderQuery.data?.grader.course_id ?? "—"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="gap-2 bg-transparent" disabled>
              <Eye className="size-4" />
              Preview
            </Button>
            <Button className="gap-2" onClick={handleSave} disabled={updateRubric.isPending}>
              <Save className="size-4" />
              {updateRubric.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>

        {graderQuery.isLoading && <div className="text-sm text-muted-foreground">Loading rubric...</div>}
        {graderQuery.isError && (
          <div className="text-sm text-destructive">
            Failed to load grader.{" "}
            {graderQuery.error instanceof Error ? graderQuery.error.message : "Please try again."}
          </div>
        )}

        {!graderQuery.isLoading && !graderQuery.isError && (
          <RubricEditor rubric={rubric} onRubricChange={setRubric} />
        )}

        {updateRubric.isError && (
          <div className="text-sm text-destructive">
            Failed to update rubric.{" "}
            {updateRubric.error instanceof Error ? updateRubric.error.message : "Please try again."}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
