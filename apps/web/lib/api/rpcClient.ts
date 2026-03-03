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
  const raw = await callRpc<AnalysisJobRow | AnalysisJobRow[]>(
    supabase,
    "create_analysis_job",
    {
      p_tenant_id: params.p_tenant_id,
      p_media_id: params.p_media_id,
      p_priority: params.p_priority ?? "normal",
    }
  );
  const row = Array.isArray(raw) ? raw[0] : raw;
  if (!row?.id) throw new Error("create_analysis_job returned no row");
  return row;
}
