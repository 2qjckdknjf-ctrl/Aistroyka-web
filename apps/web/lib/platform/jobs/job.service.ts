import type { SupabaseClient } from "@supabase/supabase-js";
import { logStructured } from "@/lib/observability";
import { nextRunAfter } from "./job.config";
import { JobError, JobPayloadError } from "./job.errors";
import * as repo from "./job.repository";
import type { Job, JobType } from "./job.types";
import { getQueueAdapter } from "./queue/queue.service";
import { handleAiAnalyzeMedia } from "./job.handlers/ai-analyze-media";
import { handleAiAnalyzeReport } from "./job.handlers/ai-analyze-report";
import { handleExport } from "./job.handlers/export";
import { handleRetentionCleanup } from "./job.handlers/retention-cleanup";
import { handlePushSend } from "./job.handlers/push-send";
import { handleUploadReconcile } from "./job.handlers/upload-reconcile";
import { handleOpsEventsPrune } from "./job.handlers/ops-events-prune";

export type { Job, JobStatus, JobType } from "./job.types";
export { JOB_CONFIG } from "./job.config";

export interface EnqueueInput {
  tenant_id: string;
  user_id: string | null;
  type: JobType;
  payload: Record<string, unknown>;
  trace_id: string | null;
  max_attempts?: number;
  dedupe_key?: string | null;
}

/** Enqueue one job (idempotent when dedupe_key is set); emits queued event. */
export async function enqueueJob(
  supabase: SupabaseClient,
  input: EnqueueInput
): Promise<Job | null> {
  const job = await repo.enqueue(supabase, {
    tenant_id: input.tenant_id,
    user_id: input.user_id,
    type: input.type,
    payload: input.payload,
    trace_id: input.trace_id,
    max_attempts: input.max_attempts,
    dedupe_key: input.dedupe_key,
  });
  if (job) {
    await repo.emitEvent(supabase, job, "queued", {});
    logStructured({
      event: "job_enqueued",
      job_id: job.id,
      job_type: job.type,
      tenant_id: job.tenant_id,
      request_id: input.trace_id ?? undefined,
    });
  }
  return job;
}

const HANDLERS: Record<JobType, (supabase: SupabaseClient, job: Job) => Promise<void>> = {
  ai_analyze_media: handleAiAnalyzeMedia,
  ai_analyze_report: handleAiAnalyzeReport,
  export: handleExport,
  retention_cleanup: handleRetentionCleanup,
  push_send: handlePushSend,
  upload_reconcile: handleUploadReconcile,
  ops_events_prune: handleOpsEventsPrune,
};

/**
 * Process jobs: claim up to limit, enforce tenant concurrency (try_acquire_job_slot), run handlers, release slot, mark success/fail/dead.
 * Stops when time budget is exceeded. Use admin client.
 */
export async function processJobs(
  admin: SupabaseClient,
  workerId: string,
  options: { limit?: number; tenantId?: string | null; timeBudgetMs?: number }
): Promise<{ processed: number; success: number; failed: number; dead: number }> {
  const limit = Math.min(options.limit ?? 5, 20);
  const budgetMs = options.timeBudgetMs ?? 25_000;
  const start = Date.now();
  const queue = getQueueAdapter();

  const claimed = await repo.claim(admin, workerId, limit, options.tenantId ?? undefined);

  let processed = 0;
  let success = 0;
  let failed = 0;
  let dead = 0;

  for (const job of claimed) {
    if (Date.now() - start >= budgetMs) break;
    if (job.status !== "running" || job.locked_by !== workerId
      || (options.tenantId && job.tenant_id !== options.tenantId)) continue;
    try {
      if (!await repo.ownsClaim(admin, job)) continue;
    } catch {
      // A failed read is not evidence that another worker owns the claim.
      // Requeue only this exact lease; a concurrent replacement remains untouched.
      const runAfter = nextRunAfter(job.attempts);
      if (await repo.markFailedForRetry(admin, job, "Execution lease verification unavailable", "LEASE_CHECK_UNAVAILABLE", runAfter)) {
        await repo.emitEvent(admin, job, "retry", { error_type: "LEASE_CHECK_UNAVAILABLE", run_after: runAfter.toISOString() });
        failed++;
        processed++;
      }
      continue;
    }
    await repo.emitEvent(admin, job, "locked", { worker_id: workerId });

    const acquired = await queue.tryAcquireSlot(admin, job.tenant_id);
    if (!acquired) {
      await repo.markFailedForRetry(admin, job, "Tenant concurrency cap", "CONCURRENCY_CAP", new Date());
      continue;
    }

    const jobStartMs = Date.now();
    const attempts = job.attempts ?? 0;
    logStructured({
      event: "job_started",
      job_id: job.id,
      job_type: job.type,
      tenant_id: job.tenant_id,
      attempts,
      request_id: job.trace_id ?? undefined,
    });

    const handler = HANDLERS[job.type as JobType];
    try {
      if (!handler) {
        if (!await queue.markDead(admin, job, "Unknown job type", "UNKNOWN_TYPE")) continue;
        await repo.emitEvent(admin, job, "failed", { error_type: "unknown_job_type" });
        logStructured({
          event: "job_failed",
          job_id: job.id,
          job_type: job.type,
          tenant_id: job.tenant_id,
          attempts: attempts + 1,
          duration_ms: Date.now() - jobStartMs,
          retryable: false,
          error_code: "UNKNOWN_TYPE",
        });
        dead++;
        processed++;
        continue;
      }
      await handler(admin, job);
      if (!await queue.markSuccess(admin, job)) continue;
      await repo.emitEvent(admin, job, "success", {});
      logStructured({
        event: "job_succeeded",
        job_id: job.id,
        job_type: job.type,
        tenant_id: job.tenant_id,
        duration_ms: Date.now() - jobStartMs,
        attempts: attempts + 1,
      });
      success++;
    } catch (e) {
      const message = e instanceof Error ? e.message : "Handler error";
      const code = e instanceof JobError ? e.code : "JOB_ERROR";
      const retryable = e instanceof JobError ? (e as JobError).retryable : true;
      const attemptCount = attempts + 1;
      if (attemptCount >= job.max_attempts || !retryable || e instanceof JobPayloadError) {
        if (!await queue.markDead(admin, job, message, code)) continue;
        await repo.emitEvent(admin, job, "failed", { error_type: code, message });
        await repo.emitEvent(admin, job, "dead", {});
        logStructured({
          event: "job_failed",
          job_id: job.id,
          job_type: job.type,
          tenant_id: job.tenant_id,
          attempts: attemptCount,
          duration_ms: Date.now() - jobStartMs,
          retryable: false,
          error_code: code,
        });
        dead++;
      } else {
        const runAfter = nextRunAfter(attemptCount);
        if (!await queue.markFailedForRetry(admin, job, message, code, runAfter)) continue;
        await repo.emitEvent(admin, job, "failed", { error_type: code, message });
        await repo.emitEvent(admin, job, "retry", { run_after: runAfter.toISOString() });
        logStructured({
          event: "job_failed",
          job_id: job.id,
          job_type: job.type,
          tenant_id: job.tenant_id,
          attempts: attemptCount,
          duration_ms: Date.now() - jobStartMs,
          retryable: true,
          next_retry_at: runAfter.toISOString(),
          error_code: code,
        });
        failed++;
      }
    } finally {
      await queue.releaseSlot(admin, job.tenant_id);
    }
    processed++;
  }

  return { processed, success, failed, dead };
}
