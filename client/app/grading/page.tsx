"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AppLayout } from "@/components/layout/app-layout"
import { SubmissionsQueue } from "@/components/grading/submissions-queue"
import { QuestionReview } from "@/components/grading/question-review"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ChevronLeft, ChevronRight, List, Download } from "lucide-react"
import { useGrader, useSubmissions } from "@/hooks/useApi"

const mockQuestion = {
  questionNumber: 1,
  totalQuestions: 5,
  questionText: "Describe the process of photosynthesis and its importance to plant life.",
  studentAnswerImage: "/handwritten-essay-answer.jpg",
  extractedText:
    "Photosynthesis is the process where plants convert light energy into chemical energy. It occurs in chloroplasts containing chlorophyll. The process has two stages: light reactions and dark reactions. During light reactions, water molecules split and oxygen is released. In dark reactions, carbon dioxide combines with hydrogen to form glucose. This process is essential for plant growth and provides oxygen for other organisms.",
  aiScore: 8,
  maxScore: 10,
  confidence: 87,
  rubricChecks: [
    { criterion: "Identifies chloroplasts and chlorophyll", checked: true, points: 3 },
    { criterion: "Explains light and dark reactions", checked: true, points: 4 },
    { criterion: "Discusses glucose production", checked: false, points: 3 },
  ],
  aiFeedback:
    "Good explanation of the basic photosynthesis process. Student correctly identified chloroplasts and described both light and dark reactions. However, the discussion of glucose production could be more detailed, specifically mentioning where it occurs in the Calvin cycle.",
}

function GradingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const graderId = searchParams.get("graderId") ?? ""
  const [graderInput, setGraderInput] = useState(graderId)
  const graderQuery = useGrader(graderId || undefined)
  const submissionsQuery = useSubmissions(graderId || undefined)
  const [selectedSubmission, setSelectedSubmission] = useState("1")
  const [panelWidth, setPanelWidth] = useState(30)
  const [isMobile, setIsMobile] = useState(false)
  const [showQueueOnMobile, setShowQueueOnMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (!mobile && panelWidth < 15) {
        setPanelWidth(30)
      }
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [panelWidth])

  const totalQuestions = graderQuery.data?.rubric.length ?? 0
  const mappedSubmissions = useMemo(() => {
    return (
      submissionsQuery.data?.map((submission) => ({
        id: submission.id,
        student: submission.student_identifier,
        course: submission.grader_id,
        questionsGraded: submission.status === "graded" ? totalQuestions : 0,
        totalQuestions,
        confidence: 0,
        status:
          submission.status === "grading"
            ? ("in-progress" as const)
            : submission.status === "flagged"
              ? ("review" as const)
              : submission.status === "graded"
                ? ("completed" as const)
                : ("pending" as const),
      })) ?? []
    )
  }, [submissionsQuery.data, totalQuestions])

  const counts = useMemo(() => {
    const total = mappedSubmissions.length
    const review = mappedSubmissions.filter((submission) => submission.status === "review").length
    const done = mappedSubmissions.filter((submission) => submission.status === "completed").length
    return { total, review, done }
  }, [mappedSubmissions])

  useEffect(() => {
    if (mappedSubmissions.length > 0) {
      setSelectedSubmission(mappedSubmissions[0].id)
    }
  }, [mappedSubmissions])

  const handleLoad = () => {
    if (!graderInput.trim()) return
    router.push(`/grading?graderId=${graderInput.trim()}`)
  }

  const handleExport = async () => {
    if (!graderId) return
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"
      const response = await fetch(`${apiUrl}/graders/${graderId}/export`, {
        method: "GET",
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Export failed")
      }

      const blob = await response.blob()
      const contentDisposition = response.headers.get("Content-Disposition")
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/)
      const filename = filenameMatch ? filenameMatch[1] : `grading_results_${graderId}.xlsx`

      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("Export error:", error)
      alert("Failed to export results. Please try again.")
    }
  }

  return (
    <AppLayout>
      <div className="pb-20 md:pb-0">
        <div className="mb-4 flex flex-col sm:flex-row gap-2">
          <Input
            placeholder="Enter grader ID"
            value={graderInput}
            onChange={(event) => setGraderInput(event.target.value)}
          />
          <Button onClick={handleLoad} disabled={!graderInput.trim()}>
            Load Queue
          </Button>
          {graderId && (
            <Button variant="outline" onClick={handleExport} className="gap-2">
              <Download className="size-4" />
              Export to Excel
            </Button>
          )}
        </div>
        {submissionsQuery.isLoading && <div className="text-sm text-muted-foreground">Loading submissions...</div>}
        {submissionsQuery.isError && (
          <div className="text-sm text-destructive">
            Failed to load submissions.{" "}
            {submissionsQuery.error instanceof Error ? submissionsQuery.error.message : "Please try again."}
          </div>
        )}
        {isMobile ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Grading Queue</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowQueueOnMobile(!showQueueOnMobile)}
                className="gap-2 touch-manipulation"
              >
                <List className="size-4" />
                {showQueueOnMobile ? "Hide" : "Show"} Queue
              </Button>
            </div>

            {showQueueOnMobile && (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="cursor-pointer touch-manipulation">
                    All ({counts.total})
                  </Badge>
                  <Badge variant="warning" className="cursor-pointer touch-manipulation">
                    Review ({counts.review})
                  </Badge>
                  <Badge variant="success" className="cursor-pointer touch-manipulation">
                    Done ({counts.done})
                  </Badge>
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                  <SubmissionsQueue
                    submissions={mappedSubmissions}
                    selectedId={selectedSubmission}
                    onSelect={(id) => {
                      setSelectedSubmission(id)
                      setShowQueueOnMobile(false)
                    }}
                  />
                </div>
              </div>
            )}

            <QuestionReview question={mockQuestion} onNext={() => {}} onPrevious={() => {}} />
          </div>
        ) : (
          <div className="flex h-[calc(100vh-8rem)] gap-4">
            <div
              className="transition-all duration-300 overflow-hidden"
              style={{ width: `${panelWidth}%`, minWidth: panelWidth < 15 ? "60px" : "280px" }}
            >
              <div className="h-full flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  {panelWidth >= 15 && <h2 className="text-xl font-semibold">Submissions Queue</h2>}
                  <Button variant="ghost" size="icon-sm" onClick={() => setPanelWidth(panelWidth < 15 ? 30 : 10)}>
                    {panelWidth < 15 ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
                  </Button>
                </div>

                {panelWidth >= 15 && (
                  <>
                    <div className="flex gap-2 mb-4">
                      <Badge variant="outline" className="cursor-pointer">
                        All ({counts.total})
                      </Badge>
                      <Badge variant="warning" className="cursor-pointer">
                        Review ({counts.review})
                      </Badge>
                      <Badge variant="success" className="cursor-pointer">
                        Done ({counts.done})
                      </Badge>
                    </div>

                    <SubmissionsQueue
                      submissions={mappedSubmissions}
                      selectedId={selectedSubmission}
                      onSelect={setSelectedSubmission}
                    />
                  </>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-auto">
              <QuestionReview question={mockQuestion} onNext={() => {}} onPrevious={() => {}} />
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}

export default function GradingPage() {
  return (
    <Suspense fallback={<AppLayout><div className="text-muted-foreground">Loading...</div></AppLayout>}>
      <GradingContent />
    </Suspense>
  )
}
