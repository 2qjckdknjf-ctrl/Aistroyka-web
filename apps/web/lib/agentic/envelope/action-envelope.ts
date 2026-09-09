/**
 * Agent Action Envelope — typed, never free-form for internal actions.
 */

import type { AgentRunStatus, SkillExecutionMode, SkillRiskLevel } from "../types";
import type { AgentEvidence } from "../contracts/evidence.types";

export interface ProposedAgentAction {
  actionType: string;
  skillName: string;
  riskLevel: SkillRiskLevel;
  payload: Record<string, unknown>;
  reason: string;
  expectedEffect: string;
  approvalRequired: boolean;
}

export interface AgentActionEnvelope {
  actionId: string;
  skill: string;
  version: string;
  mode: SkillExecutionMode;
  riskLevel: SkillRiskLevel;
  tenantId: string;
  projectId: string;
  status: AgentRunStatus;
  result: unknown;
  evidence: AgentEvidence[];
  provenance: Array<{ sourceEntityType: string; sourceEntityId: string }>;
  proposedActions: ProposedAgentAction[];
  createdAt: string;
}

export function buildActionEnvelope(input: {
  actionId: string;
  skill: string;
  version?: string;
  mode: SkillExecutionMode;
  riskLevel: SkillRiskLevel;
  tenantId: string;
  projectId: string;
  status: AgentRunStatus;
  result: unknown;
  evidence: AgentEvidence[];
  proposedActions?: ProposedAgentAction[];
}): AgentActionEnvelope {
  return {
    actionId: input.actionId,
    skill: input.skill,
    version: input.version ?? "1",
    mode: input.mode,
    riskLevel: input.riskLevel,
    tenantId: input.tenantId,
    projectId: input.projectId,
    status: input.status,
    result: input.result,
    evidence: input.evidence,
    provenance: input.evidence.map((e) => ({
      sourceEntityType: e.sourceEntityType,
      sourceEntityId: e.sourceEntityId,
    })),
    proposedActions: input.proposedActions ?? [],
    createdAt: new Date().toISOString(),
  };
}
