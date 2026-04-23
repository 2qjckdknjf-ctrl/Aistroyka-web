/**
 * Plan-fit foundation: plan model, entitlements, capability layer, recommendation.
 * All capability checks must go through this layer.
 *
 * Canonical plan codes: client_personal | team_contractor | business_operations | enterprise.
 * This is the single entrypoint for the new plan-fit model. Do not confuse with the legacy
 * billing tier layer (FREE/PRO/ENTERPRISE in subscription/ and billing/). No mapping
 * Step 2 adds bridge (legacy tier → plan), entitlement resolution, workspace plan context. See docs/architecture/SUBSCRIPTION_AND_CAPABILITY_MODEL.md and PLAN_BRIDGE_AND_ENTITLEMENT_RESOLUTION.md.
 */

export type { PlanCode, AddOnCode, EntitlementLimits } from "@aistroyka/contracts";
export { getPlanEntitlements, PLAN_CODE_LABELS } from "./plans";
export { PLAN_ENTITLEMENTS_DEFAULTS } from "./entitlements-config";
export type { PlanEntitlement, EntitlementCapabilities } from "./entitlements.types";
export {
  ADD_ON_CODES,
  ADD_ON_LABELS,
  getAddOnConfig,
} from "./add-ons";
export type { AddOnConfig } from "./add-ons";
export {
  getWorkspaceCapabilities,
  canCreateProject,
  canInviteUser,
  canUseMobileWorkerFlow,
  canUseApprovals,
  canUseAdvancedApprovals,
  canUseDocuments,
  canUseAdvancedDocuments,
  canUseInspections,
  canUsePortfolioAnalytics,
  canUseManagerAI,
  canUseIntegrations,
  canUseSSO,
  canUseApiAccess,
  canUseAuditLogs,
  hasReachedUserLimit,
  hasReachedProjectLimit,
  hasReachedStorageLimit,
  hasReachedAiLimit,
} from "./capability";
export type { CapabilityInput, UsageSnapshot } from "./capability.types";
export { recommendPlan } from "./recommend";
export type {
  RecommendPlanInput,
  RecommendPlanOutput,
  PersonaType,
  ExpectedUsersRange,
  ExpectedProjectsRange,
  Priority,
  StartMode,
} from "./recommend.types";
export type {
  Subscription,
  WorkspaceEntitlements,
  PlanRecommendation,
  UsageCounters,
  BillingCycle,
  SubscriptionStatus,
  SubscriptionProvider,
} from "./domain.types";

// Step 2: mapping bridge, entitlement resolution, workspace plan context
export { tierToPlanCode, mapLegacyTierToPlan, LEGACY_TIERS } from "./bridge";
export type { LegacyTier, TierToPlanMappingResult } from "./bridge.types";
export {
  resolveBasePlanEntitlements,
  resolveEffectiveWorkspaceEntitlements,
} from "./resolve";
export type {
  ResolveEffectiveWorkspaceEntitlementsInput,
  ResolveEffectiveWorkspaceEntitlementsResult,
} from "./resolve.types";
export {
  isAddOnAllowedForPlan,
  applyAddOnToEntitlements,
  applyAddOnsToEntitlements,
} from "./add-on-rules";
export type {
  AddOnLimitDelta,
  AddOnCapabilityGrants,
  AddOnApplicationResult,
  ApplyAddOnsResult,
} from "./add-on-rules.types";
export {
  resolveWorkspacePlanContext,
  getWorkspacePlanContext,
  buildWorkspacePlanContext,
} from "./workspace-plan-context";
export type {
  WorkspacePlanContext,
  WorkspacePlanSourceKind,
  ResolveWorkspacePlanContextInput,
} from "./workspace-plan-context.types";
export { resolveWorkspaceCapabilities } from "./application-capability";
export type { WorkspaceCapabilitySnapshot } from "./application-capability";

// Step 3: runtime integration adapter layer
export type { WorkspacePlanRuntimeSource } from "./runtime-source.types";
export type { WorkspacePlanRuntimeAdapter } from "./runtime-adapter.types";
export { defaultWorkspacePlanRuntimeAdapter } from "./default-runtime-adapter";
export {
  getWorkspacePlanContextFromRuntime,
  resolveRuntimeWorkspacePlanContext,
} from "./runtime-plan-context.service";
export type { GetWorkspacePlanContextFromRuntimeOptions } from "./runtime-plan-context.service";
export {
  getWorkspaceCapabilitiesFromRuntime,
  requireWorkspaceCapability,
  WorkspaceCapabilityRequiredError,
} from "./runtime-capability.service";
export type {
  RuntimePlanWarningCode,
  RuntimePlanWarning,
  RuntimePlanResultMeta,
} from "./runtime-errors.types";

