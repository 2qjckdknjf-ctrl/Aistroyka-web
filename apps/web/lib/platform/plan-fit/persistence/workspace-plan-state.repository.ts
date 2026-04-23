/**
 * Workspace (tenant) selected plan state persistence. Not billing.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { PlanCode, AddOnCode } from "@aistroyka/contracts";
import type {
  WorkspacePlanStateRow,
  WorkspacePlanStateDTO,
  WorkspacePlanStateSourceKind,
} from "./plan-fit.types";

const SOURCE_KINDS: WorkspacePlanStateSourceKind[] = [
  "recommendation_selected",
  "admin_override",
  "imported_legacy",
  "manual_backend_set",
];

function toSourceKind(s: string): WorkspacePlanStateSourceKind {
  return SOURCE_KINDS.includes(s as WorkspacePlanStateSourceKind) ? (s as WorkspacePlanStateSourceKind) : "manual_backend_set";
}

function rowToDto(row: WorkspacePlanStateRow): WorkspacePlanStateDTO {
  const addOnCodes = Array.isArray(row.add_on_codes) ? row.add_on_codes : [];
  return {
    tenantId: row.tenant_id,
    canonicalPlanCode: row.canonical_plan_code as PlanCode,
    sourceKind: toSourceKind(row.source_kind),
    selectedByUserId: row.selected_by_user_id ?? null,
    selectedAt: row.selected_at,
    addOnCodes: addOnCodes as AddOnCode[],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getWorkspaceSelectedPlanState(
  supabase: SupabaseClient,
  tenantId: string
): Promise<WorkspacePlanStateDTO | null> {
  const { data, error } = await supabase
    .from("workspace_plan_state")
    .select("tenant_id, canonical_plan_code, source_kind, selected_by_user_id, selected_at, add_on_codes, created_at, updated_at")
    .eq("tenant_id", tenantId)
    .maybeSingle();
  if (error || !data) return null;
  return rowToDto(data as WorkspacePlanStateRow);
}

export interface UpsertWorkspacePlanStateInput {
  tenantId: string;
  canonicalPlanCode: PlanCode;
  sourceKind: WorkspacePlanStateSourceKind;
  selectedByUserId?: string | null;
  addOnCodes?: AddOnCode[];
}

export async function upsertWorkspaceSelectedPlanState(
  supabase: SupabaseClient,
  input: UpsertWorkspacePlanStateInput
): Promise<{ data: WorkspacePlanStateDTO | null; error: string | null }> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("workspace_plan_state")
    .upsert(
      {
        tenant_id: input.tenantId,
        canonical_plan_code: input.canonicalPlanCode,
        source_kind: input.sourceKind,
        selected_by_user_id: input.selectedByUserId ?? null,
        selected_at: now,
        add_on_codes: input.addOnCodes ?? [],
        updated_at: now,
      },
      { onConflict: "tenant_id" }
    )
    .select("tenant_id, canonical_plan_code, source_kind, selected_by_user_id, selected_at, add_on_codes, created_at, updated_at")
    .single();
  if (error) return { data: null, error: error.message };
  return { data: rowToDto(data as WorkspacePlanStateRow), error: null };
}
