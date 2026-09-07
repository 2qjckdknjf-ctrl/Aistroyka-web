import { z } from "zod";

/** POST /api/v1/worker/report/submit */
export const WorkerReportSubmitRequestSchema = z.object({
  report_id: z.string().min(1, "report_id required"),
  task_id: z.string().optional(),
  worker_note: z.string().max(2000).optional(),
  actual_volume: z.number().nonnegative().max(1_000_000).optional(),
  planned_volume: z.number().nonnegative().max(1_000_000).optional(),
});

/** POST /api/v1/worker/report/create */
export const WorkerReportCreateRequestSchema = z.object({
  day_id: z.string().optional(),
  task_id: z.string().optional(),
});

/** POST /api/v1/worker/report/add-media */
export const WorkerReportAddMediaRequestSchema = z
  .object({
    report_id: z.string().min(1, "report_id required"),
    media_id: z.string().optional(),
    upload_session_id: z.string().optional(),
  })
  .refine((d) => !!d.media_id || !!d.upload_session_id, {
    message: "media_id or upload_session_id required",
  });

/** POST /api/v1/devices/register */
export const DeviceRegisterRequestSchema = z.object({
  device_id: z.string().min(1, "device_id required"),
  platform: z.enum(["ios", "android"]),
  token: z.string().min(1, "token required"),
});

/** POST /api/v1/devices/unregister */
export const DeviceUnregisterRequestSchema = z.object({
  device_id: z.string().min(1, "device_id required"),
});

/** POST /api/v1/worker/day/start — optional project context + on-device location evidence */
export const WorkerDayStartRequestSchema = z
  .object({
    project_id: z.string().min(1, "project_id required").optional(),
    latitude: z.number().gte(-90).lte(90).optional(),
    longitude: z.number().gte(-180).lte(180).optional(),
    accuracy_m: z.number().nonnegative().optional(),
  })
  .strict()
  .optional();

/** POST /api/v1/worker/day/end — empty body optional */
export const WorkerDayEndRequestSchema = z.object({}).strict().optional();

/** POST /api/v1/media/upload-sessions */
export const CreateUploadSessionRequestSchema = z.object({
  purpose: z.enum(["report_before", "report_after", "project_media", "task_chat", "issue_evidence"]).optional(),
});

/** POST /api/v1/media/upload-sessions/[id]/finalize */
export const FinalizeUploadSessionRequestSchema = z.object({
  object_path: z.string().min(1, "object_path required"),
  mime_type: z.string().optional(),
  size_bytes: z.number().int().nonnegative().optional(),
});

export type WorkerReportSubmitRequest = z.infer<typeof WorkerReportSubmitRequestSchema>;
export type WorkerReportCreateRequest = z.infer<typeof WorkerReportCreateRequestSchema>;
export type WorkerReportAddMediaRequest = z.infer<typeof WorkerReportAddMediaRequestSchema>;
export type DeviceRegisterRequest = z.infer<typeof DeviceRegisterRequestSchema>;
export type DeviceUnregisterRequest = z.infer<typeof DeviceUnregisterRequestSchema>;
export type WorkerDayStartRequest = z.infer<typeof WorkerDayStartRequestSchema>;
export type CreateUploadSessionRequest = z.infer<typeof CreateUploadSessionRequestSchema>;
export type FinalizeUploadSessionRequest = z.infer<typeof FinalizeUploadSessionRequestSchema>;