// Step 4: persistence + backend flow
export type {
  WorkspacePlanStateSourceKind,
  PlanFitRecommendationRow,
  WorkspacePlanStateRow,
  WorkspacePlanStateDTO,
  PlanFitRecommendationDTO,
} from "./persistence/plan-fit.types";
export {
  createPlanRecommendation,
  getLatestPlanRecommendationForWorkspace,
} from "./persistence/plan-fit-recommendation.repository";
export type { CreatePlanRecommendationInput } from "./persistence/plan-fit-recommendation.repository";
export {
  getWorkspaceSelectedPlanState,
  upsertWorkspaceSelectedPlanState,
} from "./persistence/workspace-plan-state.repository";
export type { UpsertWorkspacePlanStateInput } from "./persistence/workspace-plan-state.repository";
export {
  submitPlanFitRecommendation,
  selectWorkspacePlan,
  getWorkspaceSelectedPlan,
  getWorkspaceLatestPlanRecommendation,
  PlanFitValidationError,
  PlanFitNotFoundError,
} from "./plan-fit-backend.service";
export type {
  SubmitPlanFitRecommendationInput,
  SubmitPlanFitRecommendationResult,
  SelectWorkspacePlanInput,
} from "./plan-fit-backend.service";
export {
  PlanFitRecommendRequestSchema,
  PlanFitRecommendResponseSchema,
  PlanFitSelectRequestSchema,
  PlanFitSelectResponseSchema,
  PlanFitCurrentResponseSchema,
} from "./plan-fit-api.schema";
export type {
  PlanFitRecommendRequest,
  PlanFitRecommendResponse,
  PlanFitSelectRequest,
  PlanFitSelectResponse,
  PlanFitCurrentResponse,
  PlanFitOrchestrationResponse,
} from "./plan-fit-api.schema";
export { PlanFitOrchestrationResponseSchema } from "./plan-fit-api.schema";

// Step 11: contextual upgrade prompts
export {
  getUpgradePromptForCapability,
  getDisabledCapabilityPrompts,
  getContextualPlanPrompt,
  getUpgradePromptFallback,
} from "./upgrade-prompt";
export type { UpgradePromptViewModel, CapabilityKeyForPrompt, UpgradePromptVariant } from "./upgrade-prompt.types";
export {
  CAPABILITY_PROMPT_CONFIG,
  UPGRADE_PROMPT_CTA_ROUTE,
  isCapabilityAvailableForPlan,
  getRequiredPlanName,
} from "./upgrade-prompt-config";
export {
  getFeatureUpgradePromptDisplayProps,
  isSafeCtaRoute,
  getCapabilityGateRenderMode,
  shouldShowInlineUpgradeHint,
  getAvailableWithHigherPlansItems,
  allCtaRoutesSafe,
} from "./upgrade-prompt-presentation";
export type {
  FeatureUpgradePromptDisplayProps,
  CapabilityGateRenderMode,
  AvailableWithHigherPlansItem,
} from "./upgrade-prompt-presentation";

// Step 10: plan surface (display, upgrade prompts, no checkout)
export {
  getPlanSurfaceViewModel,
  getPlanSurfaceFallback,
  getUpgradeCtaTargetRoute,
  getPlanBadgeLabel,
  getPlanCardTitle,
  getPlanSurfaceErrorMessage,
} from "./plan-surface";
export { PLAN_DISPLAY_COPY, UPGRADE_CTA_COPY } from "./plan-surface-copy";
export type {
  PlanSurfaceViewModel,
  PlanLimitsSummary,
  CapabilityGroupSummary,
  UpgradeSuggestion,
  UpgradeCtaVariant,
} from "./plan-surface.types";

// Step 5: orchestration
export { getWorkspacePlanFitOrchestrationState } from "./orchestration/orchestration.service";
export { evaluateSetupReadiness } from "./orchestration/setup-readiness.evaluator";
export { computeOrchestrationRules } from "./orchestration/orchestration-rules";
export type {
  WorkspacePlanFitOrchestrationState,
  OrchestrationStatus,
  OrchestrationNextStep,
  SetupReadiness,
  SetupReadinessKind,
  OrchestrationRecommendationSummary,
} from "./orchestration/orchestration.types";
