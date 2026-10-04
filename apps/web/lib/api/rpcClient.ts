/**
 * Typed RPC client for engine. Uses only RPCs from rpcCatalog.
 * Throws with code RPC_NOT_CONFIGURED:<name> if an RPC is not implemented.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  ENGINE_RPC,
  type CreateAnalysisJobParams,
  type AnalysisJobRow,
} from "./rpcCatalog";

const RPC_NOT_CONFIGURED_PREFIX = "RPC_NOT_CONFIGURED:";

export function isMissingCreateAnalysisJobRequestKeyArg(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const err = error as { code?: unknown; message?: unknown };
  const code = typeof err.code === "string" ? err.code : "";
  const message = typeof err.message === "string" ? err.message : "";
  if (code === "PGRST202" || code === "42883") {
    return /create_analysis_job/i.test(message) || /p_request_key/i.test(message);
  }
  return /could not find the function/i.test(message) && /create_analysis_job/i.test(message);
}

export async function callRpc<TResult>(
  supabase: SupabaseClient,
  rpcName: keyof typeof ENGINE_RPC,
  params?: Record<string, unknown>
): Promise<TResult> {
  if (rpcName !== "create_analysis_job") {
    throw new Error(`${RPC_NOT_CONFIGURED_PREFIX}${rpcName}`);
  }
  const { data, error } = await supabase.rpc(
    ENGINE_RPC[rpcName],
    params as Record<string, unknown>
  );
  if (error) throw error;
  return data as TResult;
}

/**
 * Create analysis job (engine RPC). Returns the new job row.
 */
export async function createAnalysisJobRpc(
  supabase: SupabaseClient,
  params: CreateAnalysisJobParams
): Promise<AnalysisJobRow> {
  const base = {
    p_tenant_id: params.p_tenant_id,
    p_media_id: params.p_media_id,
    p_priority: params.p_priority ?? "normal",
  };
  const keyed = params.p_request_key
    ? { ...base, p_request_key: params.p_request_key }
    : base;
  try {
    return await invokeCreateAnalysisJob(supabase, keyed);
  } catch (error) {
    if (params.p_request_key && isMissingCreateAnalysisJobRequestKeyArg(error)) {
      return invokeCreateAnalysisJob(supabase, base);
    }
    throw error;
  }
}

async function invokeCreateAnalysisJob(
  supabase: SupabaseClient,
  params: Record<string, unknown>
): Promise<AnalysisJobRow> {
  const raw = await callRpc<AnalysisJobRow | AnalysisJobRow[]>(
    supabase,
    "create_analysis_job",
    params
  );
  const row = Array.isArray(raw) ? raw[0] : raw;
  if (!row?.id) throw new Error("create_analysis_job returned no row");
  return row;
}

interface TriggerAnalysisJobParams {
  p_job_id: string;
}

interface TriggeredAnalysisJobRow {
  id: string;
  status: string;
}

/** Trigger existing analysis job execution via trigger_analysis RPC. */
export async function triggerAnalysisJobRpc(
  supabase: SupabaseClient,
  params: TriggerAnalysisJobParams
): Promise<TriggeredAnalysisJobRow> {
  const { data, error } = await supabase.rpc("trigger_analysis", {
    p_job_id: params.p_job_id,
  });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.id) throw new Error("trigger_analysis returned no row");
  return row as TriggeredAnalysisJobRow;
}
