import { Router } from "express";
import { requireAuth, AuthedRequest } from "../middleware/auth.js";
import { supabase } from "../config/supabase.js";
import { getGraderForUser } from "../services/ownershipService.js";

const router = Router();

router.get("/graders/:id/analytics", requireAuth, async (req: AuthedRequest, res) => {
  const graderId = req.params.id;
  const grader = await getGraderForUser(graderId, req.user!.id);
  if (!grader) return res.status(404).json({ error: "Grader not found" });
  const { data: submissions } = await supabase
    .from("submissions")
    .select("total_score,max_possible_score,status")
    .eq("grader_id", graderId);

  if (!submissions) return res.json({ stats: null });

  const graded = submissions.filter((s) => s.status === "graded");
  const total = graded.length;
  const avg =
    graded.reduce((sum, s) => sum + (s.total_score ?? 0), 0) /
    (graded.reduce((sum, s) => sum + (s.max_possible_score ?? 0), 0) || 1);

  return res.json({
    stats: {
      graded_count: graded.length,
      pending_count: submissions.length - graded.length,
      average_percentage: Number((avg * 100).toFixed(2))
    }
  });
});

export default router;
