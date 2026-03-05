import { z } from "zod";

export const ConfigFlagSchema = z.object({
  enabled: z.boolean(),
  variant: z.string().nullable().optional(),
});

export const ConfigPayloadSchema = z.object({
  flags: z.record(z.string(), ConfigFlagSchema),
  limits: z.record(z.string(), z.number()).optional(),
  serverTime: z.string(),
  traceId: z.string(),
  clientProfile: z.string(),
});

export type ConfigFlag = z.infer<typeof ConfigFlagSchema>;
export type ConfigPayload = z.infer<typeof ConfigPayloadSchema>;
