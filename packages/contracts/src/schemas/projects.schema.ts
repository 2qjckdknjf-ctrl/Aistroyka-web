import { z } from "zod";

export const ProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  created_at: z.string(),
});

export const ProjectsListResponseSchema = z.object({
  data: z.array(ProjectSchema),
});

export const CreateProjectRequestSchema = z.object({
  name: z.string().min(1).max(200),
});

export const CreateProjectResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({ id: z.string() }),
});

export type Project = z.infer<typeof ProjectSchema>;
export type ProjectsListResponse = z.infer<typeof ProjectsListResponseSchema>;
