import { Router } from "express";
import { requireAuth, AuthedRequest } from "../middleware/auth.js";
import { supabase } from "../config/supabase.js";
import { env } from "../config/env.js";

const router = Router();

function round(value: number, decimals = 2) {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

async function fetchUserCourseIds(userId: string) {
  const { data, error } = await supabase
    .from("courses")
    .select("id, title")
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

async function fetchGraders(courseIds: string[]) {
  if (courseIds.length === 0) return [];
  const { data, error } = await supabase.from("graders").select("id, course_id").in("course_id", courseIds);

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

router.get("/dashboard/metrics", requireAuth, async (req: AuthedRequest, res) => {
  try {
    const courses = await fetchUserCourseIds(req.user!.id);
    if (courses.length === 0) {
      return res.json({
        active_courses: 0,
        graded_submissions: 0,
        avg_confidence: 0,
        time_saved_hours: 0
      });
    }

    const graders = await fetchGraders(courses.map((course) => course.id));
    if (graders.length === 0) {
      return res.json({
        active_courses: courses.length,
        graded_submissions: 0,
        avg_confidence: 0,
        time_saved_hours: 0
      });
    }

    const graderIds = graders.map((grader) => grader.id);
    const { data: submissions, error: submissionsError } = await supabase
      .from("submissions")
      .select("id, status")
      .in("grader_id", graderIds);

    if (submissionsError) {
      return res.status(500).json({ error: submissionsError.message });
    }

    const gradedCount = (submissions ?? []).filter((submission) => submission.status === "graded").length;
    const submissionIds = (submissions ?? []).map((submission) => submission.id);

    let avgConfidence = 0;
    if (submissionIds.length > 0) {
      const { data: grades, error: gradesError } = await supabase
        .from("submission_grades")
        .select("confidence_score")
        .in("submission_id", submissionIds);

      if (!gradesError && grades) {
        const confidenceScores = grades
          .map((grade) => grade.confidence_score)
          .filter((value): value is number => typeof value === "number");
        if (confidenceScores.length > 0) {
          avgConfidence =
            confidenceScores.reduce((sum, score) => sum + score, 0) / confidenceScores.length;
        }
      }
    }

    const timeSavedHours =
      (gradedCount * env.dashboardMinutesSavedPerSubmission) / 60;

    return res.json({
      active_courses: courses.length,
      graded_submissions: gradedCount,
      avg_confidence: round(avgConfidence, 2),
      time_saved_hours: round(timeSavedHours, 2)
    });
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
});

router.get("/dashboard/recent-submissions", requireAuth, async (req: AuthedRequest, res) => {
  try {
    const limitParam = Number(req.query.limit);
    const limit = Number.isFinite(limitParam) ? Math.max(limitParam, 1) : env.dashboardRecentLimit;

    const courses = await fetchUserCourseIds(req.user!.id);
    if (courses.length === 0) {
      return res.json({ submissions: [] });
    }

    const courseTitleMap = new Map(courses.map((course) => [course.id, course.title]));
    const graders = await fetchGraders(courses.map((course) => course.id));
    if (graders.length === 0) {
      return res.json({ submissions: [] });
    }

    const graderMap = new Map(graders.map((grader) => [grader.id, grader.course_id]));
    const graderIds = graders.map((grader) => grader.id);

    const { data: submissions, error: submissionsError } = await supabase
      .from("submissions")
      .select("id, grader_id, student_identifier, status, total_score, max_possible_score, created_at")
      .in("grader_id", graderIds)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (submissionsError) {
      return res.status(500).json({ error: submissionsError.message });
    }

    const submissionIds = (submissions ?? []).map((submission) => submission.id);
    const confidenceBySubmission = new Map<string, number>();
    if (submissionIds.length > 0) {
      const { data: grades, error: gradesError } = await supabase
        .from("submission_grades")
        .select("submission_id, confidence_score")
        .in("submission_id", submissionIds);

      if (!gradesError && grades) {
        const totals = new Map<string, { sum: number; count: number }>();
        grades.forEach((grade) => {
          if (typeof grade.confidence_score !== "number") return;
          const current = totals.get(grade.submission_id) ?? { sum: 0, count: 0 };
          current.sum += grade.confidence_score;
          current.count += 1;
          totals.set(grade.submission_id, current);
        });
        totals.forEach((value, submissionId) => {
          confidenceBySubmission.set(submissionId, value.sum / value.count);
        });
      }
    }

    const formatted = (submissions ?? []).map((submission) => {
      const maxScore = submission.max_possible_score ?? 0;
      const totalScore = submission.total_score ?? 0;
      const scorePercent = maxScore > 0 ? round((totalScore / maxScore) * 100, 2) : null;
      const courseId = graderMap.get(submission.grader_id);
      return {
        submission_id: submission.id,
        student_identifier: submission.student_identifier,
        course_title: courseId ? courseTitleMap.get(courseId) ?? "Unknown" : "Unknown",
        score_percent: scorePercent,
        confidence_avg: round(confidenceBySubmission.get(submission.id) ?? 0, 2),
        submitted_at: submission.created_at,
        status: submission.status
      };
    });

    return res.json({ submissions: formatted });
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
