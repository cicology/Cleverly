// Cleverly Design System - Design Tokens

export const colors = {
  primary: {
    50: "#eff6ff",
    100: "#dbeafe",
    200: "#bfdbfe",
    300: "#93c5fd",
    400: "#60a5fa",
    500: "#3b82f6",
    600: "#2563eb",
    700: "#1d4ed8",
    800: "#1e40af",
    900: "#1e3a8a",
  },
  success: {
    50: "#ecfdf5",
    100: "#d1fae5",
    200: "#a7f3d0",
    300: "#6ee7b7",
    400: "#34d399",
    500: "#10b981",
    600: "#059669",
    700: "#047857",
    800: "#065f46",
    900: "#064e3b",
  },
  warning: {
    50: "#fffbeb",
    100: "#fef3c7",
    200: "#fde68a",
    300: "#fcd34d",
    400: "#fbbf24",
    500: "#f59e0b",
    600: "#d97706",
    700: "#b45309",
    800: "#92400e",
    900: "#78350f",
  },
  error: {
    50: "#fef2f2",
    100: "#fee2e2",
    200: "#fecaca",
    300: "#fca5a5",
    400: "#f87171",
    500: "#ef4444",
    600: "#dc2626",
    700: "#b91c1c",
    800: "#991b1b",
    900: "#7f1d1d",
  },
  subjects: {
    math: "#8b5cf6",
    science: "#06b6d4",
    english: "#ec4899",
    history: "#f97316",
    arts: "#14b8a6",
  },
} as const

// Confidence score thresholds
export const confidenceThresholds = {
  high: 85,
  medium: 70,
  low: 0,
} as const

export const getConfidenceColor = (score: number) => {
  if (score >= confidenceThresholds.high) return "success"
  if (score >= confidenceThresholds.medium) return "warning"
  return "error"
}

export const getConfidenceBgClass = (score: number) => {
  if (score >= confidenceThresholds.high) return "bg-green-50 text-green-700 border-green-200"
  if (score >= confidenceThresholds.medium) return "bg-yellow-50 text-yellow-700 border-yellow-200"
  return "bg-red-50 text-red-700 border-red-200"
}

export const formatConfidence = (score: number) => `${Math.round(score)}%`

// Subject color mapping
export const subjectColors: Record<string, string> = {
  Math: colors.subjects.math,
  Science: colors.subjects.science,
  English: colors.subjects.english,
  History: colors.subjects.history,
  Arts: colors.subjects.arts,
}

export const getSubjectColor = (subject: string) => {
  return subjectColors[subject] || colors.primary[600]
}
