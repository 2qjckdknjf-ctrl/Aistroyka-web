/**
 * AI Brain Phase D — Run record repository.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { AiRunRecord, AiVersionRef } from "./run.types";

export interface CreateRunRecordInput {
  runId: string;
  tenantId: string;
  projectId?: string | null;
  userId?: string | null;
  route: string;
  mode: string;
  truthSnapshotRef?: string | null;
  actionPlanRefs?: string[];
  memoryRefs?: string[];
  outputContractType?: string;
  degradedFlags?: string[];
  executionTimingMs?: number | null;
  validationResult?: "ok" | "partial" | "fail" | null;
  versionRefs?: AiVersionRef[];
}

export async function createRunRecord(
  supabase: SupabaseClient,
  input: CreateRunRecordInput
): Promise<AiRunRecord | null> {
  const { data, error } = await supabase
    .from("ai_run_records")
    .insert({
      run_id: input.runId,
      tenant_id: input.tenantId,
      project_id: input.projectId ?? null,
      user_id: input.userId ?? null,
      route: input.route,
      mode: input.mode,
      truth_snapshot_ref: input.truthSnapshotRef ?? null,
      action_plan_refs: input.actionPlanRefs ?? [],
      memory_refs: input.memoryRefs ?? [],
      output_contract_type: input.outputContractType ?? null,
      degraded_flags: input.degradedFlags ?? [],
      execution_timing_ms: input.executionTimingMs ?? null,
      validation_result: input.validationResult ?? null,
      version_refs: input.versionRefs ?? [],
    })
    .select("id, run_id, tenant_id, project_id, user_id, route, mode, truth_snapshot_ref, action_plan_refs, memory_refs, output_contract_type, degraded_flags, execution_timing_ms, validation_result, version_refs, created_at")
    .single();

  if (error || !data) return null;

  const d = data as Record<string, unknown>;
  return {
    runId: (d.run_id ?? d.id) as string,
    id: d.id as string,
    tenantId: d.tenant_id as string,
    projectId: (d.project_id as string) ?? null,
    userId: (d.user_id as string) ?? null,
    route: d.route as string,
    mode: d.mode as string,
    truthSnapshotRef: (d.truth_snapshot_ref as string) ?? null,
    actionPlanRefs: (d.action_plan_refs as string[]) ?? [],
    memoryRefs: (d.memory_refs as string[]) ?? [],
    outputContractType: (d.output_contract_type as string) ?? "",
    degradedFlags: (d.degraded_flags as string[]) ?? [],
    executionTimingMs: (d.execution_timing_ms as number) ?? null,
    validationResult: (d.validation_result as "ok" | "partial" | "fail") ?? null,
    versionRefs: (d.version_refs as AiVersionRef[]) ?? [],
    createdAt: d.created_at as string,
  };
}

/** Look up run record id by textual run_id (requestId) for feedback linking. */
export async function getRunRecordIdByRunId(
  supabase: SupabaseClient,
  runId: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from("ai_run_records")
    .select("id")
    .eq("run_id", runId)
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return (data as { id: string }).id;
}
