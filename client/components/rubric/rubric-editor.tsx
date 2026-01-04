"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RubricTable } from "@/components/rubric/rubric-table"
import { PointsCalculator } from "@/components/rubric/points-calculator"

interface Criterion {
  description: string
  points: number
}

interface RubricQuestion {
  question: string
  criteria: Criterion[]
  totalPoints: number
}

interface RubricEditorProps {
  rubric: RubricQuestion[]
  onRubricChange: (rubric: RubricQuestion[]) => void
}

export function RubricEditor({ rubric, onRubricChange }: RubricEditorProps) {
  const totalPoints = rubric.reduce((sum, q) => sum + q.totalPoints, 0)

  return (
    <div className="space-y-6">
      <PointsCalculator totalPoints={totalPoints} questionCount={rubric.length} />

      <Card>
        <CardHeader>
          <CardTitle>Grading Rubric</CardTitle>
        </CardHeader>
        <CardContent>
          <RubricTable rubric={rubric} onRubricChange={onRubricChange} />
        </CardContent>
      </Card>
    </div>
  )
}
