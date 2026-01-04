"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AppLayout } from "@/components/layout/app-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft } from "lucide-react"
import { useCreateGrader, useCourses } from "@/hooks/useApi"

export default function CreateGraderPage() {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [courseId, setCourseId] = useState("")
  const [totalMarks, setTotalMarks] = useState("")
  const [testFile, setTestFile] = useState<File | null>(null)
  const [memoFile, setMemoFile] = useState<File | null>(null)
  const createGrader = useCreateGrader()
  const coursesQuery = useCourses()

  const courses = coursesQuery.data ?? []

  const handleSubmit = () => {
    if (!title.trim() || !courseId.trim()) return
    const marks = totalMarks.trim() ? Number(totalMarks) : undefined

    createGrader.mutate(
      {
        course_id: courseId.trim(),
        title: title.trim(),
        total_marks: Number.isFinite(marks) ? marks : undefined,
        test_file: testFile ?? undefined,
        memo_file: memoFile ?? undefined,
      },
      {
        onSuccess: (data) => router.push(`/graders/${data.grader_id}`),
      },
    )
  }

  return (
    <AppLayout>
      <div className="max-w-3xl space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon-sm" onClick={() => router.back()}>
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Create Grader</h1>
            <p className="text-muted-foreground">Upload a test and memo to generate the rubric.</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Grader Details</CardTitle>
            <CardDescription>Connect this grader to a course and upload materials.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {courses.length > 0 && (
              <div>
                <Label htmlFor="course-select">Course</Label>
                <select
                  id="course-select"
                  className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={courseId}
                  onChange={(event) => setCourseId(event.target.value)}
                >
                  <option value="">Select a course</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title} ({course.id.slice(0, 8)}…)
                    </option>
                  ))}
                </select>
              </div>
            )}
            {coursesQuery.isLoading && <div className="text-xs text-muted-foreground">Loading courses...</div>}
            {coursesQuery.isError && (
              <div className="text-xs text-destructive">
                Failed to load courses.{" "}
                {coursesQuery.error instanceof Error ? coursesQuery.error.message : "Enter a course ID manually."}
              </div>
            )}

            <div>
              <Label htmlFor="course-id">Course ID</Label>
              <Input
                id="course-id"
                placeholder="Course UUID"
                value={courseId}
                onChange={(event) => setCourseId(event.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="title">Grader Title</Label>
              <Input
                id="title"
                placeholder="e.g., Chemistry Test 3"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="total-marks">Total Marks (optional)</Label>
              <Input
                id="total-marks"
                type="number"
                placeholder="100"
                value={totalMarks}
                onChange={(event) => setTotalMarks(event.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="test-file">Test File (optional)</Label>
              <Input
                id="test-file"
                type="file"
                onChange={(event) => setTestFile(event.target.files?.[0] ?? null)}
              />
            </div>
            <div>
              <Label htmlFor="memo-file">Memo File (optional)</Label>
              <Input
                id="memo-file"
                type="file"
                onChange={(event) => setMemoFile(event.target.files?.[0] ?? null)}
              />
            </div>
            <Button
              onClick={handleSubmit}
              disabled={!title.trim() || !courseId.trim() || createGrader.isPending}
            >
              {createGrader.isPending ? "Creating..." : "Create Grader"}
            </Button>
            {createGrader.isError && (
              <div className="text-sm text-destructive">
                Failed to create grader.{" "}
                {createGrader.error instanceof Error ? createGrader.error.message : "Please try again."}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
