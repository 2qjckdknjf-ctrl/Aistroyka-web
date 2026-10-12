/**
 * Fail-closed runtime authorization for agent skills.
 *
 * Effective capability is the intersection of:
 * 1) the user's RBAC permission set,
 * 2) the agent's explicit capability grants,
 * 3) the skill's required permissions,
 * plus the deterministic policy resolver and optional trusted approval evidence.
 *
 * This module never consults an LLM and never accepts scope from model output.
 */

import { ACTION_TO_PERMISSION } from "@/lib/authz/authz.policy";
import { AgentError, type AgentErrorCode } from "../errors";
import { resolveAgentActionPolicy } from "../policy/policy-resolver";
import type { SkillDefinition } from "../skills/skill.types";
import type { AgentExecutionContext, PolicyLevel, SkillExecutionMode } from "../types";

export const RUNTIME_AUTHZ_POLICY_VERSION = "agentic-runtime-authz-v1" as const;

/** Slice-01 Project Agent is intentionally read-only. */
export const DEFAULT_PROJECT_AGENT_PERMISSIONS = ["project:read"] as const;

export interface RuntimeApproval {
  approvalId: string;
  tenantId: string;
  projectId: string;
  skillName: string;
  actionType?: string | null;
  approvedBy: string;
  approvedAt: string;
  expiresAt?: string | null;
}

export interface RuntimeAuthorizationInput {
  skill: SkillDefinition;
  context: AgentExecutionContext;
  agentPermissions: readonly string[];
  actionType?: string;
  requestedMode?: SkillExecutionMode;
  approval?: RuntimeApproval | null;
  now?: Date;
}

interface RuntimeAuthorizationBase {
  policyVersion: typeof RUNTIME_AUTHZ_POLICY_VERSION;
  effectivePermissions: string[];
  approvalRequired: boolean;
  approvalId: string | null;
  level: PolicyLevel | null;
}

export interface RuntimeAuthorizationAllowed extends RuntimeAuthorizationBase {
  allowed: true;
  status: "ALLOW";
}

export interface RuntimeAuthorizationDenied extends RuntimeAuthorizationBase {
  allowed: false;
  status: "DENY" | "REQUIRE_APPROVAL";
  code: AgentErrorCode;
  reason: string;
}

export type RuntimeAuthorizationDecision = RuntimeAuthorizationAllowed | RuntimeAuthorizationDenied;

export function resolveRuntimeAuthorization(input: RuntimeAuthorizationInput): RuntimeAuthorizationDecision {
  const base = resolveAgentActionPolicy({
    skill: input.skill,
    context: input.context,
    actionType: input.actionType,
    requestedMode: input.requestedMode,
  });

  if (!base.allowed) {
    return deny(base.code, base.reason, [], false, null);
  }

  const agentPermissions = new Set(input.agentPermissions);
  const effectivePermissions: string[] = [];

  for (const required of input.skill.requiredPermissions) {
    if (!agentPermissions.has(required)) {
      return deny(
        "AGENT_UNAUTHORIZED",
        `agent_missing_permission:${required}`,
        effectivePermissions,
        base.approvalRequired,
        base.level
      );
    }

    if (!userHasRequiredPermission(input.context, required)) {
      return deny(
        "AGENT_UNAUTHORIZED",
        `user_missing_permission:${required}`,
        effectivePermissions,
        base.approvalRequired,
        base.level
      );
    }

    effectivePermissions.push(required);
  }

  if (base.approvalRequired) {
    const approvalCheck = validateApproval(input, input.now ?? new Date());
    if (!approvalCheck.valid) {
      return {
        allowed: false,
        status: "REQUIRE_APPROVAL",
        code: "AGENT_POLICY_DENIED",
        reason: approvalCheck.reason,
        policyVersion: RUNTIME_AUTHZ_POLICY_VERSION,
        effectivePermissions,
        approvalRequired: true,
        approvalId: null,
        level: base.level,
      };
    }

    return {
      allowed: true,
      status: "ALLOW",
      policyVersion: RUNTIME_AUTHZ_POLICY_VERSION,
      effectivePermissions,
      approvalRequired: true,
      approvalId: input.approval?.approvalId ?? null,
      level: base.level,
    };
  }

  return {
    allowed: true,
    status: "ALLOW",
    policyVersion: RUNTIME_AUTHZ_POLICY_VERSION,
    effectivePermissions,
    approvalRequired: false,
    approvalId: null,
    level: base.level,
  };
}

export function assertRuntimeAuthorized(input: RuntimeAuthorizationInput): RuntimeAuthorizationAllowed {
  const decision = resolveRuntimeAuthorization(input);
  if (!decision.allowed) {
    throw new AgentError(decision.code, decision.reason, 403);
  }
  return decision;
}

function userHasRequiredPermission(context: AgentExecutionContext, required: string): boolean {
  if (context.permissions.includes(required)) return true;

  const mappedPermission = ACTION_TO_PERMISSION[required];
  return Boolean(mappedPermission && context.permissions.includes(mappedPermission));
}

function validateApproval(
  input: RuntimeAuthorizationInput,
  now: Date
): { valid: true } | { valid: false; reason: string } {
  const approval = input.approval;
  if (!approval) return { valid: false, reason: "approval_required" };
  if (approval.tenantId !== input.context.tenantId) return { valid: false, reason: "approval_tenant_mismatch" };
  if (approval.projectId !== input.context.projectId) return { valid: false, reason: "approval_project_mismatch" };
  if (approval.skillName !== input.skill.name) return { valid: false, reason: "approval_skill_mismatch" };
  if (input.actionType && approval.actionType !== input.actionType) {
    return { valid: false, reason: "approval_action_mismatch" };
  }
  if (approval.expiresAt && new Date(approval.expiresAt).getTime() <= now.getTime()) {
    return { valid: false, reason: "approval_expired" };
  }
  return { valid: true };
}

function deny(
  code: AgentErrorCode,
  reason: string,
  effectivePermissions: string[],
  approvalRequired: boolean,
  level: PolicyLevel | null
): RuntimeAuthorizationDenied {
  return {
    allowed: false,
    status: "DENY",
    code,
    reason,
    policyVersion: RUNTIME_AUTHZ_POLICY_VERSION,
    effectivePermissions,
    approvalRequired,
    approvalId: null,
    level,
  };
}
