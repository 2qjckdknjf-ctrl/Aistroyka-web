import type { JobClaim } from "./queue/queue.interface";
import { JobHandlerError } from "./job.errors";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Job, JobEventType, JobType } from "./job.types";

export interface EnqueueParams {
  tenant_id: string;
  user_id: string | null;
  type: JobType;
  payload: Record<string, unknown>;
  trace_id: string | null;
  max_attempts?: number;
  dedupe_key?: string | null;
}

/** Enqueue a job. When dedupe_key is set, returns existing job if one exists (idempotent). */
export async function enqueue(
  supabase: SupabaseClient,
  params: EnqueueParams
): Promise<Job | null> {
  const row = {
    tenant_id: params.tenant_id,
    user_id: params.user_id,
    type: params.type,
    payload: params.payload,
    trace_id: params.trace_id,
    status: "queued",
    max_attempts: params.max_attempts ?? 5,
    dedupe_key: params.dedupe_key ?? null,
  };
  const { data, error } = await supabase.from("jobs").insert(row).select().single();
  if (!error && data) return data as Job;
  if (error?.code === "23505" && params.dedupe_key) {
    const { data: existing } = await supabase
      .from("jobs")
      .select("*")
      .eq("tenant_id", params.tenant_id)
      .eq("dedupe_key", params.dedupe_key)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const existingJob = existing as Job | null;
    if (!existingJob) return null;
    // Active job: idempotent return. Terminal job: free dedupe_key and insert a new one
    // so resubmit/recovery are not blocked by a prior dead/success row.
    if (existingJob.status === "queued" || existingJob.status === "running") {
      return existingJob;
    }
    await supabase
      .from("jobs")
      .update({ dedupe_key: null, updated_at: new Date().toISOString() })
      .eq("id", existingJob.id)
      .eq("tenant_id", params.tenant_id);
    const { data: retried } = await supabase.from("jobs").insert(row).select().single();
    return (retried as Job | null) ?? null;
  }
  return null;
}

/** Atomically claim up to limit jobs (optionally for one tenant). Use service_role client. */
export async function claim(
  supabase: SupabaseClient,
  workerId: string,
  limit: number,
  tenantId?: string | null
): Promise<Job[]> {
  const { data, error } = await supabase.rpc("claim_jobs", {
    p_worker_id: workerId,
    p_limit: limit,
    p_tenant_id: tenantId ?? null,
  });
  if (error || !Array.isArray(data)) return [];
  return data as Job[];
}

function validClaim(claim: JobClaim): boolean {
  return Boolean(claim.id && claim.tenant_id && claim.type && claim.locked_by && claim.locked_at
    && Number.isInteger(claim.attempts) && claim.attempts >= 0);
}

/** Exact claim predicate also distinguishes a reused worker ID's later lease. */
function withClaim(query: { eq(column: string, value: unknown): unknown }, claim: JobClaim): void {
  // PostgREST filters mutate the same builder. Keep the SDK's result type outside
  // this small predicate helper rather than recursively inferring its generics.
  for (const [column, value] of Object.entries({ id: claim.id, tenant_id: claim.tenant_id, type: claim.type,
    status: "running", locked_by: claim.locked_by, locked_at: claim.locked_at, attempts: claim.attempts })) query.eq(column, value);
}

export async function ownsClaim(supabase: SupabaseClient, claim: JobClaim): Promise<boolean> {
  if (!validClaim(claim)) return false;
  const query = supabase.from("jobs").select("id"); withClaim(query, claim);
  const { data, error } = await query.maybeSingle();
  if (error) throw new JobHandlerError("Execution lease verification unavailable", true, "LEASE_CHECK_UNAVAILABLE");
  return data?.id === claim.id;
}

async function updateClaim(supabase: SupabaseClient, claim: JobClaim, patch: Record<string, unknown>, expectedType?: JobType, requiresSlot = false): Promise<boolean> {
  if (!validClaim(claim)) return false;
  const query = supabase.from("jobs").update({ ...patch,
    updated_at: new Date().toISOString(), locked_by: null, locked_at: null }); withClaim(query, claim);
  if (expectedType) query.eq("type", expectedType);
  if (requiresSlot) {
    query.eq("slot_locked_by", claim.locked_by).eq("slot_locked_at", claim.locked_at).eq("slot_attempts", claim.attempts);
  }
  const { data, error } = await query.select("id").maybeSingle();
  return !error && data?.id === claim.id;
}

