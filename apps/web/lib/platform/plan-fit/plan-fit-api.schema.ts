/**
 * Request/response schemas for plan-fit API. Uses contracts for plan/add-on codes.
 */

import { z } from "zod";
import { PlanCodeSchema, AddOnCodeSchema } from "@aistroyka/contracts";

const PersonaTypeSchema = z.enum(["client", "contractor", "developer_owner", "supervisor", "other"]);
const ExpectedUsersRangeSchema = z.enum(["1", "2_5", "6_20", "21_100", "100_plus"]);
const ExpectedProjectsRangeSchema = z.enum(["1", "2_5", "6_20", "20_plus"]);
const PrioritySchema = z.enum([
  "execution_control",
  "reports_photo",
  "schedule_control",
  "approvals_documents",
  "quality_defects",
  "owner_visibility",
  "ai_insights",
]);
const StartModeSchema = z.enum(["self_serve", "guided_setup", "demo"]);

export const PlanFitRecommendRequestSchema = z.object({
  personaType: PersonaTypeSchema,
  expectedUsersRange: ExpectedUsersRangeSchema,
  expectedProjectsRange: ExpectedProjectsRangeSchema,
  priorities: z.array(PrioritySchema),
  needsMobileWorkforce: z.boolean(),
  needsFormalProcesses: z.boolean(),
  startMode: StartModeSchema,
});

export const PlanFitRecommendResponseSchema = z.object({
  id: z.string().uuid(),
  recommendedPlanCode: PlanCodeSchema,
  alternativePlanCodes: z.array(PlanCodeSchema),
  enterpriseSignal: z.boolean(),
  reasoningCodes: z.array(z.string()),
  createdAt: z.string(),
});

export const WorkspacePlanStateSourceKindSchema = z.enum([
  "recommendation_selected",
  "admin_override",
  "imported_legacy",
  "manual_backend_set",
]);

export const PlanFitSelectRequestSchema = z.object({
  canonicalPlanCode: PlanCodeSchema,
  sourceKind: WorkspacePlanStateSourceKindSchema.default("recommendation_selected"),
  addOnCodes: z.array(AddOnCodeSchema).optional(),
});

export const PlanFitSelectResponseSchema = z.object({
  tenantId: z.string().uuid(),
  canonicalPlanCode: PlanCodeSchema,
  sourceKind: WorkspacePlanStateSourceKindSchema,
  selectedAt: z.string(),
});

export const PlanFitCurrentResponseSchema = z.object({
  tenantId: z.string().uuid(),
  canonicalPlanCode: PlanCodeSchema,
  sourceKind: WorkspacePlanStateSourceKindSchema,
  selectedByUserId: z.string().uuid().nullable(),
  selectedAt: z.string(),
  addOnCodes: z.array(AddOnCodeSchema),
});

// Step 5: orchestration response
export const OrchestrationStatusSchema = z.enum([
  "no_recommendation",
  "recommendation_ready",
  "plan_selected",
  "setup_ready",
  "dashboard_ready",
  "inconsistent_state",
]);
export const OrchestrationNextStepSchema = z.enum([
  "collect_plan_fit_input",
  "review_recommendation",
  "select_plan",
  "continue_workspace_setup",
  "open_dashboard",
  "resolve_inconsistent_state",
]);
export const SetupReadinessKindSchema = z.enum(["setup_incomplete", "ready_for_dashboard"]);
export const SetupReadinessSchema = z.object({
  kind: SetupReadinessKindSchema,
  projectCount: z.number().int().min(0),
});

// Step 7: setup detail
export const SetupCheckpointSchema = z.enum([
  "first_project_created",
  "workspace_name_set",
  "has_invited_or_collaborator",
]);
export const SetupReadinessKindV2Schema = z.enum([
  "setup_missing",
  "setup_incomplete",
  "minimally_ready",
  "ready_for_dashboard",
]);
export const SetupNextActionKeySchema = z.enum([
  "create_first_project",
  "set_workspace_name",
  "invite_team",
  "open_dashboard",
  "none",
]);
export const SetupDetailSchema = z.object({
  kind: SetupReadinessKindV2Schema,
  projectCount: z.number().int().min(0),
  completedSteps: z.array(SetupCheckpointSchema),
  missingSteps: z.array(SetupCheckpointSchema),
  nextActionKey: SetupNextActionKeySchema,
  targetRoute: z.string().nullable(),
  notes: z.array(z.string()).optional(),
});
export const OrchestrationRecommendationSummarySchema = z.object({
  id: z.string().uuid(),
  recommendedPlanCode: PlanCodeSchema,
  alternativePlanCodes: z.array(PlanCodeSchema),
  enterpriseSignal: z.boolean(),
  reasoningCodes: z.array(z.string()),
  createdAt: z.string(),
});
export const PlanFitOrchestrationResponseSchema = z.object({
  workspaceId: z.string().uuid(),
  hasRecommendation: z.boolean(),
  latestRecommendation: OrchestrationRecommendationSummarySchema.nullable(),
  hasSelectedPlan: z.boolean(),
  selectedPlanState: PlanFitCurrentResponseSchema.extend({
    createdAt: z.string(),
    updatedAt: z.string(),
  }).nullable(),
  currentPlanContext: z
    .object({
      canonicalPlanCode: PlanCodeSchema,
      sourceKind: z.enum(["canonical_plan", "legacy_tier_bridge", "override"]),
    })
    .nullable(),
  setupReadiness: SetupReadinessSchema,
  setup: SetupDetailSchema.optional(),
  orchestrationStatus: OrchestrationStatusSchema,
  nextStep: OrchestrationNextStepSchema,
  canProceedToWorkspaceSetup: z.boolean(),
  canProceedToDashboard: z.boolean(),
  warnings: z.array(z.string()),
  notes: z.array(z.string()).optional(),
});

export type PlanFitRecommendRequest = z.infer<typeof PlanFitRecommendRequestSchema>;
export type PlanFitRecommendResponse = z.infer<typeof PlanFitRecommendResponseSchema>;
export type PlanFitSelectRequest = z.infer<typeof PlanFitSelectRequestSchema>;
export type PlanFitSelectResponse = z.infer<typeof PlanFitSelectResponseSchema>;
export type PlanFitCurrentResponse = z.infer<typeof PlanFitCurrentResponseSchema>;
export type PlanFitOrchestrationResponse = z.infer<typeof PlanFitOrchestrationResponseSchema>;
