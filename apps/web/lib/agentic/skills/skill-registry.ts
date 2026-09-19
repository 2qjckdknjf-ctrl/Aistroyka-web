/**
 * Explicit skill registry. Unknown names are REJECTED.
 * No dynamic function execution, eval, or model-generated SQL/URL/API paths.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { AgentError, isAgentError } from "../errors";
import { normalizeActionType } from "../policy/policy-levels";
import type { AgentExecutionContext } from "../types";
import type { AgentSkill, SkillDefinition, SkillResult } from "./skill.types";
import { createReadSkills } from "./read-skills";
import {
  assertRuntimeAuthorized,
  DEFAULT_PROJECT_AGENT_PERMISSIONS,
  resolveRuntimeAuthorization,
  type RuntimeApproval,
  type RuntimeAuthorizationAllowed,
  type RuntimeOperationBinding,
} from "../security/runtime-authorization";
import { hashRuntimeSkillInput } from "../security/runtime-operation";
import {
  assertExecutionAuthorizationForSkill,
  buildAgentExecutionEvidencePack,
  buildAgentExecutionFailureEvidencePack,
  type AgentExecutionEvidencePack,
} from "../contracts/execution-evidence-pack";

export const READ_SKILL_IDS = [
  "get_project_state",
  "get_project_summary",
  "get_open_issues",
  "get_overdue_tasks",
  "get_recent_reports",
  "get_project_members",
  "get_project_evidence",
  "get_project_risks",
  "calculate_project_health",
  "find_project_blockers",
] as const;

export type ReadSkillId = (typeof READ_SKILL_IDS)[number];

export class SkillRegistry {
  private readonly byName: Map<string, AgentSkill>;
  private readonly identities: Set<string>;

  constructor(skills: AgentSkill[]) {
    this.byName = new Map();
    this.identities = new Set();

    for (const skill of skills) {
      const { id, name, version } = skill.definition;
      if (!id.trim() || !name.trim() || !version.trim()) {
        throw new AgentError("AGENT_GOVERNANCE_UNAVAILABLE", "invalid_skill_identity", 500);
      }

      const identity = `${id}@${version}`;
      if (this.byName.has(name)) {
        throw new AgentError("AGENT_GOVERNANCE_UNAVAILABLE", `duplicate_skill_name:${name}`, 500);
      }
      if (this.identities.has(identity)) {
        throw new AgentError("AGENT_GOVERNANCE_UNAVAILABLE", `duplicate_skill_identity:${identity}`, 500);
      }

      this.byName.set(name, skill);
      this.identities.add(identity);
    }
  }

  get(name: string): AgentSkill | undefined {
    return this.byName.get(name);
  }

  require(name: string): AgentSkill {
    const skill = this.byName.get(name);
    if (!skill) {
      throw new AgentError("AGENT_UNKNOWN_SKILL", `unknown_skill:${name}`, 400);
    }
    return skill;
  }

  listDefinitions(): SkillDefinition[] {
    return [...this.byName.values()].map((s) => s.definition);
  }

  isRegistered(name: string): boolean {
    return this.byName.has(name);
  }

  allowedReadSkills(
    context: AgentExecutionContext,
    agentPermissions: readonly string[] = DEFAULT_PROJECT_AGENT_PERMISSIONS
  ): string[] {
    return this.listDefinitions()
      .filter((d) => d.executionMode === "READ")
      .filter((d) =>
        resolveRuntimeAuthorization({
          skill: this.require(d.name).definition,
          context,
          agentPermissions,
        }).allowed
      )
      .map((d) => d.name);
  }
}

export function createSkillRegistry(supabase: SupabaseClient): SkillRegistry {
  return new SkillRegistry(createReadSkills(supabase));
}

export interface RuntimeApprovalClaimInput {
  approval: RuntimeApproval;
  operation: RuntimeOperationBinding;
  context: AgentExecutionContext;
  skill: Pick<SkillDefinition, "id" | "name" | "version" | "executionMode">;
  /** Caller wall-clock immediately before the claim; useful for audit/cross-checking. */
  claimRequestedAt: string;
}

export type RuntimeApprovalClaimResult =
  | { claimed: true; consumedAt: string }
  | { claimed: false; reason?: string };

