/**
 * Explicit skill registry. Unknown names are REJECTED.
 * No dynamic function execution, eval, or model-generated SQL/URL/API paths.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { AgentError } from "../errors";
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
  buildAgentExecutionEvidencePack,
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

export interface ExecuteRegisteredSkillOptions {
  /** Explicit capability grant for the agent runtime. Defaults to the Slice-01 read-only profile. */
  agentPermissions?: readonly string[];
  /** Approval evidence must come from a trusted approval store, never model output. */
  approval?: RuntimeApproval | null;
  /** Trusted immutable proposed-action identity. Required whenever approval is required. */
  operationId?: string;
  /** Trusted action type for policy + approval binding. Required whenever approval is required. */
  actionType?: string;
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

  // Validate before hashing/authorization so approval is bound to the exact canonical
  // input the handler will execute, not raw or model-controlled request material.
  const parsed = skill.validateInput(input);
  const operation = await buildRuntimeOperationBinding(skill.definition, parsed, options);
  const authorization = assertRuntimeAuthorized({
    skill: skill.definition,
    context,
    agentPermissions: options.agentPermissions ?? DEFAULT_PROJECT_AGENT_PERMISSIONS,
    approval: options.approval,
    actionType: options.actionType,
    operation,
  });

  await skill.authorize(context);
  const result = await skill.execute(context, parsed);
  const evidencePack = buildAgentExecutionEvidencePack({
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
    actionType: options.actionType.trim(),
    inputHash: await hashRuntimeSkillInput(parsedInput),
    skillVersion: skill.version,
  };
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
