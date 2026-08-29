/**
 * Stable agent error codes. UI must not show stack traces.
 */

export const AGENT_ERROR_CODES = [
  "AGENT_PROJECT_ACCESS_DENIED",
  "AGENT_SKILL_NOT_ALLOWED",
  "AGENT_SKILL_FAILED",
  "AGENT_INVALID_INPUT",
  "AGENT_POLICY_DENIED",
  "AGENT_INSUFFICIENT_EVIDENCE",
  "AGENT_PROVIDER_UNAVAILABLE",
  "AGENT_FEATURE_DISABLED",
  "AGENT_UNAUTHORIZED",
  "AGENT_UNKNOWN_SKILL",
  "AGENT_RESTRICTED_ACTION",
  "AGENT_MALFORMED_OUTPUT",
] as const;

export type AgentErrorCode = (typeof AGENT_ERROR_CODES)[number];

export class AgentError extends Error {
  constructor(
    public readonly code: AgentErrorCode,
    message: string,
    public readonly httpStatus: number
  ) {
    super(message);
    this.name = "AgentError";
  }
}

export function isAgentError(err: unknown): err is AgentError {
  return err instanceof AgentError;
}