/**
 * Must atomically transition the trusted approval from APPROVED to CONSUMED for
 * exactly the supplied approval + operation binding. The atomic predicate MUST also
 * verify that the stored approval is still unconsumed and unexpired at database claim
 * time. Returning claimed=false is treated as a replay/concurrency/expiry denial.
 * `consumedAt` must be the timestamp written by that same atomic claim. The handler is
 * never invoked if the returned consumption timestamp proves invalid chronology.
 */
export type RuntimeApprovalClaimer = (
  input: RuntimeApprovalClaimInput
) => Promise<RuntimeApprovalClaimResult>;

export interface ExecuteRegisteredSkillOptions {
  /** Explicit capability grant for the agent runtime. Defaults to the Slice-01 read-only profile. */
  agentPermissions?: readonly string[];
  /** Server-generated parent run identity. A unique fallback is generated for non-orchestrator callers. */
  runId?: string;
  /** Approval evidence must come from a trusted approval store, never model output. */
  approval?: RuntimeApproval | null;
  /** Trusted immutable proposed-action identity. Required whenever approval is required. */
  operationId?: string;
  /** Trusted action type for policy + approval binding. Required whenever approval is required. */
  actionType?: string;
  /** Required for approval-gated execution. Must perform an atomic single-use, unexpired claim. */
  claimApproval?: RuntimeApprovalClaimer;
}

/**
 * Handler errors after authorization carry their governed failure pack so callers can
 * durably record the consumed approval and exact operation even when execution fails.
 */
export class GovernedSkillExecutionError extends Error {
  readonly originalError: unknown;
  readonly evidencePack: AgentExecutionEvidencePack;

  constructor(originalError: unknown, evidencePack: AgentExecutionEvidencePack) {
    super(originalError instanceof Error ? originalError.message : "governed_skill_execution_failed");
    this.name = "GovernedSkillExecutionError";
    this.originalError = originalError;
    this.evidencePack = evidencePack;
  }
}

export function isGovernedSkillExecutionError(value: unknown): value is GovernedSkillExecutionError {
  return value instanceof GovernedSkillExecutionError;
}

export async function executeRegisteredSkill(
  registry: SkillRegistry,
  context: AgentExecutionContext,
  name: string,
  input: unknown,
  options: ExecuteRegisteredSkillOptions = {}
): Promise<{
  definition: SkillDefinition;
  result: SkillResult;
  authorization: RuntimeAuthorizationAllowed;
  evidencePack: AgentExecutionEvidencePack;
}> {
  const skill = registry.require(name);
  const executionRunId = options.runId?.trim() || crypto.randomUUID();

  // Validate before hashing/authorization so approval is bound to the exact canonical
  // input the handler will execute, not raw or model-controlled request material.
  const parsed = skill.validateInput(input);
  const operation = await buildRuntimeOperationBinding(skill.definition, parsed, options);
  let authorization = assertRuntimeAuthorized({
    skill: skill.definition,
    context,
    agentPermissions: options.agentPermissions ?? DEFAULT_PROJECT_AGENT_PERMISSIONS,
    approval: options.approval,
    actionType: options.actionType,
    operation,
  });

  assertExecutionAuthorizationForSkill(authorization, skill.definition);

  // Skill-local authorization runs before approval consumption, so a scope/role denial
  // cannot burn a valid approval.
  await skill.authorize(context);

  if (authorization.approvalRequired) {
    if (!options.approval || !operation || !options.claimApproval) {
      throw new AgentError("AGENT_POLICY_DENIED", "approval_atomic_claim_required", 403);
    }

    const claimRequestedAt = new Date().toISOString();
    assertApprovalUnexpiredAt(options.approval, claimRequestedAt, "approval_expired_before_claim");

    const claim = await options.claimApproval({
      approval: options.approval,
      operation,
      context,
      skill: {
        id: skill.definition.id,
        name: skill.definition.name,
        version: skill.definition.version,
        executionMode: skill.definition.executionMode,
      },
      claimRequestedAt,
    });
    const claimVerifiedAt = new Date().toISOString();

    if (!claim.claimed) {
      throw new AgentError(
        "AGENT_POLICY_DENIED",
        claim.reason?.trim() || "approval_claim_failed_or_replayed",
        403
      );
    }

    const consumedAt = claim.consumedAt?.trim();
    const consumedAtMs = consumedAt ? Date.parse(consumedAt) : Number.NaN;
    if (!consumedAt || !Number.isFinite(consumedAtMs)) {
      throw new AgentError("AGENT_GOVERNANCE_UNAVAILABLE", "approval_claim_missing_timestamp", 500);
    }

    assertApprovalConsumptionChronology(options.approval, consumedAt, claimVerifiedAt);
    authorization = { ...authorization, approvalConsumedAt: new Date(consumedAtMs).toISOString() };
    assertExecutionAuthorizationForSkill(authorization, skill.definition, {
      requireConsumedApproval: true,
    });
  }

  let result: SkillResult;
  try {
    result = await skill.execute(context, parsed);
  } catch (err) {
    const failureCode = isAgentError(err) ? err.code : "AGENT_SKILL_FAILED";
    const evidencePack = buildAgentExecutionFailureEvidencePack({
      runId: executionRunId,
      context,
      skill: skill.definition,
      authorization,
      failureCode,
    });
    throw new GovernedSkillExecutionError(err, evidencePack);
  }

  const evidencePack = buildAgentExecutionEvidencePack({
    runId: executionRunId,
    context,
    skill: skill.definition,
    authorization,
    result,
  });

  return { definition: skill.definition, result, authorization, evidencePack };
}

