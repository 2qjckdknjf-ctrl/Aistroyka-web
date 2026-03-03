/**
 * Process one analysis job: dequeue, claim, call AI endpoint, complete or fail.
 * Used by POST /api/analysis/process so the web app can run the engine without a separate worker.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { isAnalysisResult, type AnalysisResult } from "./types";

const VIDEO_NOT_IMPLEMENTED = "Video processing not implemented yet";
const AI_REQUEST_TIMEOUT_MS = Math.min(
  120_000,
  Math.max(30_000, Number(process.env.AI_REQUEST_TIMEOUT_MS) || 90_000)
);
const AI_RETRY_ATTEMPTS = Math.min(5, Math.max(1, Number(process.env.AI_RETRY_ATTEMPTS) || 3));
const AI_RETRY_DELAY_MS = 2000;

export type ProcessOneJobResult =
  | { ok: true; jobId: string; status: "completed" | "failed" }
  | { ok: false; reason: "no_url" | "no_job" | "error"; message?: string };

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Single JSON log line for job completion/failure (parseable by log aggregators). */
function logProcessOneJob(payload: {
  job_id: string;
  status: "completed" | "failed";
  duration_ms: number;
  error_type?: string;
}) {
  if (process.env.NODE_ENV === "test") return;
  console.log(
    JSON.stringify({
      event: "ai_process_one_job",
      ...payload,
      ts: new Date().toISOString(),
    })
  );
}

/**
 * Run AI vision for one image. Throws on non-2xx or invalid response.
 * Uses timeout and retries on 5xx / network errors.
 */
async function callAiAnalysis(
  aiUrl: string,
  params: { media_id: string; image_url: string; project_id: string }
): Promise<AnalysisResult> {
  const baseUrl = aiUrl.replace(/\/$/, "");
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= AI_RETRY_ATTEMPTS; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), AI_REQUEST_TIMEOUT_MS);

    try {
      const res = await fetch(baseUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data: unknown = await res.json();
        if (!isAnalysisResult(data)) throw new Error("AI returned invalid analysis format");
        return data;
      }

      const text = await res.text();
      const err = new Error(`AI analysis failed: ${res.status} ${text}`);
      if (res.status >= 500 && attempt < AI_RETRY_ATTEMPTS) {
        lastError = err;
        await sleep(AI_RETRY_DELAY_MS * attempt);
        continue;
      }
      throw err;
    } catch (err) {
      clearTimeout(timeoutId);
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
  message: string,
  errorType: string
): Promise<void> {
  await supabase
    .from("analysis_jobs")
    .update({
      status: "failed",
      error_message: message,
      error_type: errorType,
      finished_at: new Date().toISOString(),
    })
    .eq("id", jobId)
    .in("status", ["pending", "processing"]);
}

/**
 * Process one job: dequeue → claim → AI → complete (or mark failed).
 * Uses RPCs dequeue_job(null, workerId), claim_job_execution(jobId, workerId), complete_analysis_job(...).
 */
export async function processOneJob(
  supabase: SupabaseClient,
  aiAnalysisUrl: string | undefined
): Promise<ProcessOneJobResult> {
  if (!aiAnalysisUrl?.trim()) {
    return { ok: false, reason: "no_url", message: "AI_ANALYSIS_URL is not set" };
  }

  const workerId = crypto.randomUUID();

  const { data: jobRow, error: dequeueError } = await supabase.rpc("dequeue_job", {
    p_region_id: null,
    p_worker_id: workerId,
  });

  if (dequeueError) {
    return { ok: false, reason: "error", message: dequeueError.message };
  }

  const job = Array.isArray(jobRow) ? jobRow[0] : jobRow;
  if (!job?.id) {
    return { ok: false, reason: "no_job" };
  }

  const jobId = job.id as string;
  const mediaId = job.media_id as string;

  const { data: media, error: mediaError } = await supabase
    .from("media")
    .select("file_url, project_id, type")
    .eq("id", mediaId)
    .single();

  if (mediaError || !media) {
    await markJobFailed(
      supabase,
      jobId,
      mediaError?.message ?? "Media not found",
      "validation_error"
    );
    return { ok: true, jobId, status: "failed" };
  }

  const fileUrl = media.file_url as string;
  const projectId = media.project_id as string;
  const type = (media.type as string) || "image";

  if (type === "video") {
    await markJobFailed(supabase, jobId, VIDEO_NOT_IMPLEMENTED, "validation_error");
    return { ok: true, jobId, status: "failed" };
  }

  const { data: claimed, error: claimError } = await supabase.rpc("claim_job_execution", {
    p_job_id: jobId,
    p_worker_id: workerId,
  });

  if (claimError || !claimed) {
    await markJobFailed(
      supabase,
      jobId,
      claimError?.message ?? "Failed to claim execution",
      "rpc_conflict"
    );
    return { ok: true, jobId, status: "failed" };
  }

  const startMs = Date.now();

  try {
    const result = await callAiAnalysis(aiAnalysisUrl, {
      media_id: mediaId,
      image_url: fileUrl,
      project_id: projectId,
    });

    const { error: completeError } = await supabase.rpc("complete_analysis_job", {
      p_job_id: jobId,
      p_stage: result.stage,
      p_completion_percent: Math.round(result.completion_percent),
      p_risk_level: result.risk_level,
      p_detected_issues: result.detected_issues,
      p_recommendations: result.recommendations,
      p_frame_count: null,
    });

    if (completeError) throw completeError;
    logProcessOneJob({
      job_id: jobId,
      status: "completed",
      duration_ms: Date.now() - startMs,
    });
    return { ok: true, jobId, status: "completed" };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Analysis failed";
    const errorType = message.toLowerCase().includes("timeout")
      ? "timeout"
      : message.toLowerCase().includes("ai analysis failed")
        ? "ai_failure"
        : "unknown";
    await markJobFailed(supabase, jobId, message, errorType);
    logProcessOneJob({
      job_id: jobId,
      status: "failed",
      duration_ms: Date.now() - startMs,
      error_type: errorType,
    });
    return { ok: true, jobId, status: "failed" };
  }
}
