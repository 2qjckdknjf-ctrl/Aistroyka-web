/** Job status lifecycle: queued → running → success | failed → (retry) | dead */
export type JobStatus = "queued" | "running" | "success" | "failed" | "dead";

export type JobType = "ai_analyze_media" | "ai_analyze_report" | "export" | "retention_cleanup" | "push_send" | "upload_reconcile" | "ops_events_prune";

export interface JobPayloadAiAnalyzeMedia {
  report_id: string;
  media_id?: string;
  upload_session_id?: string;
  image_url?: string;
}

export interface JobPayloadAiAnalyzeReport {
  report_id: string;
}

export type ExportType = "reports" | "ai_usage" | "audit_logs";

export interface JobPayloadExport {
  export_type: ExportType;
  range_days?: number;
}

export interface JobPayloadRetentionCleanup {
  tenant_id: string;
}

export interface JobPayloadPushSend {
  tenant_id?: string; // optional: drain only this tenant
}

export interface JobPayloadUploadReconcile {
  max_age_minutes?: number;
}

export interface JobPayloadOpsEventsPrune {
  retention_days?: number;
}

export type JobPayload = JobPayloadAiAnalyzeMedia | JobPayloadAiAnalyzeReport | JobPayloadExport | JobPayloadRetentionCleanup | JobPayloadPushSend | JobPayloadUploadReconcile | JobPayloadOpsEventsPrune;

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
  dedupe_key?: string | null;
}

export type JobEventType = "queued" | "locked" | "retry" | "success" | "failed" | "dead";

export interface JobEvent {
  id: string;
  job_id: string;
  ts: string;
  event: JobEventType;
  details: Record<string, unknown>;
}
