/** Job status lifecycle: queued → running → success | failed → (retry) | dead */
export type JobStatus = "queued" | "running" | "success" | "failed" | "dead";

export type JobType = "ai_analyze_media" | "ai_analyze_report";

export interface JobPayloadAiAnalyzeMedia {
  report_id: string;
  media_id?: string;
  upload_session_id?: string;
  image_url?: string;
}

export interface JobPayloadAiAnalyzeReport {
  report_id: string;
}

export type JobPayload = JobPayloadAiAnalyzeMedia | JobPayloadAiAnalyzeReport;

export interface Job {
  id: string;
  tenant_id: string;
  user_id: string | null;
  type: JobType;
  payload: JobPayload;
  status: JobStatus;
  attempts: number;
  max_attempts: number;
  run_after: string;
  locked_by: string | null;
  locked_at: string | null;
  last_error: string | null;
  last_error_type: string | null;
  trace_id: string | null;
  created_at: string;
  updated_at: string;
}

export type JobEventType = "queued" | "locked" | "retry" | "success" | "failed" | "dead";

export interface JobEvent {
  id: string;
  job_id: string;
  ts: string;
  event: JobEventType;
  details: Record<string, unknown>;
}
