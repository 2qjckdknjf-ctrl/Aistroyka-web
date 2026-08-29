/**
 * Agentic Foundation domain types.
 * Tenant/project identity always comes from AgentExecutionContext, never from model output.
 */

export type SkillExecutionMode = "READ" | "SUGGEST" | "PREPARE" | "EXECUTE";

export type SkillRiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type PolicyLevel =
  | "LEVEL_0_READ"
  | "LEVEL_1_SUGGEST"
  | "LEVEL_2_PREPARE"
  | "LEVEL_3_EXECUTE_AFTER_APPROVAL"
  | "LEVEL_4_RESTRICTED";

export type AgentActorType = "user" | "system" | "automation";

export type AgentSource =
  | "WEB"
  | "IOS_MANAGER"
  | "IOS_WORKER"
  | "ANDROID"
  | "SYSTEM"
  | "AUTOMATION"
  | "API";

export type AgentRunStatus =
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "REJECTED"
  | "EXECUTING"
  | "COMPLETED"
  | "COMPLETED_WITH_LIMITATIONS"
  | "INSUFFICIENT_EVIDENCE"
  | "FAILED"
  | "CANCELLED";

export type ProposedActionStatus =
  | "PROPOSED"
  | "APPROVED"
  | "REJECTED"
  | "EXECUTED"
  | "FAILED"
  | "EXPIRED";

export type AgentExecutionRole = "manager" | "worker" | "client" | "admin" | "viewer";

export interface AgentExecutionContext {
  tenantId: string;
  projectId: string;
  userId: string;
  actorType: AgentActorType;
  /** Tenant DB role (owner/admin/member/viewer/stakeholder). Not a skill capability. */
  tenantRole: string;
  /** Project membership role, or null when the actor is tenant admin/owner without a membership row. */
  projectRole: string | null;
  roles: AgentExecutionRole[];
  permissions: string[];
  requestId: string;
  traceId: string;
  locale: string;
  source: AgentSource;
  timestamp: string;
}

export const AGENTIC_FOUNDATION_FLAG_KEY = "AGENTIC_FOUNDATION_ENABLED";

export type AgenticFoundationMode =
  | "disabled"
  | "internal"
  | "staging"
  | "selected_tenant"
  | "production";
