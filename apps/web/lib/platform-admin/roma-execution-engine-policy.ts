import { createExecutionPlan, ROMA_EXECUTION_PLANNER_EXAMPLES } from "./roma-execution-planner";
import type { RomaExecutionPlan } from "./roma-execution-planner.types";
import { getTestById } from "./roma-test-catalog";
import type {
  RomaExecutionApprovalKind,
  RomaExecutionMode,
  RomaExecutionModeDefinition,
  RomaExecutionPolicyContext,
  RomaExecutionPolicyDecision,
  RomaExecutionPolicyInput,
  RomaForbiddenExecutionAction,
} from "./roma-execution-engine.types";
import {
  ROMA_EXECUTION_POLICY_DEFAULT_CONTEXT,
  ROMA_FORBIDDEN_EXECUTION_ACTIONS,
} from "./roma-execution-engine.types";

export { ROMA_FORBIDDEN_EXECUTION_ACTIONS };

export const ROMA_EXECUTION_MODE_DEFINITIONS: readonly RomaExecutionModeDefinition[] = [
  {
    mode: "PLAN_ONLY",
    label: "Plan only",
    description: "Materialize and review execution plan; no external calls.",
    stagingFirst: true,
    readOnly: true,
    requiresEvidenceSink: false,
    requiresManualApproval: false,
    permitsProductionTarget: false,
  },
  {
    mode: "DRY_RUN",
    label: "Dry run",
    description: "Simulate phase ordering and evidence collection without invoking runners.",
    stagingFirst: true,
    readOnly: true,
    requiresEvidenceSink: false,
    requiresManualApproval: false,
    permitsProductionTarget: false,
  },
  {
    mode: "SAFE_READONLY_AUDIT",
    label: "Safe readonly audit",
    description: "Read-only probes against staging (health, headers, RBAC gates) with evidence capture.",
    stagingFirst: true,
    readOnly: true,
    requiresEvidenceSink: true,
    requiresManualApproval: false,
    permitsProductionTarget: false,
  },
  {
    mode: "STAGING_EXECUTION",
    label: "Staging execution",
    description: "Run catalog tests against staging after approvals, credentials, and devices are verified.",
    stagingFirst: true,
    readOnly: false,
    requiresEvidenceSink: true,
    requiresManualApproval: true,
    permitsProductionTarget: false,
  },
  {
    mode: "PRODUCTION_READONLY_AUDIT",
    label: "Production readonly audit",
    description: "Read-only production probes (buildStamp, health) — no mutation, no deploy.",
    stagingFirst: true,
    readOnly: true,
    requiresEvidenceSink: true,
    requiresManualApproval: true,
    permitsProductionTarget: true,
  },
  {
    mode: "MANUAL_APPROVAL_REQUIRED",
    label: "Manual approval required",
    description: "Policy gate — owner/security/release sign-off before any non-plan mode.",
    stagingFirst: true,
    readOnly: true,
    requiresEvidenceSink: false,
    requiresManualApproval: true,
    permitsProductionTarget: false,
  },
] as const;

const AUDIT_REQUIREMENTS_BASE: readonly string[] = [
  "Platform owner session with Cloudflare Access gate",
  "Immutable run record (planId, mode, actor, timestamp, evidence refs)",
  "Stop-on-first-failure for release-critical tests",
  "No PASS without captured evidence artifact",
];

const ACTIVATION_BLOCKERS_V1: readonly string[] = [
  "Execution engine V1 is design-only — global activation flag is false",
  "Test catalog entries remain enabled: false",
  "No runner, evidence sink, or run-history store implemented",
  "No UI Run controls (by design)",
  "Owner-gated staging credential vault not wired",
];

function mergeContext(partial?: Partial<RomaExecutionPolicyContext>): RomaExecutionPolicyContext {
  return { ...ROMA_EXECUTION_POLICY_DEFAULT_CONTEXT, ...partial };
}

function isDocsOnlyPlan(plan: RomaExecutionPlan): boolean {
  return (
    plan.releaseImpact === "none" &&
    plan.selectedTests.length === 0 &&
    plan.input.changedPaths.every(
      (p) => /^docs\//i.test(p) || /\.md$/i.test(p) || /^README/i.test(p)
    )
  );
}

