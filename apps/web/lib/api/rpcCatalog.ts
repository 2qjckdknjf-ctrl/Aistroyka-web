/**
 * Engine RPC catalog (from contracts/web-engine-integration.md).
 * Only RPCs that the web is allowed to call are defined here.
 * Do not add RPC names that are not present in the engine.
 */

export const ENGINE_RPC = {
  create_analysis_job: "create_analysis_job",
} as const;

export type EngineRpcName = keyof typeof ENGINE_RPC;

export interface CreateAnalysisJobParams {
  p_tenant_id: string;
  p_media_id: string;
  p_priority?: "high" | "normal" | "low";
}

export interface AnalysisJobRow {
  id: string;
  media_id: string;
  tenant_id: string;
  status: string;
  started_at: string;
  finished_at: string | null;
  error_message: string | null;
  priority?: string;
}
