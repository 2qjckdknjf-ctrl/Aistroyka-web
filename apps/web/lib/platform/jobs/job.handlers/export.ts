import type { SupabaseClient } from "@supabase/supabase-js";
import type { Job } from "../job.types";
import type { JobPayloadExport } from "../job.types";

/**
 * Export job handler: placeholder. In production would generate file (reports, ai_usage, audit_logs)
 * and store in bucket, then update job payload with result_url.
 */
export async function handleExport(supabase: SupabaseClient, job: Job): Promise<void> {
  const payload = job.payload as JobPayloadExport;
  const exportType = payload?.export_type ?? "audit_logs";
  const rangeDays = payload?.range_days ?? 30;
  // Scaffold: no file generation; job completes so status is available for GET admin/exports/:id/status
  if (exportType && rangeDays) {
    // Placeholder for future: query tenant data, write to storage, set result_url in payload
  }
}