function isUnknownPlan(plan: RomaExecutionPlan): boolean {
  return plan.confidence === "unknown";
}

function hasSecuritySensitivePaths(plan: RomaExecutionPlan): boolean {
  return plan.input.changedPaths.some((p) =>
    /middleware|platform-admin|rbac|auth|security|tenant|supabase\/migrations/i.test(p)
  );
}

function hasDisabledCatalogTests(plan: RomaExecutionPlan): string[] {
  const reasons: string[] = [];
  for (const test of plan.selectedTests) {
    const item = getTestById(test.testId);
    if (!item) {
      reasons.push(`Catalog entry missing: ${test.testId}`);
      continue;
    }
    if (!item.enabled) {
      reasons.push(`Catalog test disabled: ${test.testId}`);
    }
  }
  return reasons;
}

function missingCredentials(plan: RomaExecutionPlan, ctx: RomaExecutionPolicyContext): string[] {
  return plan.requiredCredentials.filter((cred) => ctx.credentialsAvailable[cred] !== true);
}

function missingDevices(plan: RomaExecutionPlan, ctx: RomaExecutionPolicyContext): string[] {
  return plan.requiredDevices.filter((device) => ctx.devicesAvailable[device] !== true);
}

function buildRequiredApprovals(plan: RomaExecutionPlan): RomaExecutionApprovalKind[] {
  const approvals = new Set<RomaExecutionApprovalKind>();

  if (plan.manualReviewRequired || hasSecuritySensitivePaths(plan)) {
    approvals.add("platform_owner");
    approvals.add("security_reviewer");
    approvals.add("manual_p0_review");
  }

  if (plan.releaseImpact === "high" || plan.selectedTests.some((t) => t.releaseCritical)) {
    approvals.add("release_owner");
  }

  if (plan.requiredTestDomains.includes("security")) {
    approvals.add("security_reviewer");
  }

  return [...approvals].sort();
}

function approvalBlockers(
  plan: RomaExecutionPlan,
  ctx: RomaExecutionPolicyContext,
  required: readonly RomaExecutionApprovalKind[]
): string[] {
  const blockers: string[] = [];
  if (required.includes("platform_owner") && !ctx.ownerApprovalGranted) {
    blockers.push("Platform owner approval not granted");
  }
  if (required.includes("security_reviewer") && !ctx.securityApprovalGranted) {
    blockers.push("Security reviewer approval not granted");
  }
  if (required.includes("release_owner") && !ctx.releaseApprovalGranted) {
    blockers.push("Release owner approval not granted");
  }
  if (required.includes("manual_p0_review") && plan.manualReviewRequired && !ctx.ownerApprovalGranted) {
    blockers.push("Manual P0/security review not recorded");
  }
  return blockers;
}

function computeAllowedModes(
  plan: RomaExecutionPlan,
  ctx: RomaExecutionPolicyContext,
  blockedReasons: readonly string[]
): RomaExecutionMode[] {
  const modes = new Set<RomaExecutionMode>(["PLAN_ONLY"]);

  if (isUnknownPlan(plan)) {
    modes.add("MANUAL_APPROVAL_REQUIRED");
    return [...modes].sort();
  }

  if (isDocsOnlyPlan(plan)) {
    modes.add("DRY_RUN");
    return [...modes].sort();
  }

  modes.add("DRY_RUN");
  modes.add("MANUAL_APPROVAL_REQUIRED");

  if (plan.manualReviewRequired) {
    return [...modes].sort();
  }

  const hasHardBlockers =
    blockedReasons.some((r) => /disabled|missing|catalog|credentials|devices/i.test(r)) ||
    hasDisabledCatalogTests(plan).length > 0;

  if (!hasHardBlockers && ctx.evidenceSinkConfigured) {
    modes.add("SAFE_READONLY_AUDIT");
  }

  if (
    !hasHardBlockers &&
    ctx.stagingAvailable &&
    ctx.evidenceSinkConfigured &&
    ctx.ownerApprovalGranted
  ) {
    modes.add("STAGING_EXECUTION");
  }

  if (
    !hasHardBlockers &&
    ctx.productionReadonlyAllowed &&
    ctx.evidenceSinkConfigured &&
    ctx.ownerApprovalGranted &&
    ctx.securityApprovalGranted
  ) {
    modes.add("PRODUCTION_READONLY_AUDIT");
  }

  return [...modes].sort();
}

