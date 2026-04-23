/**
 * Canonical input/output types for plan recommendation.
 */

import type { PlanCode } from "@aistroyka/contracts";

export type PersonaType = "client" | "contractor" | "developer_owner" | "supervisor" | "other";

export type ExpectedUsersRange = "1" | "2_5" | "6_20" | "21_100" | "100_plus";

export type ExpectedProjectsRange = "1" | "2_5" | "6_20" | "20_plus";

export type Priority =
  | "execution_control"
  | "reports_photo"
  | "schedule_control"
  | "approvals_documents"
  | "quality_defects"
  | "owner_visibility"
  | "ai_insights";

export type StartMode = "self_serve" | "guided_setup" | "demo";

export interface RecommendPlanInput {
  personaType: PersonaType;
  expectedUsersRange: ExpectedUsersRange;
  expectedProjectsRange: ExpectedProjectsRange;
  priorities: Priority[];
  needsMobileWorkforce: boolean;
  needsFormalProcesses: boolean;
  startMode: StartMode;
}

export interface RecommendPlanOutput {
  recommendedPlanCode: PlanCode;
  alternativePlanCodes: PlanCode[];
  enterpriseSignal: boolean;
  reasoningCodes: string[];
  notes?: string;
}
