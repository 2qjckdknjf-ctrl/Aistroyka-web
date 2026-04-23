/**
 * Persistence row types and DTOs for plan-fit (Step 4).
 * Selected plan state != billing subscription.
 */

import type { PlanCode } from "@aistroyka/contracts";
import type { AddOnCode } from "@aistroyka/contracts";

export type WorkspacePlanStateSourceKind =
  | "recommendation_selected"
  | "admin_override"
  | "imported_legacy"
  | "manual_backend_set";

export interface PlanFitRecommendationRow {
  id: string;
  tenant_id: string;
  user_id: string | null;
  input_snapshot: unknown;
  recommended_plan_code: string;
  alternative_plan_codes: string[];
  enterprise_signal: boolean;
  reasoning_codes: string[];
  created_at: string;
}

export interface WorkspacePlanStateRow {
  tenant_id: string;
  canonical_plan_code: string;
  source_kind: string;
  selected_by_user_id: string | null;
  selected_at: string;
  add_on_codes: string[];
  created_at: string;
  updated_at: string;
}

export interface WorkspacePlanStateDTO {
  tenantId: string;
  canonicalPlanCode: PlanCode;
  sourceKind: WorkspacePlanStateSourceKind;
  selectedByUserId: string | null;
  selectedAt: string;
  addOnCodes: AddOnCode[];
  createdAt: string;
  updatedAt: string;
}

export interface PlanFitRecommendationDTO {
  id: string;
  tenantId: string;
  userId: string | null;
  inputSnapshot: unknown;
  recommendedPlanCode: PlanCode;
  alternativePlanCodes: PlanCode[];
  enterpriseSignal: boolean;
  reasoningCodes: string[];
  createdAt: string;
}
