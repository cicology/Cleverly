import { EmptyState } from "@/components/cleverly/empty-state"
import { BookOpen, FileText, ClipboardList } from "lucide-react"

interface EmptyCoursesProps {
  onCreateCourse: () => void
}

export function EmptyCoursesState({ onCreateCourse }: EmptyCoursesProps) {
  return (
    <EmptyState
      icon={<BookOpen className="size-16" />}
      title="No courses yet"
      description="Create your first course by uploading study materials and let AI extract the key topics."
      action={{
        label: "Create First Course",
        onClick: onCreateCourse,
      }}
    />
  )
}

interface EmptyGradersProps {
  onCreateGrader: () => void
}

export function EmptyGradersState({ onCreateGrader }: EmptyGradersProps) {
  return (
    <EmptyState
      icon={<FileText className="size-16" />}
      title="No graders configured"
      description="Set up your first grader by uploading a teacher memo to generate a grading rubric."
      action={{
        label: "Create First Grader",
        onClick: onCreateGrader,
      }}
    />
  )
}

interface EmptySubmissionsProps {
  onUploadSubmission: () => void
}

export function EmptySubmissionsState({ onUploadSubmission }: EmptySubmissionsProps) {
  return (
    <EmptyState
      icon={<ClipboardList className="size-16" />}
      title="No submissions yet"
      description="Upload handwritten test submissions to start grading with AI assistance."
      action={{
        label: "Upload Submissions",
        onClick: onUploadSubmission,
      }}
    />
  )
}
