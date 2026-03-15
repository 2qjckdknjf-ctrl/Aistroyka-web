import { z } from "zod";

/** POST /api/v1/worker/report/submit */
export const WorkerReportSubmitRequestSchema = z.object({
  report_id: z.string().min(1, "report_id required"),
  task_id: z.string().optional(),
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

/** POST /api/v1/worker/day/start — empty body optional */
export const WorkerDayStartRequestSchema = z.object({}).strict().optional();

/** POST /api/v1/worker/day/end — empty body optional */
export const WorkerDayEndRequestSchema = z.object({}).strict().optional();

/** POST /api/v1/media/upload-sessions */
export const CreateUploadSessionRequestSchema = z.object({
  purpose: z.enum(["report_before", "report_after", "project_media"]).optional(),
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
export type CreateUploadSessionRequest = z.infer<typeof CreateUploadSessionRequestSchema>;
export type FinalizeUploadSessionRequest = z.infer<typeof FinalizeUploadSessionRequestSchema>;
