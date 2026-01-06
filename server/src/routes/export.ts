import { Router } from "express";
import * as XLSX from "xlsx";
import { requireAuth, AuthedRequest } from "../middleware/auth.js";
import { supabase } from "../config/supabase.js";
import { getGraderForUser } from "../services/ownershipService.js";

const router = Router();

router.get("/graders/:id/export", requireAuth, async (req: AuthedRequest, res) => {
  const graderId = req.params.id;

  try {
    // Get grader info
    const grader = await getGraderForUser(graderId, req.user!.id);
    if (!grader) {
      return res.status(404).json({ error: "Grader not found" });
    }

    // Get rubric
    const { data: rubric } = await supabase
      .from("rubrics")
      .select("*")
      .eq("grader_id", graderId)
      .order("order_index", { ascending: true });

    // Get all submissions with grades
    const { data: submissions, error: submissionsError } = await supabase
      .from("submissions")
      .select("*")
      .eq("grader_id", graderId)
      .order("created_at", { ascending: true });

    if (submissionsError) {
      return res.status(500).json({ error: submissionsError.message });
    }

    // Get all grades for these submissions
    const submissionIds = submissions?.map((s) => s.id) ?? [];
    const { data: grades } = await supabase
      .from("submission_grades")
      .select("*")
      .in("submission_id", submissionIds);

    // Create rubric lookup map
    const rubricMap = new Map(rubric?.map((r) => [r.id, r]) ?? []);

    // Build summary sheet data
    const summaryData: Record<string, unknown>[] = [];

    for (const submission of submissions ?? []) {
      const submissionGrades = grades?.filter((g) => g.submission_id === submission.id) ?? [];

      summaryData.push({
        "Student ID": submission.student_identifier || "Unknown",
        "Status": submission.status,
        "Total Score": submission.total_score ?? 0,
        "Max Possible": submission.max_possible_score ?? 0,
        "Percentage": submission.percentage ? `${submission.percentage.toFixed(1)}%` : "N/A",
        "Graded At": submission.processed_at
          ? new Date(submission.processed_at).toLocaleString()
          : "Not graded",
        "Questions Graded": submissionGrades.length
      });
    }

    // Build detailed grades sheet data
    const detailedData: Record<string, unknown>[] = [];

    for (const submission of submissions ?? []) {
      const submissionGrades = grades?.filter((g) => g.submission_id === submission.id) ?? [];

      for (const grade of submissionGrades) {
        const rubricItem = rubricMap.get(grade.rubric_id);

        detailedData.push({
          "Student ID": submission.student_identifier || "Unknown",
          "Question #": rubricItem?.question_number ?? "N/A",
          "Question": rubricItem?.question_text ?? "N/A",
          "Expected Answer": rubricItem?.expected_answer ?? "N/A",
          "Marks Awarded": grade.marks_awarded,
          "Max Marks": rubricItem?.max_marks ?? 0,
          "Confidence": grade.confidence_score ? `${(grade.confidence_score * 100).toFixed(0)}%` : "N/A",
          "AI Reasoning": grade.ai_reasoning ?? "",
          "Overridden": grade.is_overridden ? "Yes" : "No",
          "Override Reason": grade.override_reason ?? ""
        });
      }
    }

    // Build rubric sheet data
    const rubricData = rubric?.map((r) => ({
      "Question #": r.question_number,
      "Question Text": r.question_text ?? "",
      "Expected Answer": r.expected_answer,
      "Keywords": (r.keywords ?? []).join(", "),
      "Max Marks": r.max_marks
    })) ?? [];

    // Create workbook
    const workbook = XLSX.utils.book_new();

    // Add Summary sheet
    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");

    // Add Detailed Grades sheet
    if (detailedData.length > 0) {
      const detailedSheet = XLSX.utils.json_to_sheet(detailedData);
      XLSX.utils.book_append_sheet(workbook, detailedSheet, "Detailed Grades");
    }

    // Add Rubric sheet
    if (rubricData.length > 0) {
      const rubricSheet = XLSX.utils.json_to_sheet(rubricData);
      XLSX.utils.book_append_sheet(workbook, rubricSheet, "Rubric");
    }

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    // Generate filename
    const courseName = (grader.courses as any)?.title ?? "Course";
    const graderTitle = grader.title ?? "Grader";
    const timestamp = new Date().toISOString().split("T")[0];
    const filename = `${courseName}_${graderTitle}_Results_${timestamp}.xlsx`
      .replace(/[^a-zA-Z0-9_.-]/g, "_");

    // Send response
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", buffer.length);

    return res.send(buffer);
  } catch (error) {
    console.error("[export] Error generating Excel:", error);
    return res.status(500).json({ error: "Failed to generate export" });
  }
});

export default router;
