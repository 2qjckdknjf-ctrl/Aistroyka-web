/**
 * Standard event names for observability. No PII in event payloads.
 */
export const OBSERVABILITY_EVENTS = {
  auth: ["auth_login", "auth_logout", "auth_error"],
  projects: ["project_create", "project_read", "project_update"],
  worker: ["worker_day_start", "worker_day_end", "worker_report_submit", "worker_tasks_read"],
  media: ["media_upload", "upload_session_create", "upload_session_finalize"],
  ai: ["ai_analyze_image", "ai_usage_recorded"],
  jobs: ["job_queued", "job_locked", "job_success", "job_failed", "job_dead"],
  rate_limit: ["rate_limit_exceeded"],
  quota: ["quota_exceeded"],
} as const;

export type EventCategory = keyof typeof OBSERVABILITY_EVENTS;
