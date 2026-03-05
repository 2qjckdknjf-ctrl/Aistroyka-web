import type { SupabaseClient } from "@supabase/supabase-js";
import { nextRunAfter } from "./job.config";
import { JobError, JobPayloadError } from "./job.errors";
import * as repo from "./job.repository";
import type { Job, JobType } from "./job.types";
import { getQueueAdapter } from "./queue/queue.service";
import { handleAiAnalyzeMedia } from "./job.handlers/ai-analyze-media";
import { handleAiAnalyzeReport } from "./job.handlers/ai-analyze-report";
import { handleExport } from "./job.handlers/export";
import { handleRetentionCleanup } from "./job.handlers/retention-cleanup";

export type { Job, JobStatus, JobType } from "./job.types";
export { JOB_CONFIG } from "./job.config";

export interface EnqueueInput {
  tenant_id: string;
  user_id: string | null;
  type: JobType;
  payload: Record<string, unknown>;
  trace_id: string | null;
  max_attempts?: number;
}

/** Enqueue one job; emits queued event. */
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
  });
  if (job) await repo.emitEvent(supabase, job.id, "queued", {});
  return job;
}

const HANDLERS: Record<JobType, (supabase: SupabaseClient, job: Job) => Promise<void>> = {
  ai_analyze_media: handleAiAnalyzeMedia,
  ai_analyze_report: handleAiAnalyzeReport,
  export: handleExport,
  retention_cleanup: handleRetentionCleanup,
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
  for (const job of claimed) {
    await repo.emitEvent(admin, job.id, "locked", { worker_id: workerId });
  }

  let processed = 0;
  let success = 0;
  let failed = 0;
  let dead = 0;

  for (const job of claimed) {
    if (Date.now() - start >= budgetMs) break;

    const acquired = await queue.tryAcquireSlot(admin, job.tenant_id);
    if (!acquired) {
      await repo.markFailedForRetry(admin, job.id, "Tenant concurrency cap", "CONCURRENCY_CAP", new Date());
      continue;
    }

    const handler = HANDLERS[job.type as JobType];
    try {
      if (!handler) {
        await repo.emitEvent(admin, job.id, "failed", { error_type: "unknown_job_type" });
        await queue.markDead(admin, job.id, "Unknown job type", "UNKNOWN_TYPE");
        dead++;
        processed++;
        continue;
      }
      await handler(admin, job);
      await queue.markSuccess(admin, job.id);
      await repo.emitEvent(admin, job.id, "success", {});
      success++;
    } catch (e) {
      const message = e instanceof Error ? e.message : "Handler error";
      const code = e instanceof JobError ? e.code : "JOB_ERROR";
      const retryable = e instanceof JobError ? (e as JobError).retryable : true;
      const attempts = job.attempts + 1;
      await repo.emitEvent(admin, job.id, "failed", { error_type: code, message });
      if (attempts >= job.max_attempts || !retryable || e instanceof JobPayloadError) {
        await queue.markDead(admin, job.id, message, code);
        await repo.emitEvent(admin, job.id, "dead", {});
        dead++;
      } else {
        const runAfter = nextRunAfter(attempts);
        await queue.markFailedForRetry(admin, job.id, message, code, runAfter);
        await repo.emitEvent(admin, job.id, "retry", { run_after: runAfter.toISOString() });
        failed++;
      }
    } finally {
      await queue.releaseSlot(admin, job.tenant_id);
    }
    processed++;
  }

  return { processed, success, failed, dead };
}
