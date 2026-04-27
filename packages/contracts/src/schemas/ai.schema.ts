import { z } from "zod";

export const AnalyzeImageRequestSchema = z.object({
  image_url: z.string(),
  media_id: z.string().optional(),
  project_id: z.string().optional(),
});

/** HTTPS URL to a site video (timelapse, walkthrough, or fixed camera) for “work done this day” analysis. */
export const AnalyzeVideoDailyRequestSchema = z.object({
  video_url: z.string(),
  /** Calendar date the report refers to (YYYY-MM-DD). If omitted, the model may infer cautiously from the clip. */
  work_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  media_id: z.string().optional(),
  project_id: z.string().optional(),
});

export const RiskLevelSchema = z.enum(["low", "medium", "high"]);

export const AnalysisResultSchema = z.object({
  stage: z.string(),
  completion_percent: z.number(),
  risk_level: RiskLevelSchema,
  detected_issues: z.array(z.string()),
  recommendations: z.array(z.string()),
});

export const AnalyzeImageErrorSchema = z.object({
  error: z.string(),
});

export const DailyWorkVideoAnalysisSchema = z.object({
  /** Echo or best estimate of the reporting date (YYYY-MM-DD when known). */
  work_date: z.string(),
  summary: z.string(),
  activities_observed: z.array(z.string()),
  materials_or_equipment_visible: z.array(z.string()).optional(),
  completion_estimate_percent: z.number(),
  risk_level: RiskLevelSchema,
  issues_and_risks: z.array(z.string()),
  recommendations: z.array(z.string()),
  /** Short note on visibility limits (camera angle, lighting, occlusions). */
  visibility_notes: z.string().optional(),
});

export type AnalyzeImageRequest = z.infer<typeof AnalyzeImageRequestSchema>;
export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;
export type AnalyzeVideoDailyRequest = z.infer<typeof AnalyzeVideoDailyRequestSchema>;
export type DailyWorkVideoAnalysis = z.infer<typeof DailyWorkVideoAnalysisSchema>;
