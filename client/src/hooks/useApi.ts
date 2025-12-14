import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { UseQueryOptions } from "@tanstack/react-query";
import {
  coursesApi,
  gradersApi,
  submissionsApi,
  analyticsApi,
  type BackendCourse,
  type BackendGrader,
  type BackendRubric,
  type BackendSubmission,
  type GraderAnalytics
} from "../services/apiService";
import type { RubricRow } from "../types";

// Query Keys
export const queryKeys = {
  courses: ["courses"] as const,
  grader: (id: string) => ["graders", id] as const,
  submissions: (graderId: string) => ["submissions", graderId] as const,
  submission: (id: string) => ["submission", id] as const,
  analytics: (graderId: string) => ["analytics", graderId] as const
};

// Course Hooks
export function useCourses(options?: Omit<UseQueryOptions<BackendCourse[]>, "queryKey" | "queryFn">) {
  return useQuery({
    queryKey: queryKeys.courses,
    queryFn: coursesApi.getAll,
    ...options
  });
}

export function useCreateCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: coursesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.courses });
    }
  });
}

// Grader Hooks
export function useGrader(graderId: string | undefined, options?: Omit<UseQueryOptions<{ grader: BackendGrader; rubric: BackendRubric[] }>, "queryKey" | "queryFn">) {
  return useQuery({
    queryKey: graderId ? queryKeys.grader(graderId) : ["graders", "null"],
    queryFn: () => {
      if (!graderId) throw new Error("Grader ID is required");
      return gradersApi.get(graderId);
    },
    enabled: !!graderId,
    ...options
  });
}

export function useCreateGrader() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: gradersApi.create,
    onSuccess: () => {
      // Invalidate courses to update grader counts
      queryClient.invalidateQueries({ queryKey: queryKeys.courses });
    }
  });
}

export function useUpdateRubric(graderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (rubric: RubricRow[]) => gradersApi.updateRubric(graderId, rubric),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.grader(graderId) });
    }
  });
}

// Submission Hooks
export function useSubmissions(
  graderId: string | undefined,
  options?: Omit<UseQueryOptions<BackendSubmission[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: graderId ? queryKeys.submissions(graderId) : ["submissions", "null"],
    queryFn: () => {
      if (!graderId) throw new Error("Grader ID is required");
      return submissionsApi.getByGrader(graderId);
    },
    enabled: !!graderId,
    ...options
  });
}

export function useCreateSubmissions(graderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { files: File[]; student_identifier?: string }) => submissionsApi.create(graderId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.submissions(graderId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics(graderId) });
    }
  });
}

export function useSubmission(submissionId: string | undefined) {
  return useQuery({
    queryKey: submissionId ? queryKeys.submission(submissionId) : ["submission", "null"],
    queryFn: () => {
      if (!submissionId) throw new Error("Submission ID is required");
      return submissionsApi.get(submissionId);
    },
    enabled: !!submissionId
  });
}

export function useGradeAll(graderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => submissionsApi.gradeAll(graderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.submissions(graderId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics(graderId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.grader(graderId) });
    }
  });
}

export function useUpdateGrade() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ gradeId, data }: { gradeId: string; data: { marks_awarded: number; override_reason?: string } }) =>
      submissionsApi.updateGrade(gradeId, data),
    onSuccess: () => {
      // Invalidate all submission queries since we don't know which submission this grade belongs to
      queryClient.invalidateQueries({ queryKey: ["submissions"] });
      queryClient.invalidateQueries({ queryKey: ["submission"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
    }
  });
}

// Analytics Hooks
export function useGraderAnalytics(
  graderId: string | undefined,
  options?: Omit<UseQueryOptions<GraderAnalytics | null>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: graderId ? queryKeys.analytics(graderId) : ["analytics", "null"],
    queryFn: () => {
      if (!graderId) throw new Error("Grader ID is required");
      return analyticsApi.getGraderAnalytics(graderId);
    },
    enabled: !!graderId,
    ...options
  });
}