async function buildRuntimeOperationBinding(
  skill: SkillDefinition,
  parsedInput: unknown,
  options: ExecuteRegisteredSkillOptions
): Promise<RuntimeOperationBinding | null> {
  if (!options.operationId && !options.actionType) return null;
  if (!options.operationId?.trim() || !options.actionType?.trim()) {
    throw new AgentError("AGENT_POLICY_DENIED", "operation_binding_incomplete", 403);
  }

  return {
    operationId: options.operationId.trim(),
    actionType: normalizeActionType(options.actionType),
    inputHash: await hashRuntimeSkillInput(parsedInput),
    skillVersion: skill.version,
  };
}

function assertApprovalUnexpiredAt(
  approval: RuntimeApproval,
  at: string,
  expiredReason: string
): void {
  if (!approval.expiresAt) return;
  const expiresAtMs = Date.parse(approval.expiresAt);
  const atMs = Date.parse(at);
  if (!Number.isFinite(expiresAtMs) || !Number.isFinite(atMs)) {
    throw new AgentError("AGENT_POLICY_DENIED", "approval_expiry_invalid", 403);
  }
  if (expiresAtMs <= atMs) {
    throw new AgentError("AGENT_POLICY_DENIED", expiredReason, 403);
  }
}

function assertApprovalConsumptionChronology(
  approval: RuntimeApproval,
  consumedAt: string,
  verifiedAt: string
): void {
  const approvedAtMs = Date.parse(approval.approvedAt);
  const consumedAtMs = Date.parse(consumedAt);
  const verifiedAtMs = Date.parse(verifiedAt);
  if (!Number.isFinite(approvedAtMs) || !Number.isFinite(consumedAtMs) || !Number.isFinite(verifiedAtMs)) {
    throw new AgentError("AGENT_POLICY_DENIED", "approval_chronology_invalid", 403);
  }
  if (approvedAtMs > consumedAtMs) {
    throw new AgentError("AGENT_POLICY_DENIED", "approval_consumed_before_approval", 403);
  }
  if (consumedAtMs > verifiedAtMs) {
    throw new AgentError("AGENT_POLICY_DENIED", "approval_consumed_in_future", 403);
  }
  assertApprovalUnexpiredAt(approval, consumedAt, "approval_expired_during_claim");
}

/**
 * Model-selected extra skills. Unknown names are rejected, never executed.
 */
export function selectSkillsFromAllowlist(
  registry: SkillRegistry,
  requested: unknown,
  allowlist: string[]
): { accepted: string[]; rejected: string[] } {
  if (!Array.isArray(requested)) {
    return { accepted: [], rejected: [] };
  }
  const accepted: string[] = [];
  const rejected: string[] = [];
  const allow = new Set(allowlist);
  for (const item of requested) {
    if (typeof item !== "string" || !allow.has(item) || !registry.isRegistered(item)) {
      rejected.push(typeof item === "string" ? item : "non_string");
      continue;
    }
    accepted.push(item);
  }
  return { accepted, rejected };
}
