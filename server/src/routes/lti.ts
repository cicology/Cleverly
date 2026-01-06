import { Router } from "express";
import { z } from "zod";
import { requireAuth, AuthedRequest } from "../middleware/auth.js";
import { validateBody } from "../middleware/validateRequest.js";
import { supabase } from "../config/supabase.js";
import { getCourseForUser } from "../services/ownershipService.js";

const router = Router();

const linkSchema = z.object({
  course_id: z.string().uuid().optional(),
  course_title: z.string().min(1).optional()
});

router.get("/launches/:launchId", requireAuth, async (req: AuthedRequest, res) => {
  const { data: launch, error } = await supabase
    .from("lti_launches")
    .select("*")
    .eq("launch_id", req.params.launchId)
    .single();

  if (error || !launch) {
    return res.status(404).json({ error: "Launch not found" });
  }

  if (launch.expires_at && new Date(launch.expires_at).getTime() < Date.now()) {
    return res.status(410).json({ error: "Launch expired" });
  }

  return res.json({
    launch_id: launch.launch_id,
    context_id: launch.context_id,
    context_title: launch.context_title,
    resource_link_id: launch.resource_link_id,
    course_id: launch.course_id
  });
});

router.post(
  "/launches/:launchId/link",
  requireAuth,
  validateBody(linkSchema),
  async (req: AuthedRequest, res) => {
    const { course_id, course_title } = req.body as z.infer<typeof linkSchema>;

    const { data: launch, error } = await supabase
      .from("lti_launches")
      .select("*")
      .eq("launch_id", req.params.launchId)
      .single();

    if (error || !launch) {
      return res.status(404).json({ error: "Launch not found" });
    }

    if (launch.expires_at && new Date(launch.expires_at).getTime() < Date.now()) {
      return res.status(410).json({ error: "Launch expired" });
    }

    if (launch.user_id && launch.user_id !== req.user!.id) {
      return res.status(403).json({ error: "Launch already claimed" });
    }

    if (!launch.platform_issuer || !launch.client_id || (!launch.context_id && !launch.resource_link_id)) {
      return res.status(400).json({ error: "Launch missing required context" });
    }

    let linkedCourseId: string | null = null;

    const linkQuery = supabase
      .from("lti_course_links")
      .select("*")
      .eq("platform_issuer", launch.platform_issuer)
      .eq("client_id", launch.client_id);

    if (launch.context_id) {
      linkQuery.eq("context_id", launch.context_id);
    } else {
      linkQuery.is("context_id", null);
    }

    if (launch.resource_link_id) {
      linkQuery.eq("resource_link_id", launch.resource_link_id);
    } else {
      linkQuery.is("resource_link_id", null);
    }

    const { data: existingLink } = await linkQuery.maybeSingle();

    if (existingLink) {
      if (existingLink.user_id !== req.user!.id) {
        return res.status(403).json({ error: "LTI link already claimed by another user" });
      }
      linkedCourseId = existingLink.course_id;
    } else if (course_id) {
      const course = await getCourseForUser(course_id, req.user!.id);
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }
      linkedCourseId = course.id;
    } else {
      const title = course_title || launch.context_title || "LTI Course";
      const { data: course, error: courseError } = await supabase
        .from("courses")
        .insert({
          title,
          description: "Imported via LTI",
          user_id: req.user!.id
        })
        .select()
        .single();

      if (courseError || !course) {
        return res.status(500).json({ error: courseError?.message ?? "Failed to create course" });
      }

      linkedCourseId = course.id;
    }

    if (!linkedCourseId) {
      return res.status(500).json({ error: "Unable to link course" });
    }

    if (!existingLink) {
      const { error: linkError } = await supabase.from("lti_course_links").insert({
        platform_issuer: launch.platform_issuer,
        client_id: launch.client_id,
        context_id: launch.context_id,
        resource_link_id: launch.resource_link_id,
        course_id: linkedCourseId,
        user_id: req.user!.id
      });

      if (linkError) {
        return res.status(500).json({ error: linkError.message });
      }
    }

    const { error: updateError } = await supabase
      .from("lti_launches")
      .update({
        course_id: linkedCourseId,
        user_id: req.user!.id,
        claimed_at: new Date().toISOString()
      })
      .eq("launch_id", req.params.launchId);

    if (updateError) {
      return res.status(500).json({ error: updateError.message });
    }

    return res.json({ course_id: linkedCourseId });
  }
);

export default router;
