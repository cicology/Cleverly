"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type { UseQueryOptions } from "@tanstack/react-query"
import {
  coursesApi,
  gradersApi,
  submissionsApi,
  analyticsApi,
  dashboardApi,
  profileApi,
  settingsApi,
  type BackendCourse,
  type BackendGrader,
  type BackendRubric,
  type BackendSubmission,
  type GraderAnalytics,
  type DashboardMetrics,
  type RecentSubmission,
  type UserProfile,
  type SettingsResponse,
  type UserSettings,
  type RubricRow,
  type CourseFile,
} from "@/services/apiService"
import type { BackendSubmissionGrade } from "@/services/apiService"

export const queryKeys = {
  courses: ["courses"] as const,
  courseFiles: (id: string) => ["courses", id, "files"] as const,
  grader: (id: string) => ["graders", id] as const,
  submissions: (graderId: string) => ["submissions", graderId] as const,
  submission: (id: string) => ["submission", id] as const,
  analytics: (graderId: string) => ["analytics", graderId] as const,
}

export function useCourses(options?: Omit<UseQueryOptions<BackendCourse[]>, "queryKey" | "queryFn">) {
  return useQuery({
    queryKey: queryKeys.courses,
    queryFn: coursesApi.getAll,
    ...options,
  })
}

export function useCreateCourse() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: coursesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.courses })
    },
  })
}

export function useCourseFiles(
  courseId: string | undefined,
  options?: Omit<UseQueryOptions<CourseFile[]>, "queryKey" | "queryFn">,
) {
  return useQuery({
    queryKey: courseId ? queryKeys.courseFiles(courseId) : ["courses", "files", "null"],
    queryFn: () => {
      if (!courseId) throw new Error("Course ID is required")
      return coursesApi.getFiles(courseId)
    },
    enabled: !!courseId,
    ...options,
  })
}

export function useGrader(
  graderId: string | undefined,
  options?: Omit<UseQueryOptions<{ grader: BackendGrader; rubric: BackendRubric[] }>, "queryKey" | "queryFn">,
) {
  return useQuery({
    queryKey: graderId ? queryKeys.grader(graderId) : ["graders", "null"],
    queryFn: () => {
      if (!graderId) throw new Error("Grader ID is required")
      return gradersApi.get(graderId)
    },
    enabled: !!graderId,
    ...options,
  })
}

export function useCreateGrader() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: gradersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.courses })
    },
  })
}

export function useUpdateRubric(graderId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (rubric: RubricRow[]) => gradersApi.updateRubric(graderId, rubric),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.grader(graderId) })
    },
  })
}

export function useSubmissions(
  graderId: string | undefined,
  options?: Omit<UseQueryOptions<BackendSubmission[]>, "queryKey" | "queryFn">,
) {
  return useQuery({
    queryKey: graderId ? queryKeys.submissions(graderId) : ["submissions", "null"],
    queryFn: () => {
      if (!graderId) throw new Error("Grader ID is required")
      return submissionsApi.getByGrader(graderId)
    },
    enabled: !!graderId,
    ...options,
  })
}

export function useCreateSubmissions(graderId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { files: File[]; student_identifier?: string }) => submissionsApi.create(graderId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.submissions(graderId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics(graderId) })
    },
  })
}

export function useSubmission(submissionId: string | undefined) {
  return useQuery({
    queryKey: submissionId ? queryKeys.submission(submissionId) : ["submission", "null"],
    queryFn: () => {
      if (!submissionId) throw new Error("Submission ID is required")
      return submissionsApi.get(submissionId)
    },
    enabled: !!submissionId,
  })
}

export function useGradeAll(graderId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => submissionsApi.gradeAll(graderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.submissions(graderId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics(graderId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.grader(graderId) })
    },
  })
}

export function useUpdateGrade() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ gradeId, data }: { gradeId: string; data: { marks_awarded: number; override_reason?: string } }) =>
      submissionsApi.updateGrade(gradeId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["submissions"] })
      queryClient.invalidateQueries({ queryKey: ["submission"] })
      queryClient.invalidateQueries({ queryKey: ["analytics"] })
    },
  })
}

export function useGraderAnalytics(
  graderId: string | undefined,
  options?: Omit<UseQueryOptions<GraderAnalytics | null>, "queryKey" | "queryFn">,
) {
  return useQuery({
    queryKey: graderId ? queryKeys.analytics(graderId) : ["analytics", "null"],
    queryFn: () => {
      if (!graderId) throw new Error("Grader ID is required")
      return analyticsApi.getGraderAnalytics(graderId)
    },
    enabled: !!graderId,
    ...options,
  })
}

export function useDashboardMetrics(options?: Omit<UseQueryOptions<DashboardMetrics>, "queryKey" | "queryFn">) {
  return useQuery({
    queryKey: ["dashboard", "metrics"],
    queryFn: dashboardApi.getMetrics,
    ...options,
  })
}

export function useRecentSubmissions(
  limit?: number,
  options?: Omit<UseQueryOptions<RecentSubmission[]>, "queryKey" | "queryFn">,
) {
  return useQuery({
    queryKey: ["dashboard", "recent", limit ?? "default"],
    queryFn: () => dashboardApi.getRecentSubmissions(limit),
    ...options,
  })
}

export function useProfile(options?: Omit<UseQueryOptions<UserProfile>, "queryKey" | "queryFn">) {
  return useQuery({
    queryKey: ["profile"],
    queryFn: profileApi.get,
    ...options,
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: profileApi.update,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] })
    },
  })
}

export function useSettings(options?: Omit<UseQueryOptions<SettingsResponse>, "queryKey" | "queryFn">) {
  return useQuery({
    queryKey: ["settings"],
    queryFn: settingsApi.get,
    ...options,
  })
}

export function useUpdateSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: Partial<UserSettings> & { gemini_api_key?: string }) => settingsApi.update(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] })
    },
  })
}

export type { BackendSubmissionGrade }
