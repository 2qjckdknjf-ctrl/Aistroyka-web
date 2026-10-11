/**
 * Process one analysis job: dequeue, claim, call AI endpoint, complete or fail.
 * Used by POST /api/analysis/process so the web app can run the engine without a separate worker.
 * Timeouts and retries from centralized config (lib/config/server).
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { getServerConfig } from "@/lib/config/server";
import { logStructured } from "@/lib/observability";
import { isAnalysisResult, type AnalysisResult } from "./types";
import {
  classifyVisionFailure,
  VisionProviderError,
} from "@/lib/domain/vision-jobs/vision-job-lifecycle";

const VIDEO_NOT_IMPLEMENTED = "Video processing not implemented yet";
const AI_RETRY_DELAY_MS = 2000;

export type ProcessOneJobResult =
  | { ok: true; jobId: string; status: "completed" | "failed" }
  | { ok: false; reason: "no_url" | "no_job" | "error"; message?: string };

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Structured job lifecycle logs (job_started / job_succeeded / job_failed). */
function logJobLifecycle(
  event: "job_started" | "job_succeeded" | "job_failed",
  payload: {
    job_id: string;
    duration_ms?: number;
    attempts?: number;
    retryable?: boolean;
    next_retry_at?: string;
    error_code?: string;
    request_id?: string;
  }
) {
  if (getServerConfig().NODE_ENV === "test") return;
  logStructured({ event, ...payload });
}

/**
 * Run AI vision for one image. Throws on non-2xx or invalid response.
 * Uses timeout and retries on 5xx / network errors.
 */
async function callAiAnalysis(
  aiUrl: string,
  params: { media_id: string; image_url: string; project_id: string },
  requestHeaders?: HeadersInit
): Promise<AnalysisResult> {
  const { AI_REQUEST_TIMEOUT_MS, AI_RETRY_ATTEMPTS } = getServerConfig();
  const baseUrl = aiUrl.replace(/\/$/, "");
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= AI_RETRY_ATTEMPTS; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), AI_REQUEST_TIMEOUT_MS);

    try {
      const res = await fetch(baseUrl, {
        method: "POST",
        headers: { ...Object.fromEntries(new Headers(requestHeaders)), "Content-Type": "application/json" },
        redirect: "error",
        body: JSON.stringify(params),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        if (res.headers.get("X-AI-Fallback-Reason")) {
          throw new VisionProviderError({ message: "AI returned a degraded fallback", httpStatus: 503,
            errorType: "provider_unavailable", retryable: true });
        }
        const data: unknown = await res.json();
        if (!isAnalysisResult(data)) throw new Error("AI returned invalid analysis format");
        return data;
      }

      const classified = classifyVisionFailure({ message: `AI analysis failed: ${res.status}`, httpStatus: res.status });
      const err = new VisionProviderError({
        message: `AI analysis failed: ${res.status}`,
        httpStatus: res.status,
        errorType: classified.errorType,
        retryable: classified.retryable,
      });
      const retryThisRound = classified.retryable && (res.status === 429 || res.status >= 500) && attempt < AI_RETRY_ATTEMPTS;
      if (retryThisRound) {
        lastError = err;
        await sleep(AI_RETRY_DELAY_MS * attempt);
        continue;
      }
      throw err;
    } catch (err) {
      clearTimeout(timeoutId);
      if (err instanceof VisionProviderError) {
        if (
          err.retryable &&
          (err.httpStatus === 429 || (err.httpStatus ?? 0) >= 500) &&
          attempt < AI_RETRY_ATTEMPTS
        ) {
          lastError = err;
          await sleep(AI_RETRY_DELAY_MS * attempt);
          continue;
        }
        throw err;
      }
      const isRetryable =
        err instanceof Error &&
        (err.name === "AbortError" ||
          err.message.includes("fetch") ||
          err.message.includes("network") ||
          err.message.includes("ECONNRESET"));
      if (isRetryable && attempt < AI_RETRY_ATTEMPTS) {
        lastError = err instanceof Error ? err : new Error(String(err));
        await sleep(AI_RETRY_DELAY_MS * attempt);
        continue;
      }
      throw err instanceof Error ? err : new Error(String(err));
    }
  }

  throw lastError ?? new Error("AI analysis failed after retries");
}

/**
 * Mark job as failed (status, error_message, error_type, finished_at).
 */
async function markJobFailed(
  supabase: SupabaseClient,
  jobId: string,
  tenantId: string,
  executionToken: string,
  message: string,
  errorType: string
): Promise<number> {
  const { data, error } = await supabase.rpc("fail_session_analysis_job", {
    p_job_id: jobId,
    p_tenant_id: tenantId,
    p_execution_token: executionToken,
    p_error_message: message,
    p_error_type: errorType,
  });
  if (error) {
    throw error;
  }
  return typeof data === "number" ? data : 0;
}

/**
 * Process one job: dequeue → claim → AI → complete (or mark failed).
 * Caller-visible candidates and tenant-scoped atomic claims; completion/failure use service RPCs.
 * Optional traceId is included in job logs when provided (e.g. from request x-request-id).
 */
