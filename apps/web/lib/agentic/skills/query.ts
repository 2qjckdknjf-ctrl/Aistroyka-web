/**
 * Skill query error handling. A failed query is not empty data.
 */

import { AgentError } from "../errors";

export function assertQueryOk(error: { message?: string } | null | undefined, skill: string): void {
  if (error) {
    throw new AgentError("AGENT_SKILL_FAILED", `query_failed:${skill}`, 503);
  }
}
