/**
 * Explicit skill registry. Unknown names are REJECTED.
 * No dynamic function execution, eval, or model-generated SQL/URL/API paths.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { AgentError } from "../errors";
import { assertPolicyAllowed } from "../policy/policy-resolver";
import type { AgentExecutionContext } from "../types";
import type { AgentSkill, SkillDefinition, SkillResult } from "./skill.types";
import { createReadSkills } from "./read-skills";

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

  constructor(skills: AgentSkill[]) {
    this.byName = new Map();
    for (const skill of skills) {
      this.byName.set(skill.definition.name, skill);
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

  allowedReadSkills(context: AgentExecutionContext): string[] {
    return this.listDefinitions()
      .filter((d) => d.executionMode === "READ")
      .filter((d) => {
        const decision = { skill: this.require(d.name).definition, context };
        try {
          assertPolicyAllowed(decision);
          return true;
        } catch {
          return false;
        }
      })
      .map((d) => d.name);
  }
}

export function createSkillRegistry(supabase: SupabaseClient): SkillRegistry {
  return new SkillRegistry(createReadSkills(supabase));
}

export async function executeRegisteredSkill(
  registry: SkillRegistry,
  context: AgentExecutionContext,
  name: string,
  input: unknown
): Promise<{ definition: SkillDefinition; result: SkillResult }> {
  const skill = registry.require(name);
  assertPolicyAllowed({ skill: skill.definition, context });
  const parsed = skill.validateInput(input);
  await skill.authorize(context);
  const result = await skill.execute(context, parsed);
  return { definition: skill.definition, result };
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