function recommendMode(allowed: readonly RomaExecutionMode[], plan: RomaExecutionPlan): RomaExecutionMode {
  if (isDocsOnlyPlan(plan)) return "DRY_RUN";
  if (isUnknownPlan(plan)) return "MANUAL_APPROVAL_REQUIRED";
  if (plan.manualReviewRequired) return "MANUAL_APPROVAL_REQUIRED";
  if (allowed.includes("STAGING_EXECUTION")) return "STAGING_EXECUTION";
  if (allowed.includes("SAFE_READONLY_AUDIT")) return "SAFE_READONLY_AUDIT";
  if (allowed.includes("DRY_RUN")) return "DRY_RUN";
  return "PLAN_ONLY";
}

function buildSafetyWarnings(plan: RomaExecutionPlan): string[] {
  const warnings: string[] = [
    "V1 engine is design-only — no mode executes tests today",
    "Production mutation is never permitted in any mode",
    "Deploy, auto-fix, DB mutation, and feature-flag enablement are forbidden",
  ];

  if (plan.releaseImpact === "high") {
    warnings.push("High release impact — staging-first mandatory");
  }
  if (plan.manualReviewRequired) {
    warnings.push("Manual review flag set — owner/security approval required before staging execution");
  }
  if (plan.requiredEnvironments.includes("production")) {
    warnings.push("Plan references production — only readonly audit mode may target production");
  }
  return warnings;
}

function buildBlockedReasons(plan: RomaExecutionPlan, ctx: RomaExecutionPolicyContext): string[] {
  const reasons: string[] = [];

  if (!ctx.engineEnabled) {
    reasons.push("Execution engine not activated (V1 design-only)");
  }

  reasons.push(...hasDisabledCatalogTests(plan));

  for (const blocked of plan.blockedTests) {
    reasons.push(`Planner blocked: ${blocked.testId} — ${blocked.reason}`);
  }

  for (const cred of missingCredentials(plan, ctx)) {
    reasons.push(`Missing credential: ${cred}`);
  }
  for (const device of missingDevices(plan, ctx)) {
    reasons.push(`Missing device: ${device}`);
  }

  const requiredApprovals = buildRequiredApprovals(plan);
  reasons.push(...approvalBlockers(plan, ctx, requiredApprovals));

  if (
    plan.selectedTests.some((t) => t.domain === "database") &&
    !ctx.ownerApprovalGranted
  ) {
    reasons.push("Database-domain tests require explicit owner approval (no DB mutation in V1)");
  }

  return [...new Set(reasons)].sort();
}

function modeRequiresEvidenceSink(mode: RomaExecutionMode): boolean {
  const def = ROMA_EXECUTION_MODE_DEFINITIONS.find((d) => d.mode === mode);
  return def?.requiresEvidenceSink ?? false;
}

