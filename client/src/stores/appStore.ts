import { create } from "zustand";
import type { Course, RubricRow, Submission, QuestionGrade, Topic } from "../types";
import { nanoid } from "../utils/nanoid";

type AppState = {
  courses: Course[];
  rubric: RubricRow[];
  submissions: Submission[];
  grades: Record<string, QuestionGrade[]>;
  addCourse: (course: Omit<Course, "id" | "status" | "progress" | "lastOpened" | "subject">) => void;
  upsertRubric: (rows: RubricRow[]) => void;
  addSubmission: (student: string) => void;
  overrideGrade: (submissionId: string, question: string, score: number) => void;
};

const defaultTopics: Topic[] = [
  { name: "Calculus Basics", subtopics: ["Limits", "Derivatives", "Integrals"] },
  { name: "Mechanics", subtopics: ["Kinematics", "Newton's Laws"] }
];

const sampleRubric: RubricRow[] = [
  {
    question_number: "1.a",
    question_text: "Differentiate f(x) = 2x^2 + 3x",
    expected_answer: "f'(x) = 4x + 3",
    marks: 5,
    keywords: ["derivative", "power rule"]
  },
  {
    question_number: "1.b",
    question_text: "Evaluate f'(2)",
    expected_answer: "11",
    marks: 3,
    keywords: ["substitution"]
  },
  {
    question_number: "2",
    question_text: "Prove the limit definition of derivative for sin(x)",
    expected_answer: "Use squeeze theorem with sin(h)/h",
    marks: 10,
    keywords: ["limit", "sine", "squeeze"]
  }
];

export const useAppStore = create<AppState>((set) => ({
  courses: [
    {
      id: "demo-course",
      title: "Calculus Midterm 1",
      university: "Cleverly University",
      code: "MATH101",
      duration: "Semester",
      topics: defaultTopics,
      status: "grading",
      subject: "Calculus",
      nextTestDate: "2025-04-12",
      lastOpened: "2h ago",
      progress: 0.75
    },
    {
      id: "mech-course",
      title: "Mechanics Quiz 1",
      university: "Cleverly University",
      code: "PHYS102",
      duration: "Quarter",
      topics: [{ name: "Kinematics", subtopics: ["Velocity", "Acceleration"] }],
      status: "ready",
      subject: "Mechanics",
      nextTestDate: "2025-04-18",
      lastOpened: "1d ago",
      progress: 0.0
    },
    {
      id: "lin-course",
      title: "Linear Algebra Test",
      university: "Cleverly University",
      code: "MATH201",
      duration: "Semester",
      topics: [{ name: "Vectors", subtopics: ["Span", "Basis"] }],
      status: "processing",
      subject: "Linear Algebra",
      nextTestDate: "2025-05-02",
      lastOpened: "3d ago",
      progress: 0.0
    }
  ],
  rubric: sampleRubric,
  submissions: [
    { id: "sub-1", student: "STU001 - John Smith", total: 78, max: 100, status: "graded" },
    { id: "sub-2", student: "STU002 - Priya Sen", total: 0, max: 100, status: "pending" }
  ],
  grades: {
    "sub-1": [
      { question_number: "1.a", score: 4, max: 5, reasoning: "Correct method, minor algebra slip", confidence: 0.85 },
      { question_number: "1.b", score: 3, max: 3, reasoning: "Exact value provided", confidence: 0.93 },
      { question_number: "2", score: 8, max: 10, reasoning: "Good structure, missing final bound", confidence: 0.78 }
    ]
  },
  addCourse: (course) =>
    set((state) => ({
      courses: [
        ...state.courses,
        {
          ...course,
          id: nanoid(),
          status: "processing" as const,
          lastOpened: "just now",
          progress: 0,
          subject: "Other"
        }
      ]
    })),
  upsertRubric: (rows) =>
    set(() => ({
      rubric: rows
    })),
  addSubmission: (student) =>
    set((state) => ({
      submissions: [
        ...state.submissions,
        { id: nanoid(), student, total: 0, max: 100, status: "pending" as const }
      ]
    })),
  overrideGrade: (submissionId, question, score) =>
    set((state) => {
      const existing = state.grades[submissionId] ?? [];
      const updated = existing.map((g) => (g.question_number === question ? { ...g, score } : g));
      return { grades: { ...state.grades, [submissionId]: updated } };
    })
}));