export async function processOneJob(
  supabase: SupabaseClient,
  aiAnalysisUrl: string | undefined,
  options: { tenantId: string; callerClient: SupabaseClient; traceId?: string; aiRequestHeaders?: HeadersInit }
): Promise<ProcessOneJobResult> {
  const traceId = options?.traceId ?? (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `job-${Date.now()}`);
  if (!aiAnalysisUrl?.trim()) {
    return { ok: false, reason: "no_url", message: "AI_ANALYSIS_URL is not set" };
  }

  // Keep worker_id nullable to stay compatible with live DBs that may enforce
  // a FK to a workers table not seeded by web-session users.
  const workerId: string | null = null;

  const tenantId = options?.tenantId?.trim();
  if (!tenantId || !options?.callerClient) {
    return { ok: false, reason: "error", message: "Caller tenant scope is required" };
  }
  const now = new Date().toISOString();
  const retryDue = `next_retry_at.is.null,next_retry_at.lte.${now}`;
  // Candidate visibility is checked with the user's RLS client, never service role.
  const { data: candidates, error: candidateError } = await options.callerClient
    .from("analysis_jobs").select("id, media_id, tenant_id")
    .eq("tenant_id", tenantId).eq("status", "queued")
    .is("execution_token", null).or(retryDue)
    .order("priority_order", { ascending: false }).order("started_at", { ascending: true })
    .limit(5);
  if (candidateError) return { ok: false, reason: "error", message: candidateError.message };
  let job: { id: string; media_id: string; tenant_id: string; execution_token: string } | null = null;
  for (const candidate of candidates ?? []) {
    if (candidate.tenant_id !== tenantId) continue;
    // Claim state and execution together. A competing worker wins or loses this UPDATE,
    // and a loser must never call a failure RPC on the winner's job.
    const { data: claimed, error } = await supabase.from("analysis_jobs")
      .update({ status: "processing", started_at: now, execution_started_at: now,
        execution_token: crypto.randomUUID(), worker_id: workerId })
      .eq("id", candidate.id).eq("tenant_id", tenantId).eq("status", "queued")
      .is("execution_token", null).or(retryDue)
      .select("id, media_id, tenant_id, execution_token").maybeSingle();
    if (error) return { ok: false, reason: "error", message: error.message };
    if (claimed?.id && claimed.tenant_id === tenantId) { job = claimed; break; }
  }
  if (!job) return { ok: false, reason: "no_job" };

  const jobId = job.id as string;
  const mediaId = job.media_id as string;

  const { data: media, error: mediaError } = await supabase
    .from("media")
    .select("file_url, project_id, type, tenant_id")
    .eq("id", mediaId)
    .eq("tenant_id", tenantId)
    .single();

  if (mediaError || !media || media.tenant_id !== tenantId) {
    await markJobFailed(
      supabase,
      jobId,
      tenantId,
      job.execution_token,
      mediaError?.message ?? "Media not found",
      "validation_error"
    );
    return { ok: true, jobId, status: "failed" };
  }

  const fileUrl = media.file_url as string;
  const projectId = media.project_id as string;
  const type = (media.type as string) || "image";

  if (type === "video") {
    await markJobFailed(supabase, jobId, tenantId, job.execution_token, VIDEO_NOT_IMPLEMENTED, "validation_error");
    return { ok: true, jobId, status: "failed" };
  }

  const startMs = Date.now();
  logJobLifecycle("job_started", { job_id: jobId, request_id: traceId });

  try {
    const result = await callAiAnalysis(aiAnalysisUrl, {
      media_id: mediaId,
      image_url: fileUrl,
      project_id: projectId,
    }, options.aiRequestHeaders);

    const { error: completeError } = await supabase.rpc("complete_session_analysis_job", {
      p_job_id: jobId,
      p_tenant_id: tenantId,
      p_execution_token: job.execution_token,
      p_stage: result.stage,
      p_completion_percent: Math.round(result.completion_percent),
      p_risk_level: result.risk_level,
      p_detected_issues: result.detected_issues,
      p_recommendations: result.recommendations,
      p_frame_count: null,
    });

    if (completeError) throw completeError;
    logJobLifecycle("job_succeeded", {
      job_id: jobId,
      duration_ms: Date.now() - startMs,
      attempts: 1,
      request_id: traceId,
    });
    return { ok: true, jobId, status: "completed" };
  } catch (err) {
    const classified =
      err instanceof VisionProviderError
        ? { errorType: err.errorType, retryable: err.retryable }
        : classifyVisionFailure(err instanceof Error ? err.message : "Analysis failed");
    const message = err instanceof Error ? err.message : "Analysis failed";
    const attempts = await markJobFailed(supabase, jobId, tenantId, job.execution_token, message, classified.errorType);
    logJobLifecycle("job_failed", {
      job_id: jobId,
      duration_ms: Date.now() - startMs,
      attempts,
      retryable: classified.retryable,
      error_code: classified.errorType,
      request_id: traceId,
    });
    return { ok: true, jobId, status: "failed" };
  }
}
