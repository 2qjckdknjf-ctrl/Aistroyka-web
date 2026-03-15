import { z } from "zod";

export const SyncBootstrapResponseSchema = z.object({
  data: z.object({
    tasks: z.array(z.object({
      id: z.string(),
      title: z.string(),
      status: z.string(),
      project_id: z.string().nullable().optional(),
      due_date: z.string().optional(),
      created_at: z.string().optional(),
    })),
    reports: z.array(z.object({
      id: z.string(),
      status: z.string(),
      created_at: z.string(),
      submitted_at: z.string().nullable().optional(),
    })),
    uploadSessions: z.array(z.object({
      id: z.string(),
      status: z.string(),
      created_at: z.string(),
      purpose: z.string(),
    })),
  }),
  cursor: z.number(),
  serverTime: z.string(),
});

export const SyncChangeEntrySchema = z.object({
  id: z.number(),
  tenant_id: z.string(),
  resource_type: z.string(),
  resource_id: z.string(),
  change_type: z.enum(["created", "updated", "deleted"]),
  changed_by: z.string().nullable(),
  ts: z.string(),
  payload: z.record(z.unknown()),
});

/** API response shape (snake_case). Matches GET /api/v1/sync/changes output. */
export const SyncChangesResponseSchema = z.object({
  data: z.object({
    changes: z.array(SyncChangeEntrySchema),
  }),
  next_cursor: z.number(),
  server_time: z.string(),
});

export const SyncAckRequestSchema = z.object({
  cursor: z.number().int().min(0),
});

export const SyncAckResponseSchema = z.object({
  ok: z.literal(true),
  cursor: z.number(),
  serverTime: z.string(),
});

export type SyncBootstrapResponse = z.infer<typeof SyncBootstrapResponseSchema>;
export type SyncChangeEntry = z.infer<typeof SyncChangeEntrySchema>;
export type SyncChangesResponse = z.infer<typeof SyncChangesResponseSchema>;
export type SyncAckRequest = z.infer<typeof SyncAckRequestSchema>;
export type SyncAckResponse = z.infer<typeof SyncAckResponseSchema>;
