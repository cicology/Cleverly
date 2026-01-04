"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Plus, Trash2, Sparkles, GripVertical } from "lucide-react"

interface Criterion {
  description: string
  points: number
}

interface RubricQuestion {
  question: string
  criteria: Criterion[]
  totalPoints: number
}

interface RubricTableProps {
  rubric: RubricQuestion[]
  onRubricChange: (rubric: RubricQuestion[]) => void
}

export function RubricTable({ rubric, onRubricChange }: RubricTableProps) {
  const [expandedQuestions, setExpandedQuestions] = useState<number[]>([0])

  const toggleQuestion = (index: number) => {
    setExpandedQuestions((prev) => (prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]))
  }

  const updateQuestion = (index: number, question: string) => {
    const updated = [...rubric]
    updated[index].question = question
    onRubricChange(updated)
  }

  const addCriterion = (questionIndex: number) => {
    const updated = [...rubric]
    updated[questionIndex].criteria.push({ description: "", points: 0 })
    onRubricChange(updated)
  }

  const updateCriterion = (
    questionIndex: number,
    criterionIndex: number,
    field: "description" | "points",
    value: string | number,
  ) => {
    const updated = [...rubric]
    if (field === "points") {
      updated[questionIndex].criteria[criterionIndex].points = Number(value)
    } else {
      updated[questionIndex].criteria[criterionIndex].description = String(value)
    }
    updated[questionIndex].totalPoints = updated[questionIndex].criteria.reduce((sum, c) => sum + c.points, 0)
    onRubricChange(updated)
  }

  const removeCriterion = (questionIndex: number, criterionIndex: number) => {
    const updated = [...rubric]
    updated[questionIndex].criteria.splice(criterionIndex, 1)
    updated[questionIndex].totalPoints = updated[questionIndex].criteria.reduce((sum, c) => sum + c.points, 0)
    onRubricChange(updated)
  }

  const addQuestion = () => {
    onRubricChange([
      ...rubric,
      {
        question: "New Question",
        criteria: [{ description: "", points: 0 }],
        totalPoints: 0,
      },
    ])
    setExpandedQuestions([...expandedQuestions, rubric.length])
  }

  const regenerateCriteria = (questionIndex: number) => {
    console.log("[v0] Regenerating criteria with AI for question", questionIndex)
  }

  return (
    <div className="space-y-4">
      {rubric.map((question, qIndex) => (
        <div key={qIndex} className="border rounded-lg overflow-hidden">
          <div
            className="bg-muted p-4 flex items-center justify-between cursor-pointer hover:bg-muted/80 transition-colors"
            onClick={() => toggleQuestion(qIndex)}
          >
            <div className="flex items-center gap-3 flex-1">
              <GripVertical className="size-4 text-muted-foreground cursor-grab" />
              <div className="flex-1">
                <Input
                  value={question.question}
                  onChange={(e) => updateQuestion(qIndex, e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-transparent border-none shadow-none p-0 h-auto font-medium"
                />
              </div>
              <div className="text-sm font-semibold text-primary">{question.totalPoints} points</div>
            </div>
          </div>

          {expandedQuestions.includes(qIndex) && (
            <div className="p-4 space-y-3">
              {question.criteria.map((criterion, cIndex) => (
                <div key={cIndex} className="flex items-start gap-3 p-3 bg-background rounded-lg border">
                  <GripVertical className="size-4 text-muted-foreground cursor-grab mt-2" />
                  <div className="flex-1">
                    <Textarea
                      value={criterion.description}
                      onChange={(e) => updateCriterion(qIndex, cIndex, "description", e.target.value)}
                      placeholder="Criterion description..."
                      className="resize-none"
                      rows={2}
                    />
                  </div>
                  <Input
                    type="number"
                    value={criterion.points}
                    onChange={(e) => updateCriterion(qIndex, cIndex, "points", e.target.value)}
                    className="w-20 text-center font-mono"
                    min="0"
                  />
                  <Button variant="ghost" size="icon-sm" onClick={() => removeCriterion(qIndex, cIndex)}>
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              ))}

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => addCriterion(qIndex)} className="gap-2 bg-transparent">
                  <Plus className="size-4" />
                  Add Criterion
                </Button>
                <Button variant="outline" onClick={() => regenerateCriteria(qIndex)} className="gap-2 bg-transparent">
                  <Sparkles className="size-4" />
                  Regenerate with AI
                </Button>
              </div>
            </div>
          )}
        </div>
      ))}

      <Button variant="outline" onClick={addQuestion} className="w-full gap-2 bg-transparent">
        <Plus className="size-4" />
        Add Question
      </Button>
    </div>
  )
}
