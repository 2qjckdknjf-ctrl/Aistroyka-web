import { z } from "zod";

export const AnalyzeImageRequestSchema = z.object({
  image_url: z.string(),
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

export type AnalyzeImageRequest = z.infer<typeof AnalyzeImageRequestSchema>;
export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;
