import type { RomaExecutionPlan } from "./roma-execution-planner.types";

/**
 * ROMA Execution Engine modes (V1 design — no LIVE_MUTATION).
 * Modes describe intended future runtime behavior; none are active in V1.
 */
export type RomaExecutionMode =
  | "PLAN_ONLY"
  | "DRY_RUN"
  | "SAFE_READONLY_AUDIT"
  | "STAGING_EXECUTION"
  | "PRODUCTION_READONLY_AUDIT"
  | "MANUAL_APPROVAL_REQUIRED";

export type RomaExecutionApprovalKind =
  | "platform_owner"
  | "security_reviewer"
  | "release_owner"
  | "manual_p0_review";

/** Future runtime context for policy evaluation (V1 defaults are fail-closed). */
export type RomaExecutionPolicyContext = {
  /** Global engine activation — V1 always false. */
  engineEnabled: boolean;
  stagingAvailable: boolean;
  productionReadonlyAllowed: boolean;
  evidenceSinkConfigured: boolean;
  ownerApprovalGranted: boolean;
  securityApprovalGranted: boolean;
  releaseApprovalGranted: boolean;
  /** Credential labels from plan → available. */
  credentialsAvailable: Readonly<Record<string, boolean>>;
  /** Device labels from plan → available. */
  devicesAvailable: Readonly<Record<string, boolean>>;
};

export const ROMA_EXECUTION_POLICY_DEFAULT_CONTEXT: RomaExecutionPolicyContext = {
  engineEnabled: false,
  stagingAvailable: false,
  productionReadonlyAllowed: false,
  evidenceSinkConfigured: false,
  ownerApprovalGranted: false,
  securityApprovalGranted: false,
  releaseApprovalGranted: false,
  credentialsAvailable: {},
  devicesAvailable: {},
};

/** Actions permanently forbidden across all V1 modes. */
export const ROMA_FORBIDDEN_EXECUTION_ACTIONS = [
  "deploy",
  "auto_fix",
  "db_mutation",
  "feature_flag_enablement",
  "production_mutation",
  "ci_trigger",
  "catalog_enable_without_owner",
] as const;

export type RomaForbiddenExecutionAction = (typeof ROMA_FORBIDDEN_EXECUTION_ACTIONS)[number];

export type RomaExecutionModeDefinition = {
  mode: RomaExecutionMode;
  label: string;
  description: string;
  stagingFirst: boolean;
  readOnly: boolean;
  requiresEvidenceSink: boolean;
  requiresManualApproval: boolean;
  permitsProductionTarget: boolean;
};

export type RomaExecutionPolicyDecision = {
  version: "v1";
  /** Engine activation — always false in V1 design. */
  executionEnabled: false;
  planId: string;
  /** True when all policy gates pass except global engine activation. */
  policyGatesPassed: boolean;
  /** Always false in V1 — no runs permitted. */
  isExecutable: false;
  allowedModes: readonly RomaExecutionMode[];
  recommendedMode: RomaExecutionMode;
  requiredApprovals: readonly RomaExecutionApprovalKind[];
  blockedReasons: readonly string[];
  requiredEvidence: readonly string[];
  auditRequirements: readonly string[];
  safetyWarnings: readonly string[];
  activationBlockers: readonly string[];
  productionMutationAllowed: false;
  destructiveActionsAllowed: false;
  forbiddenActions: readonly RomaForbiddenExecutionAction[];
  stagingFirstRequired: boolean;
  summary: string;
};

export type RomaExecutionPolicyInput = {
  plan: RomaExecutionPlan;
  context?: Partial<RomaExecutionPolicyContext>;
};
