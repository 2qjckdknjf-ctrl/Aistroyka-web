import type { SupabaseClient } from "@supabase/supabase-js";
import * as repo from "../job.repository";
import type { Job } from "../job.types";
import type { IQueueAdapter, EnqueueParams, JobRecord } from "./queue.interface";

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

  async tryAcquireSlot(admin, tenantId) {
    const { data, error } = await admin.rpc("try_acquire_job_slot", { p_tenant_id: tenantId });
    return !error && data === true;
  },

  async releaseSlot(admin, tenantId) {
    await admin.rpc("release_job_slot", { p_tenant_id: tenantId });
  },

  async markSuccess(admin, jobId) {
    return repo.markSuccess(admin, jobId);
  },

  async markFailedForRetry(admin, jobId, lastError, lastErrorType, runAfter) {
    return repo.markFailedForRetry(admin, jobId, lastError, lastErrorType, runAfter);
  },

  async markDead(admin, jobId, lastError, lastErrorType) {
    return repo.markDead(admin, jobId, lastError, lastErrorType);
  },
};
