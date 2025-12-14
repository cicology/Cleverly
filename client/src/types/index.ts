export type Topic = {
  name: string;
  subtopics: string[];
};

export type Course = {
  id: string;
  title: string;
  university: string;
  code: string;
  duration: string;
  topics: Topic[];
  status: "pending" | "processing" | "ready" | "grading";
  subject: "Calculus" | "Mechanics" | "Physics" | "Linear Algebra" | "Statistics" | "Other";
  nextTestDate?: string;
  lastOpened?: string;
  progress?: number; // for grading %
};

export type RubricRow = {
  question_number: string;
  question_text: string;
  expected_answer: string;
  marks: number;
  keywords?: string[];
};

export type Submission = {
  id: string;
  student: string;
  total: number;
  max: number;
  status: "pending" | "grading" | "graded" | "flagged";
};

export type QuestionGrade = {
  question_number: string;
  score: number;
  max: number;
  reasoning: string;
  confidence: number;
};
