import type { SupabaseClient } from "@supabase/supabase-js";
import * as repo from "../job.repository";
import type { IQueueAdapter, EnqueueParams, JobRecord } from "./queue.interface";
import type { JobClaim } from "./queue.interface";
import { JobHandlerError, JobPayloadError } from "../job.errors";
import { logStructured } from "@/lib/observability";

export function slotClaimParams(claim: JobClaim) {
  if (!claim.id || !claim.tenant_id || !claim.type || !claim.locked_by || !claim.locked_at
    || !Number.isInteger(claim.attempts) || claim.attempts < 1) throw new JobPayloadError("Invalid execution slot claim");
  return { p_job_id: claim.id, p_tenant_id: claim.tenant_id, p_worker_id: claim.locked_by,
    p_locked_at: claim.locked_at, p_attempt: claim.attempts, p_expected_type: claim.type };
}

/** DB-backed queue adapter: uses existing jobs table + tenant_concurrency RPCs. */
export const queueDb: IQueueAdapter = {
  async enqueue(supabase, params) {
    const job = await repo.enqueue(supabase, {
      tenant_id: params.tenant_id,
      user_id: params.user_id,
      type: params.type as import("../job.types").JobType,
      payload: params.payload,
      trace_id: params.trace_id,
      max_attempts: params.max_attempts,
      dedupe_key: params.dedupe_key ?? undefined,
    });
    return job as JobRecord | null;
  },

  async claim(admin, workerId, limit, tenantId) {
    const jobs = await repo.claim(admin, workerId, limit, tenantId);
    return jobs as unknown as JobRecord[];
  },

  async tryAcquireSlot(admin, claim) {
    const { data, error } = await admin.rpc("acquire_platform_job_slot", slotClaimParams(claim)).abortSignal(AbortSignal.timeout(2000));
    if (error) throw new JobHandlerError("Execution slots temporarily unavailable", true, "JOB_SLOT_UNAVAILABLE");
    return data === true;
  },

  async releaseSlot(admin, claim) {
    try {
      const { error } = await admin.rpc("release_platform_job_slot", slotClaimParams(claim)).abortSignal(AbortSignal.timeout(2000));
      if (error) throw new Error("slot_release_unavailable");
    } catch {
      // Admission/recovery recomputes capacity from lease-bound rows; an audit or
      // transport failure after acknowledgement must not invent a failed job.
      logStructured({ event: "job_slot_release_unavailable", job_id: claim.id, tenant_id: claim.tenant_id });
    }
  },

  async markSuccess(admin, claim) {
    return repo.markSuccess(admin, claim, true);
  },

  async markFailedForRetry(admin, claim, lastError, lastErrorType, runAfter) {
    return repo.markFailedForRetry(admin, claim, lastError, lastErrorType, runAfter, undefined, true);
  },

  async markDead(admin, claim, lastError, lastErrorType) {
    return repo.markDead(admin, claim, lastError, lastErrorType, true);
  },
};
