"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AppLayout } from "@/components/layout/app-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileUploadZone } from "@/components/courses/file-upload-zone"
import { TopicEditor } from "@/components/courses/topic-editor"
import { ArrowLeft, ArrowRight, Check } from "lucide-react"
import { useCreateCourse } from "@/hooks/useApi"

const steps = ["Course Basics", "Upload Materials", "Extract Topics", "Review & Confirm"]

export default function CreateCoursePage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [courseName, setCourseName] = useState("")
  const [subject, setSubject] = useState("")
  const [description, setDescription] = useState("")
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [extractedTopics, setExtractedTopics] = useState<string[]>([])
  const createCourse = useCreateCourse()

  const handleNext = () => {
    if (currentStep === 1 && extractedTopics.length === 0) {
      setExtractedTopics(["Chemical Bonding", "Molecular Structures", "Organic Chemistry", "Reaction Mechanisms"])
    }
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = () => {
    if (!courseName.trim()) return
    const topicsPayload =
      extractedTopics.length > 0 ? extractedTopics : subject.trim() ? [subject.trim()] : undefined

    createCourse.mutate(
      {
        title: courseName.trim(),
        description: description.trim() || undefined,
        topics: topicsPayload,
        extra_content: uploadedFiles.length ? uploadedFiles : undefined,
      },
      {
        onSuccess: () => router.push("/courses"),
      },
    )
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-4 md:space-y-6 pb-20 md:pb-0">
        <div className="flex items-center gap-3 md:gap-4">
          <Button variant="ghost" size="icon-sm" onClick={() => router.back()} className="touch-manipulation shrink-0">
            <ArrowLeft className="size-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1 md:mb-2">Create New Course</h1>
            <p className="text-sm md:text-base text-muted-foreground hidden sm:block">
              Follow the steps to set up your course with AI assistance.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-6 md:mb-8">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center flex-1">
              <div className="flex items-center gap-3">
                <div
                  className={`flex items-center justify-center size-8 sm:size-10 rounded-full font-semibold transition-all text-sm sm:text-base ${
                    index < currentStep
                      ? "bg-green-500 text-white"
                      : index === currentStep
                        ? "bg-primary text-white"
                        : "bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                  }`}
                >
                  {index < currentStep ? <Check className="size-4 sm:size-5" /> : index + 1}
                </div>
                <span
                  className={`text-xs sm:text-sm font-medium ${index === currentStep ? "text-foreground" : "text-muted-foreground"}`}
                >
                  {step}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className="hidden sm:block flex-1 h-0.5 bg-gray-200 dark:bg-gray-800 mx-4" />
              )}
            </div>
          ))}
        </div>

        {currentStep === 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Course Information</CardTitle>
              <CardDescription>Enter the basic details about your course.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Course Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Advanced Chemistry"
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  placeholder="e.g., Science, Math, English"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="Brief description of the course"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Upload Learning Materials</CardTitle>
              <CardDescription>Upload textbooks, study guides, or supplemental materials.</CardDescription>
            </CardHeader>
            <CardContent>
              <FileUploadZone files={uploadedFiles} onFilesChange={setUploadedFiles} />
            </CardContent>
          </Card>
        )}

        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>AI-Extracted Topics</CardTitle>
              <CardDescription>Review and edit the topics extracted from your materials.</CardDescription>
            </CardHeader>
            <CardContent>
              <TopicEditor topics={extractedTopics} onTopicsChange={setExtractedTopics} />
            </CardContent>
          </Card>
        )}

        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Review & Confirm</CardTitle>
              <CardDescription>Review all course details before creating.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Course Name</div>
                <div className="text-lg font-semibold">{courseName}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Subject</div>
                <div className="text-lg font-semibold">{subject}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Description</div>
                <div className="text-lg">{description}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Materials</div>
                <div className="text-lg">{uploadedFiles.length} files uploaded</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Topics</div>
                <div className="flex flex-wrap gap-2">
                  {extractedTopics.map((topic, index) => (
                    <span key={index} className="px-3 py-1 bg-primary/10 text-primary rounded-md text-sm">
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center sm:justify-between gap-3">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0}
            className="gap-2 bg-transparent touch-manipulation"
          >
            <ArrowLeft className="size-4" />
            Back
          </Button>

          {currentStep < steps.length - 1 ? (
            <Button onClick={handleNext} className="gap-2 touch-manipulation">
              Next
              <ArrowRight className="size-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} className="gap-2 touch-manipulation" disabled={createCourse.isPending}>
              <Check className="size-4" />
              {createCourse.isPending ? "Creating..." : "Create Course"}
            </Button>
          )}
        </div>
        {createCourse.isError && (
          <div className="text-sm text-destructive">
            Failed to create course.{" "}
            {createCourse.error instanceof Error ? createCourse.error.message : "Please try again."}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