export function evaluateExecutionPolicy(input: RomaExecutionPolicyInput): RomaExecutionPolicyDecision {
  const plan = input.plan;
  const ctx = mergeContext(input.context);
  const blockedReasons = buildBlockedReasons(plan, ctx);
  const requiredApprovals = buildRequiredApprovals(plan);
  const allowedModes = computeAllowedModes(plan, ctx, blockedReasons);
  const recommendedMode = recommendMode(allowedModes, plan);

  const auditRequirements = [...AUDIT_REQUIREMENTS_BASE];
  if (recommendedMode !== "PLAN_ONLY" && recommendedMode !== "DRY_RUN") {
    auditRequirements.push(`Mode-specific audit trail for ${recommendedMode}`);
  }
  if (plan.manualReviewRequired) {
    auditRequirements.push("Recorded owner/security sign-off linked to planId");
  }

  const activationBlockers = [...ACTIVATION_BLOCKERS_V1];
  if (!ctx.evidenceSinkConfigured) {
    activationBlockers.push("Evidence sink not configured (required for SAFE_READONLY_AUDIT+)");
  }
  if (!ctx.stagingAvailable) {
    activationBlockers.push("Staging environment reachability not verified");
  }

  const hardGateFailures = blockedReasons.filter(
    (r) => !r.includes("Execution engine not activated")
  );

  if (
    recommendedMode !== "PLAN_ONLY" &&
    modeRequiresEvidenceSink(recommendedMode) &&
    !ctx.evidenceSinkConfigured
  ) {
    hardGateFailures.push("Evidence sink required for recommended mode");
  }

  const policyGatesPassed = hardGateFailures.length === 0;
  const safetyWarnings = buildSafetyWarnings(plan);

  return {
    version: "v1",
    executionEnabled: false,
    planId: plan.planId,
    policyGatesPassed,
    isExecutable: false,
    allowedModes,
    recommendedMode,
    requiredApprovals,
    blockedReasons,
    requiredEvidence: [...plan.evidenceRequired].sort(),
    auditRequirements,
    safetyWarnings,
    activationBlockers,
    productionMutationAllowed: false,
    destructiveActionsAllowed: false,
    forbiddenActions: ROMA_FORBIDDEN_EXECUTION_ACTIONS,
    stagingFirstRequired: true,
    summary: buildPolicySummary(plan, allowedModes, recommendedMode, blockedReasons),
  };
}

function buildPolicySummary(
  plan: RomaExecutionPlan,
  allowedModes: readonly RomaExecutionMode[],
  recommendedMode: RomaExecutionMode,
  blockedReasons: readonly string[]
): string {
  return [
    `Policy for ${plan.planId}: recommended ${recommendedMode}.`,
    `Allowed modes: ${allowedModes.join(", ")}.`,
    `Blocked reasons: ${blockedReasons.length}.`,
    `Execution enabled: false (V1 design).`,
  ].join(" ");
}

export function evaluateExecutionPolicyForInput(
  changeInput: Parameters<typeof createExecutionPlan>[0],
  context?: Partial<RomaExecutionPolicyContext>
): RomaExecutionPolicyDecision {
  return evaluateExecutionPolicy({ plan: createExecutionPlan(changeInput), context });
}

export function explainPolicyDecision(decision: RomaExecutionPolicyDecision): string {
  return [
    decision.summary,
    `Policy gates passed: ${decision.policyGatesPassed}.`,
    `Required approvals: ${decision.requiredApprovals.join(", ") || "none"}.`,
    `Activation blockers: ${decision.activationBlockers.length}.`,
    decision.blockedReasons.length > 0
      ? `Top blockers: ${decision.blockedReasons.slice(0, 3).join("; ")}.`
      : "No policy blockers beyond engine activation.",
  ].join(" ");
}

export function getExecutionEngineMeta(): { version: "v1"; executionEnabled: false } {
  return { version: "v1", executionEnabled: false };
}

export function isModePermitted(
  mode: RomaExecutionMode,
  decision: RomaExecutionPolicyDecision
): boolean {
  return decision.allowedModes.includes(mode);
}

export function getForbiddenActionsForMode(_mode: RomaExecutionMode): readonly RomaForbiddenExecutionAction[] {
  return ROMA_FORBIDDEN_EXECUTION_ACTIONS;
}

/** Example policy decisions for ROMA QA Center UI (deterministic). */
export const ROMA_EXECUTION_ENGINE_EXAMPLES: readonly {
  label: string;
  decision: RomaExecutionPolicyDecision;
}[] = ROMA_EXECUTION_PLANNER_EXAMPLES.map((example) => ({
  label: example.label,
  decision: evaluateExecutionPolicyForInput(example.input),
}));

/** Preconditions that must be satisfied before any future engine activation. */
export const ROMA_EXECUTION_ACTIVATION_CHECKLIST: readonly string[] = [
  "Owner approves Execution Engine activation (separate from this design PR)",
  "At least one catalog test enabled with documented rollback",
  "Evidence sink + run-history store deployed on platform-admin boundary",
  "Staging credential vault with scoped read-only tokens",
  "Audit log pipeline for every run (actor, planId, mode, evidence refs)",
  "Manual approval workflow for P0/security/RBAC/platform-admin plans",
  "Safe Readonly Audit runner implemented (no shell exec from web UI)",
  "Production readonly probes isolated from staging runners",
];
