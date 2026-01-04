"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AppLayout } from "@/components/layout/app-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FileUploadZone } from "@/components/courses/file-upload-zone"
import { ArrowLeft, Upload } from "lucide-react"
import { useCreateSubmissions } from "@/hooks/useApi"

export default function GradingUploadPage() {
  const router = useRouter()
  const [studentIdentifier, setStudentIdentifier] = useState("")
  const [graderId, setGraderId] = useState("")
  const [submissionFiles, setSubmissionFiles] = useState<File[]>([])
  const [errorMessage, setErrorMessage] = useState("")
  const trimmedGraderId = graderId.trim()
  const createSubmissions = useCreateSubmissions(trimmedGraderId || "pending")

  const canStart = trimmedGraderId.length > 0 && submissionFiles.length > 0

  const handleUpload = () => {
    if (!trimmedGraderId) {
      setErrorMessage("Grader ID is required to upload submissions.")
      return
    }
    if (!submissionFiles.length) {
      setErrorMessage("Please attach at least one submission file.")
      return
    }
    setErrorMessage("")
    createSubmissions.mutate(
      {
        files: submissionFiles,
        student_identifier: studentIdentifier.trim() || undefined,
      },
      {
        onSuccess: () => router.push(`/submissions?graderId=${trimmedGraderId}`),
      },
    )
  }

  return (
    <AppLayout>
      <div className="max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Upload Submissions</h1>
            <p className="text-muted-foreground">Add a new grading batch for AI review.</p>
          </div>
          <Button asChild variant="ghost" className="gap-2">
            <Link href="/grading">
              <ArrowLeft className="size-4" />
              Back to queue
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Assessment Details</CardTitle>
            <CardDescription>Give this batch a name and link it to a grader.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="student-identifier">Student identifier (optional)</Label>
              <Input
                id="student-identifier"
                placeholder="Student ID or name"
                value={studentIdentifier}
                onChange={(event) => setStudentIdentifier(event.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="grader-id">Grader ID</Label>
              <Input
                id="grader-id"
                placeholder="grader_123"
                value={graderId}
                onChange={(event) => setGraderId(event.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Submission Files</CardTitle>
            <CardDescription>Upload student submissions or scanned answer scripts.</CardDescription>
          </CardHeader>
          <CardContent>
            <FileUploadZone files={submissionFiles} onFilesChange={setSubmissionFiles} />
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3">
          <Button variant="outline" disabled>
            Save as Draft
          </Button>
          <Button disabled={!canStart || createSubmissions.isPending} className="gap-2" onClick={handleUpload}>
            <Upload className="size-4" />
            {createSubmissions.isPending ? "Uploading..." : "Start Grading"}
          </Button>
        </div>
        {errorMessage && <div className="text-sm text-destructive">{errorMessage}</div>}
        {createSubmissions.isError && (
          <div className="text-sm text-destructive">
            Upload failed.{" "}
            {createSubmissions.error instanceof Error ? createSubmissions.error.message : "Please try again."}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
