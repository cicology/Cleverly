"use client"

import { useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { AppLayout } from "@/components/layout/app-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, FileText } from "lucide-react"
import { useCourseFiles, useCourses } from "@/hooks/useApi"

const formatDate = (value: string | undefined) => {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString()
}

export default function CourseDetailPage() {
  const router = useRouter()
  const params = useParams()
  const courseId = typeof params.id === "string" ? params.id : params.id?.[0]
  const coursesQuery = useCourses()
  const filesQuery = useCourseFiles(courseId)

  const course = useMemo(
    () => coursesQuery.data?.find((item) => item.id === courseId),
    [coursesQuery.data, courseId],
  )

  return (
    <AppLayout>
      <div className="max-w-4xl space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon-sm" onClick={() => router.back()}>
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">{course?.title ?? "Course"}</h1>
            <p className="text-muted-foreground">{course?.description ?? "Course details from the API."}</p>
          </div>
        </div>

        {coursesQuery.isLoading && <div className="text-sm text-muted-foreground">Loading course...</div>}
        {coursesQuery.isError && (
          <div className="text-sm text-destructive">
            Failed to load course.{" "}
            {coursesQuery.error instanceof Error ? coursesQuery.error.message : "Please try again."}
          </div>
        )}

        {!course && !coursesQuery.isLoading && !coursesQuery.isError && (
          <div className="text-sm text-muted-foreground">Course not found.</div>
        )}

        {course && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Course Overview</CardTitle>
                <CardDescription>Stored metadata from Supabase.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-muted-foreground">Course ID: {course.id}</div>
                <div className="text-sm text-muted-foreground">Updated: {formatDate(course.updated_at)}</div>
                <div className="flex flex-wrap gap-2">
                  {(course.topics ?? []).length === 0 && (
                    <Badge variant="outline">No topics yet</Badge>
                  )}
                  {(course.topics ?? []).map((topic) => (
                    <Badge key={topic} variant="secondary">
                      {topic}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Materials</CardTitle>
                <CardDescription>Files uploaded for this course.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {filesQuery.isLoading && <div className="text-sm text-muted-foreground">Loading files...</div>}
                {filesQuery.isError && (
                  <div className="text-sm text-destructive">
                    Failed to load files.{" "}
                    {filesQuery.error instanceof Error ? filesQuery.error.message : "Please try again."}
                  </div>
                )}
                {(filesQuery.data ?? []).map((file) => (
                  <div key={file.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <FileText className="size-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{file.file_name}</div>
                        <div className="text-xs text-muted-foreground">{file.file_type}</div>
                      </div>
                    </div>
                    <Badge variant={file.status === "embedded" ? "success" : "outline"}>{file.status}</Badge>
                  </div>
                ))}
                {(filesQuery.data ?? []).length === 0 && !filesQuery.isLoading && (
                  <div className="text-sm text-muted-foreground">No materials uploaded yet.</div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AppLayout>
  )
}
