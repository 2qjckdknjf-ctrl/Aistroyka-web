/**
 * Parses LLM or deterministic output into CopilotResponse.
 * Safe fallback when raw string is returned.
 */

import type { CopilotResponse, CopilotUseCase } from "./copilot.types";

export function parseCopilotOutput(
  useCase: CopilotUseCase,
  raw: string | Record<string, unknown>,
  source: "llm" | "deterministic" | "mock"
): Omit<CopilotResponse, "useCase" | "at" | "source"> {
  const at = new Date().toISOString();
  if (typeof raw === "object" && raw !== null) {
    return {
      summary: (raw.summary as string) ?? undefined,
      bullets: (raw.bullets as string[]) ?? undefined,
      risks: (raw.risks as string[]) ?? undefined,
      missingEvidence: (raw.missingEvidence as string[]) ?? undefined,
      blockedTasks: (raw.blockedTasks as string[]) ?? undefined,
      managerBrief: (raw.managerBrief as string) ?? undefined,
      executiveBrief: (raw.executiveBrief as string) ?? undefined,
      structured: raw as Record<string, unknown>,
    };
  }
  return {
    summary: String(raw).slice(0, 2000),
    structured: { raw: String(raw) },
  };
}

export function toCopilotResponse(
  useCase: CopilotUseCase,
  parsed: Omit<CopilotResponse, "useCase" | "at" | "source">,
  source: "llm" | "deterministic" | "mock"
): CopilotResponse {
  return {
    useCase,
    at: new Date().toISOString(),
    source,
    ...parsed,
  };
}
