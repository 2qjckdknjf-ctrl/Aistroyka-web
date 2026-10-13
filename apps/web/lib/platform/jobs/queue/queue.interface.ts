import type { SupabaseClient } from "@supabase/supabase-js";

export interface EnqueueParams {
  tenant_id: string;
  user_id: string | null;
  type: string;
  payload: Record<string, unknown>;
  trace_id: string | null;
  max_attempts?: number;
  dedupe_key?: string | null;
}

export interface JobRecord {
  id: string;
  tenant_id: string;
  user_id: string | null;
  type: string;
  payload: Record<string, unknown>;
  status: string;
  attempts: number;
  max_attempts: number;
  run_after: string;
  locked_by: string | null;
  locked_at: string | null;
  last_error: string | null;
  last_error_type: string | null;
  trace_id: string | null;
  created_at: string;
  updated_at: string;
}

export type JobClaim = Pick<JobRecord, "id" | "tenant_id" | "type" | "locked_by" | "locked_at" | "attempts">;

export interface IQueueAdapter {
  enqueue(supabase: SupabaseClient, params: EnqueueParams): Promise<JobRecord | null>;
  claim(admin: SupabaseClient, workerId: string, limit: number, tenantId?: string | null): Promise<JobRecord[]>;
  tryAcquireSlot(admin: SupabaseClient, claim: JobClaim): Promise<boolean>;
  releaseSlot(admin: SupabaseClient, claim: JobClaim): Promise<void>;
  markSuccess(admin: SupabaseClient, claim: JobClaim): Promise<boolean>;
  markFailedForRetry(
    admin: SupabaseClient,
    claim: JobClaim,
    lastError: string,
    lastErrorType: string,
    runAfter: Date
  ): Promise<boolean>;
  markDead(admin: SupabaseClient, claim: JobClaim, lastError: string, lastErrorType: string): Promise<boolean>;
}
