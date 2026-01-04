import { api } from "@/lib/api"

export interface BackendCourse {
  id: string
  title: string
  description?: string
  topics?: string[]
  user_id: string
  created_at: string
  updated_at: string
}

export interface CourseFile {
  id: string
  course_id: string
  file_name: string
  file_type: string
  file_path: string
  status: string
  created_at: string
}

export interface BackendGrader {
  id: string
  course_id: string
  title: string
  total_marks?: number
  test_file_path?: string
  memo_file_path?: string
  status: string
  created_at: string
  updated_at: string
}

export interface BackendRubric {
  id: string
  grader_id: string
  question_number: string
  question_text: string
  expected_answer: string
  marks: number
  keywords?: string[]
  order_index: number
}

export interface RubricRow {
  question_number: string
  question_text: string
  expected_answer: string
  marks: number
  keywords?: string[]
}

export interface BackendSubmission {
  id: string
  grader_id: string
  student_identifier: string
  file_path: string
  status: "pending" | "grading" | "graded" | "flagged"
  total_score?: number
  max_possible_score?: number
  created_at: string
  updated_at: string
}

export interface BackendSubmissionGrade {
  id: string
  submission_id: string
  question_number: string
  marks_awarded: number
  max_marks: number
  feedback?: string
  confidence_score?: number
  is_overridden: boolean
  override_reason?: string
}

export interface GraderAnalytics {
  graded_count: number
  pending_count: number
  average_percentage: number
}

export interface DashboardMetrics {
  active_courses: number
  graded_submissions: number
  avg_confidence: number
  time_saved_hours: number
}

export interface RecentSubmission {
  submission_id: string
  student_identifier: string
  course_title: string
  score_percent: number | null
  confidence_avg: number
  submitted_at: string
  status: "pending" | "grading" | "graded" | "flagged"
}

export interface UserProfile {
  id: string
  email: string | null
  full_name: string | null
  avatar_url: string | null
}

export interface UserSettings {
  notifications_email: boolean
  notifications_grading_complete: boolean
  theme: "light" | "dark" | "system"
}

export interface SettingsResponse {
  settings: UserSettings
  api_key_configured: boolean
  api_key_last4?: string
}

export const coursesApi = {
  getAll: async () => {
    const response = await api.get<{ courses: BackendCourse[] }>("/courses")
    return response.data.courses
  },

  create: async (data: {
    title: string
    description?: string
    topics?: string[]
    study_guide?: File[]
    textbook?: File[]
    extra_content?: File[]
  }) => {
    const formData = new FormData()
    formData.append("title", data.title)
    if (data.description) formData.append("description", data.description)
    if (data.topics) formData.append("topics", JSON.stringify(data.topics))

    data.study_guide?.forEach((file) => formData.append("study_guide", file))
    data.textbook?.forEach((file) => formData.append("textbook", file))
    data.extra_content?.forEach((file) => formData.append("extra_content", file))

    const response = await api.post<{ course: BackendCourse }>("/courses", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    return response.data.course
  },

  getFiles: async (courseId: string) => {
    const response = await api.get<{ files: CourseFile[] }>(`/courses/${courseId}/files`)
    return response.data.files
  },
}

export const gradersApi = {
  get: async (graderId: string) => {
    const response = await api.get<{ grader: BackendGrader; rubric: BackendRubric[] }>(`/graders/${graderId}`)
    return response.data
  },

  create: async (data: {
    course_id: string
    title: string
    total_marks?: number
    test_file?: File
    memo_file?: File
  }) => {
    const formData = new FormData()
    formData.append("course_id", data.course_id)
    formData.append("title", data.title)
    if (data.total_marks) formData.append("total_marks", data.total_marks.toString())
    if (data.test_file) formData.append("test_file", data.test_file)
    if (data.memo_file) formData.append("memo_file", data.memo_file)

    const response = await api.post<{ grader_id: string; status: string }>("/graders", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    return response.data
  },

  updateRubric: async (graderId: string, rubric: RubricRow[]) => {
    const response = await api.put<{ updated: boolean }>(`/graders/${graderId}/rubric`, rubric)
    return response.data
  },
}

export const submissionsApi = {
  getByGrader: async (graderId: string) => {
    const response = await api.get<{ submissions: BackendSubmission[] }>(`/graders/${graderId}/submissions`)
    return response.data.submissions
  },

  create: async (graderId: string, data: { files: File[]; student_identifier?: string }) => {
    const formData = new FormData()
    data.files.forEach((file) => formData.append("files", file))
    if (data.student_identifier) formData.append("student_identifier", data.student_identifier)

    const response = await api.post<{ submissions: BackendSubmission[] }>(
      `/graders/${graderId}/submissions`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    )
    return response.data.submissions
  },

  get: async (submissionId: string) => {
    const response = await api.get<{ submission: BackendSubmission; grades: BackendSubmissionGrade[] }>(
      `/submissions/${submissionId}`,
    )
    return response.data
  },

  gradeAll: async (graderId: string) => {
    const response = await api.post<{ queued: number }>(`/graders/${graderId}/grade-all`)
    return response.data
  },

  updateGrade: async (gradeId: string, data: { marks_awarded: number; override_reason?: string }) => {
    const response = await api.patch<{ updated: boolean }>(`/submission-grades/${gradeId}`, data)
    return response.data
  },
}

export const analyticsApi = {
  getGraderAnalytics: async (graderId: string) => {
    const response = await api.get<{ stats: GraderAnalytics | null }>(`/graders/${graderId}/analytics`)
    return response.data.stats
  },
}

export const exportApi = {
  exportGraderResults: async (graderId: string): Promise<Blob> => {
    const response = await api.get(`/graders/${graderId}/export`, {
      responseType: "blob",
    })
    return response.data
  },
}

export const dashboardApi = {
  getMetrics: async () => {
    const response = await api.get<DashboardMetrics>("/dashboard/metrics")
    return response.data
  },
  getRecentSubmissions: async (limit?: number) => {
    const params = limit ? { params: { limit } } : undefined
    const response = await api.get<{ submissions: RecentSubmission[] }>("/dashboard/recent-submissions", params)
    return response.data.submissions
  },
}

export const profileApi = {
  get: async () => {
    const response = await api.get<{ profile: UserProfile }>("/profile")
    return response.data.profile
  },
  update: async (payload: Partial<Pick<UserProfile, "full_name" | "avatar_url" | "email">>) => {
    const response = await api.put<{ profile: UserProfile }>("/profile", payload)
    return response.data.profile
  },
}

export const settingsApi = {
  get: async () => {
    const response = await api.get<SettingsResponse>("/settings")
    return response.data
  },
  update: async (payload: Partial<UserSettings> & { gemini_api_key?: string }) => {
    const response = await api.put<SettingsResponse>("/settings", payload)
    return response.data
  },
}
