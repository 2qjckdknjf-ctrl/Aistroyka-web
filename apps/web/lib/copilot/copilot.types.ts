/**
 * Copilot — management assistant types.
 * Use cases: summarize project, reports, risks, evidence, blocked tasks, manager/exec briefs.
 */

export type CopilotUseCase =
  | "summarizeProjectStatus"
  | "summarizeDailyReports"
  | "detectTopRisks"
  | "findMissingEvidence"
  | "identifyBlockedTasks"
  | "generateManagerBrief"
  | "generateExecutiveBrief";

export interface CopilotRequest {
  useCase: CopilotUseCase;
  projectId?: string;
  portfolioId?: string;
  tenantId: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface CopilotResponse {
  useCase: CopilotUseCase;
  summary?: string;
  bullets?: string[];
  risks?: string[];
  missingEvidence?: string[];
  blockedTasks?: string[];
  managerBrief?: string;
  executiveBrief?: string;
  structured?: Record<string, unknown>;
  at: string;
  source: "llm" | "deterministic" | "mock";
}
