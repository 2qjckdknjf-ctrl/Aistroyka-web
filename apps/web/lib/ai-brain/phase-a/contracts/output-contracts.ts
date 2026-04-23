/**
 * AI Brain Phase A — Output contracts (Zod schemas).
 * Schema-safe validation for AI Brain outputs.
 */

import { z } from "zod";

const BaseOutputSchema = z.object({
  projectId: z.string(),
  tenantId: z.string(),
  at: z.string(),
  projectStatus: z.string(),
});

export const DataSufficiencyFlagsSchema = z.object({
  snapshot: z.enum(["full", "partial", "missing"]),
  health: z.enum(["full", "partial", "missing"]),
  risks: z.enum(["full", "partial", "missing"]),
  evidence: z.enum(["full", "partial", "missing"]),
  schedule: z.enum(["full", "partial", "missing", "unavailable"]),
  approvals: z.enum(["full", "partial", "missing", "unavailable"]),
  budget: z.enum(["full", "partial", "missing", "unavailable"]),
});

export const ExecutiveProjectBriefSchema = BaseOutputSchema.extend({
  type: z.literal("ExecutiveProjectBrief"),
  headline: z.string(),
  facts: z.record(z.unknown()),
  inferredStatements: z.array(z.string()).default([]),
  unavailableData: z.array(z.string()).default([]),
  confidenceNote: z.string().nullable().optional(),
  recommendedNextAttention: z.string().nullable().optional(),
  dataSufficiency: DataSufficiencyFlagsSchema.optional(),
});
export type ExecutiveProjectBrief = z.infer<typeof ExecutiveProjectBriefSchema>;

export const ManagerProjectInsightSchema = BaseOutputSchema.extend({
  type: z.literal("ManagerProjectInsight"),
  facts: z.record(z.unknown()),
  inferredStatements: z.array(z.string()).default([]),
  unavailableData: z.array(z.string()).default([]),
  confidenceNote: z.string().nullable().optional(),
  recommendedNextAttention: z.string().nullable().optional(),
  dataSufficiency: DataSufficiencyFlagsSchema.optional(),
});
export type ManagerProjectInsight = z.infer<typeof ManagerProjectInsightSchema>;

export const WorkerNextFocusSummarySchema = BaseOutputSchema.extend({
  type: z.literal("WorkerNextFocusSummary"),
  facts: z.record(z.unknown()),
  inferredStatements: z.array(z.string()).default([]),
  unavailableData: z.array(z.string()).default([]),
  recommendedNextAttention: z.string().nullable().optional(),
  dataSufficiency: DataSufficiencyFlagsSchema.optional(),
});
export type WorkerNextFocusSummary = z.infer<typeof WorkerNextFocusSummarySchema>;

export const ClientSafeProjectSummarySchema = BaseOutputSchema.extend({
  type: z.literal("ClientSafeProjectSummary"),
  headline: z.string(),
  facts: z.record(z.unknown()),
  inferredStatements: z.array(z.string()).default([]),
  unavailableData: z.array(z.string()).default([]),
  confidenceNote: z.string().nullable().optional(),
  recommendedNextAttention: z.string().nullable().optional(),
  dataSufficiency: DataSufficiencyFlagsSchema.optional(),
});
export type ClientSafeProjectSummary = z.infer<typeof ClientSafeProjectSummarySchema>;

export type AiBrainOutput =
  | ExecutiveProjectBrief
  | ManagerProjectInsight
  | WorkerNextFocusSummary
  | ClientSafeProjectSummary;

const OUTPUT_SCHEMAS = {
  ExecutiveProjectBrief: ExecutiveProjectBriefSchema,
  ManagerProjectInsight: ManagerProjectInsightSchema,
  WorkerNextFocusSummary: WorkerNextFocusSummarySchema,
  ClientSafeProjectSummary: ClientSafeProjectSummarySchema,
} as const;

export function validateOutput(
  type: keyof typeof OUTPUT_SCHEMAS,
  data: unknown
): { success: true; data: AiBrainOutput } | { success: false; error: string } {
  const schema = OUTPUT_SCHEMAS[type];
  if (!schema) {
    return { success: false, error: `Unknown output type: ${type}` };
  }
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data as AiBrainOutput };
  }
  return {
    success: false,
    error: result.error.errors.map((e) => e.message).join("; "),
  };
}
