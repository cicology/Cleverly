"use client"

import { cn } from "@/lib/utils"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ConfidenceIndicator } from "@/components/cleverly/confidence-indicator"
import { ChevronLeft, ChevronRight, CheckCircle, AlertCircle, Flag, ZoomIn, ZoomOut } from "lucide-react"
import Image from "next/image"

interface RubricCheck {
  criterion: string
  checked: boolean
  points: number
}

interface Question {
  questionNumber: number
  totalQuestions: number
  questionText: string
  studentAnswerImage: string
  extractedText: string
  aiScore: number
  maxScore: number
  confidence: number
  rubricChecks: RubricCheck[]
  aiFeedback: string
}

interface QuestionReviewProps {
  question: Question
  onNext: () => void
  onPrevious: () => void
}

export function QuestionReview({ question, onNext, onPrevious }: QuestionReviewProps) {
  const [score, setScore] = useState(question.aiScore)
  const [feedback, setFeedback] = useState(question.aiFeedback)
  const [checks, setChecks] = useState(question.rubricChecks)
  const [imageZoom, setImageZoom] = useState(100)

  const toggleCheck = (index: number) => {
    const updated = [...checks]
    updated[index].checked = !updated[index].checked
    setChecks(updated)

    const newScore = updated.reduce((sum, check) => sum + (check.checked ? check.points : 0), 0)
    setScore(newScore)
  }

  return (
    <div className="space-y-3 md:space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 md:gap-4">
          <Badge variant="outline" className="text-sm md:text-base">
            Question {question.questionNumber} of {question.totalQuestions}
          </Badge>
          <ConfidenceIndicator score={question.confidence} />
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2 bg-transparent touch-manipulation">
            <Flag className="size-4" />
            <span className="hidden sm:inline">Flag for Review</span>
            <span className="sm:hidden">Flag</span>
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={onPrevious}
            disabled={question.questionNumber === 1}
            className="touch-manipulation bg-transparent"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={onNext}
            disabled={question.questionNumber === question.totalQuestions}
            className="touch-manipulation bg-transparent"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base md:text-lg">Student Answer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 md:space-y-4">
            <div className="relative bg-muted rounded-lg overflow-hidden">
              <Image
                src={question.studentAnswerImage || "/placeholder.svg"}
                alt="Student's handwritten answer"
                width={600}
                height={400}
                className="w-full"
                style={{ transform: `scale(${imageZoom / 100})`, transformOrigin: "top left" }}
              />
              <div className="absolute top-2 right-2 flex gap-1">
                <Button
                  variant="secondary"
                  size="icon-sm"
                  onClick={() => setImageZoom(Math.min(200, imageZoom + 25))}
                  className="touch-manipulation"
                >
                  <ZoomIn className="size-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon-sm"
                  onClick={() => setImageZoom(Math.max(50, imageZoom - 25))}
                  className="touch-manipulation"
                >
                  <ZoomOut className="size-4" />
                </Button>
              </div>
            </div>

            <div>
              <div className="text-sm font-medium mb-2 flex items-center gap-2">
                AI Extracted Text
                <Badge variant="success" className="text-xs">
                  High OCR Quality
                </Badge>
              </div>
              <div className="p-3 bg-muted rounded-lg text-xs md:text-sm leading-relaxed max-h-[200px] overflow-y-auto">
                {question.extractedText}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3 md:space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base md:text-lg">Question</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs md:text-sm leading-relaxed">{question.questionText}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base md:text-lg">Rubric Criteria</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 md:space-y-3">
                {checks.map((check, index) => (
                  <div
                    key={index}
                    onClick={() => toggleCheck(index)}
                    className={cn(
                      "flex items-start gap-2 md:gap-3 p-2 md:p-3 rounded-lg border cursor-pointer transition-colors touch-manipulation",
                      check.checked
                        ? "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800"
                        : "bg-background border-border hover:border-primary/50 active:border-primary",
                    )}
                  >
                    <div className="mt-0.5 shrink-0">
                      {check.checked ? (
                        <CheckCircle className="size-4 md:size-5 text-green-600" />
                      ) : (
                        <div className="size-4 md:size-5 rounded-full border-2 border-gray-300" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs md:text-sm">{check.criterion}</div>
                    </div>
                    <div className="font-mono text-xs md:text-sm font-semibold shrink-0">{check.points} pts</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base md:text-lg">Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 md:gap-4">
                <Input
                  type="number"
                  value={score}
                  onChange={(e) => setScore(Number(e.target.value))}
                  className="w-20 md:w-24 text-center text-xl md:text-2xl font-bold"
                  min="0"
                  max={question.maxScore}
                />
                <div className="text-xl md:text-2xl font-bold text-muted-foreground">/ {question.maxScore}</div>
                <div className="flex-1 text-right">
                  <div className="text-2xl md:text-3xl font-bold text-primary">
                    {Math.round((score / question.maxScore) * 100)}%
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base md:text-lg">Feedback</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Provide feedback for the student..."
                rows={4}
                className="text-sm resize-none"
              />
            </CardContent>
          </Card>

          <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
            <Button variant="outline" className="flex-1 gap-2 bg-transparent touch-manipulation">
              <AlertCircle className="size-4" />
              <span className="hidden sm:inline">Override Score</span>
              <span className="sm:hidden">Override</span>
            </Button>
            <Button className="flex-1 gap-2 touch-manipulation">
              <CheckCircle className="size-4" />
              <span className="hidden sm:inline">Approve & Next</span>
              <span className="sm:hidden">Approve</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
