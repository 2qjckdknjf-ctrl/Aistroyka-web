import { z } from "zod";

export const BuildStampSchema = z.object({ sha7: z.string(), buildTime: z.string() });

export const HealthResponseSchema = z.object({
  ok: z.boolean(),
  db: z.enum(["ok", "error"]),
  aiConfigured: z.boolean(),
  openaiConfigured: z.boolean(),
  supabaseReachable: z.boolean().optional(),
  serviceRoleConfigured: z.boolean().optional(),
  buildStamp: BuildStampSchema.optional(),
  reason: z.string().optional(),
  message: z.string().optional(),
});

export type HealthResponse = z.infer<typeof HealthResponseSchema>;
