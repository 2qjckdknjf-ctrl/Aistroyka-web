/**
 * Copilot — management assistant over AI brain data.
 * Use cases: summarize status, reports, risks, evidence, blocked tasks, manager/exec briefs.
 */

export type { CopilotUseCase, CopilotRequest, CopilotResponse } from "./copilot.types";
export { buildCopilotContext, type CopilotContextData } from "./copilot.context-builder";
export { buildPrompt } from "./copilot.prompt-builder";
export { parseCopilotOutput, toCopilotResponse } from "./copilot.output-parser";
export {
  nullCopilotProvider,
  createAdapterCopilotProvider,
  type ICopilotProvider,
  type CopilotProviderResult,
} from "./copilot.provider";
export { deterministicFallback } from "./copilot.fallback";
export {
  applyContextBudget,
  applyBriefContextBudget,
  estimateTokens,
  truncateToTokens,
  DEFAULT_CONTEXT_BUDGET,
  type ContextBudgetConfig,
  type ContextBudgetMeta,
  type BudgetedChatContext,
  type BudgetedBriefContext,
} from "./context-budget";
export {
  runCopilot,
  summarizeProjectStatus,
  summarizeDailyReports,
  detectTopRisks,
  findMissingEvidence,
  identifyBlockedTasks,
  generateManagerBrief,
  generateExecutiveBrief,
  type CopilotServiceOptions,
} from "./copilot.service";
