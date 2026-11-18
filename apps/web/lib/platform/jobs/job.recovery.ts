import type { SupabaseClient } from "@supabase/supabase-js";
import { JOB_CONFIG } from "./job.config";
import { JobHandlerError, JobPayloadError } from "./job.errors";
import * as repo from "./job.repository";
import type { Job } from "./job.types";
import { slotClaimParams } from "./queue/queue.db";

// These handlers are scoped, conditional/idempotent maintenance. Replaying
// provider calls or deliveries requires their separate result/outbox contracts.
const REPEATABLE_TYPES = ["upload_reconcile", "ops_events_prune", "retention_cleanup"] as const;

/** Called by the protected platform scheduler for one server-listed tenant. */
export async function recoverExpiredMaintenanceClaims(admin: SupabaseClient, tenantId: string): Promise<{requeued: number; dead: number}> {
  if (!tenantId) throw new JobPayloadError("Maintenance recovery requires tenant scope");
  const cutoff = new Date(Date.now() - JOB_CONFIG.MAINTENANCE_LEASE_TTL_MS).toISOString();
  const { data, error } = await admin.from("jobs").select("*")
    .eq("tenant_id", tenantId).eq("status", "running")
    .in("type", [...REPEATABLE_TYPES]).lt("locked_at", cutoff)
    .not("locked_by", "is", null).order("locked_at").limit(20);
  if (error) throw new JobHandlerError("Maintenance recovery lookup unavailable", true, "MAINTENANCE_RECOVERY_UNAVAILABLE");
  const recovered = {requeued:0,dead:0};
  for (const job of (data ?? []) as Job[]) {
    if (job.tenant_id !== tenantId || job.status !== "running"
      || !REPEATABLE_TYPES.some(type => type === job.type) || !job.locked_by || !job.locked_at
      || !(Date.parse(job.locked_at) < Date.parse(cutoff))) continue;
    const {data: outcome,error: recoveryError} = await admin.rpc("recover_expired_platform_job_claim",slotClaimParams(job)).abortSignal(AbortSignal.timeout(2000));
    if (recoveryError) throw new JobHandlerError("Maintenance recovery unavailable",true,"MAINTENANCE_RECOVERY_UNAVAILABLE");
    if (outcome === "queued") {
      await repo.emitEvent(admin,job,"retry",{error_type:"EXPIRED_MAINTENANCE_LEASE"});recovered.requeued++;
    } else if (outcome === "dead") {
      await repo.emitEvent(admin,job,"dead",{error_type:"MAX_ATTEMPTS_EXPIRED"});recovered.dead++;
    }

  }
  return recovered;
}
