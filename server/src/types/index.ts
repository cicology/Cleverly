export interface AuthUser {
  id: string;
  email?: string;
}

export interface CoursePayload {
  title: string;
  description?: string;
  topics?: string[];
}

export interface GraderPayload {
  course_id: string;
  title: string;
  total_marks?: number;
}

export interface RubricItem {
  id?: string;
  question_number: string;
  question_text?: string;
  expected_answer: string;
  keywords?: string[];
  max_marks: number;
  order_index?: number;
}

export interface SubmissionPayload {
  student_identifier: string;
}
