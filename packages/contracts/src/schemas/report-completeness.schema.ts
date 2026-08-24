import { z } from "zod";

/** GET /api/v1/reports/:id/completeness */
export const ReportCompletenessStatusSchema = z.enum(["complete", "incomplete", "needs_manager_review"]);

export const ReportCompletenessResultSchema = z.object({
  report_id: z.string(),
  status: ReportCompletenessStatusSchema,
  reasons: z.array(z.string()),
  missing_fields: z.array(z.string()),
  rules_version: z.string(),
  evaluated_at: z.string(),
  has_before: z.boolean(),
  has_after: z.boolean(),
  before_after_pair_valid: z.boolean(),
  media_reference_valid: z.boolean(),
});

export type ReportCompletenessResult = z.infer<typeof ReportCompletenessResultSchema>;