/** A stale completion never clears another worker's lease. */
export async function markSuccess(supabase: SupabaseClient, claim: JobClaim, requiresSlot = false): Promise<boolean> {
  return updateClaim(supabase, claim, { status: "success" }, undefined, requiresSlot);
}

export async function markFailedForRetry(supabase: SupabaseClient, claim: JobClaim,
  lastError: string, lastErrorType: string, runAfter: Date, expectedType?: JobType, requiresSlot = false): Promise<boolean> {
  return updateClaim(supabase, claim, { status: "queued", run_after: runAfter.toISOString(),
    last_error: lastError, last_error_type: lastErrorType }, expectedType, requiresSlot);
}

/** Refund a claim that never reached a handler, without touching a replacement. */
export async function requeueUnstarted(supabase: SupabaseClient, claim: JobClaim,
  lastError: string, lastErrorType: string, runAfter: Date): Promise<boolean> {
  return updateClaim(supabase, claim, { status: "queued", attempts: Math.max(0, claim.attempts - 1),
    run_after: runAfter.toISOString(), last_error: lastError, last_error_type: lastErrorType });
}

export async function markDead(supabase: SupabaseClient, claim: JobClaim,
  lastError: string, lastErrorType: string, requiresSlot = false): Promise<boolean> {
  return updateClaim(supabase, claim, { status: "dead", last_error: lastError, last_error_type: lastErrorType }, undefined, requiresSlot);
}

/** Platform events use the existing tenant audit store. Live job_events belongs
 * to analysis_jobs and must not be repurposed for this queue. */
export async function emitEvent(
  supabase: SupabaseClient,
  job: Pick<Job, "id" | "tenant_id" | "user_id" | "trace_id" | "type" | "attempts" | "locked_at">,
  event: JobEventType,
  details?: Record<string, unknown>
): Promise<void> {
  const safe: Record<string, unknown> = { event, job_type: job.type, attempts: job.attempts, claim_locked_at: job.locked_at };
  if (typeof details?.error_type === "string" && /^[a-zA-Z0-9_]{1,64}$/.test(details.error_type)) safe.error_type = details.error_type;
  if (typeof details?.run_after === "string" && Number.isFinite(Date.parse(details.run_after))) safe.run_after = new Date(details.run_after).toISOString();
  try {
    // Await the write so edge requests keep it alive, with a transport deadline.
    // Never persist raw handler errors, payloads, signed URLs or provider output.
    await supabase.from("audit_logs").insert({
      tenant_id: job.tenant_id, user_id: job.user_id ?? null, trace_id: job.trace_id ?? null,
      action: `platform_job_${event}`, resource_type: "platform_job", resource_id: job.id,
      details: safe,
    }).abortSignal(AbortSignal.timeout(2000));
  } catch {
    // Observability failure must not reverse an acknowledged job transition.
  }
}

/** Get job by id (for handlers). */
export async function getById(supabase: SupabaseClient, jobId: string): Promise<Job | null> {
  const { data, error } = await supabase.from("jobs").select("*").eq("id", jobId).maybeSingle();
  if (error || !data) return null;
  return data as Job;
}

/** List jobs by report_id (for analysis-status). Fetches recent jobs for tenant and filters by payload. */
export async function listJobsByReportId(
  supabase: SupabaseClient,
  reportId: string,
  tenantId: string
): Promise<{ id: string; status: string; type: string }[]> {
  const { data, error } = await supabase
    .from("jobs")
    .select("id, status, type, payload")
    .eq("tenant_id", tenantId)
    .or("type.eq.ai_analyze_report,type.eq.ai_analyze_media")
    .limit(500);
  if (error || !data) return [];
  const list = data as { id: string; status: string; type: string; payload?: { report_id?: string } }[];
  return list.filter((r) => r.payload?.report_id === reportId).map(({ id, status, type }) => ({ id, status, type }));
}
