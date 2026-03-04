import type { SupabaseClient } from "@supabase/supabase-js";
import { JobPayloadError } from "../job.errors";
import type { Job, JobPayloadAiAnalyzeReport } from "../job.types";

/**
 * Handler for ai_analyze_report. Phase 2: no aggregation AI call; just succeed.
 * Report-level analysis (e.g. summarize all media) can be added later.
 */
export async function handleAiAnalyzeReport(
  _supabase: SupabaseClient,
  job: Job
): Promise<void> {
  const payload = job.payload as JobPayloadAiAnalyzeReport;
  if (!payload || typeof payload.report_id !== "string") {
    throw new JobPayloadError("ai_analyze_report requires payload.report_id");
  }
  // No-op: media jobs do per-image analysis; report job is a sentinel for "pipeline started".
}
