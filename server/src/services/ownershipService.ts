import { supabase } from "../config/supabase.js";

export async function getCourseForUser(courseId: string, userId: string) {
  const { data, error } = await supabase
    .from("courses")
    .select("*")
    .eq("id", courseId)
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

export async function getGraderForUser(graderId: string, userId: string) {
  const { data, error } = await supabase
    .from("graders")
    .select("*, courses!inner(id, title, user_id)")
    .eq("id", graderId)
    .eq("courses.user_id", userId)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

export async function getSubmissionForUser(submissionId: string, userId: string) {
  const { data, error } = await supabase
    .from("submissions")
    .select("*")
    .eq("id", submissionId)
    .single();

  if (error || !data) {
    return null;
  }

  const grader = await getGraderForUser(data.grader_id, userId);
  if (!grader) {
    return null;
  }

  return data;
}

export async function getSubmissionGradeForUser(gradeId: string, userId: string) {
  const { data, error } = await supabase
    .from("submission_grades")
    .select("*")
    .eq("id", gradeId)
    .single();

  if (error || !data) {
    return null;
  }

  const submission = await getSubmissionForUser(data.submission_id, userId);
  if (!submission) {
    return null;
  }

  return data;
}
