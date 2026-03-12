/**
 * Deterministic fallback when no LLM provider is available.
 * Returns use-case-specific text and optional structured data from context.
 */

import type { CopilotUseCase } from "./copilot.types";
import type { CopilotContextData } from "./copilot.context-builder";
import type { CopilotProviderResult } from "./copilot.provider";

export function deterministicFallback(
  useCase: CopilotUseCase,
  context: CopilotContextData
): CopilotProviderResult {
  const parts = [
    context.executiveHeadline,
    context.healthSummary,
    context.reportSummary,
    context.riskSummary,
    context.evidenceSummary,
    context.taskSummary,
    context.recommendationsSummary,
  ].filter(Boolean);

  switch (useCase) {
    case "summarizeProjectStatus":
      return {
        raw: [context.executiveHeadline, context.healthSummary, context.snapshotSummary].join(" "),
        structured: { summary: context.healthSummary },
      };
    case "summarizeDailyReports":
      return {
        raw: `Reporting: ${context.reportSummary}. ${context.taskSummary}`,
        structured: { reportSummary: context.reportSummary, taskSummary: context.taskSummary },
      };
    case "detectTopRisks":
      return {
        raw: context.riskSummary || "No risk signals.",
        structured: { risks: context.riskSummary ? [context.riskSummary] : [] },
      };
    case "findMissingEvidence":
      return {
        raw: context.evidenceSummary || "No evidence gaps.",
        structured: { missingEvidence: context.evidenceSummary ? [context.evidenceSummary] : [] },
      };
    case "identifyBlockedTasks":
      return {
        raw: context.taskSummary || "No blocked or overdue tasks.",
        structured: { blockedTasks: context.taskSummary ? [context.taskSummary] : [] },
      };
    case "generateManagerBrief":
      return {
        raw: [context.executiveHeadline, context.healthSummary, context.recommendationsSummary].join(" "),
        structured: { managerBrief: context.executiveHeadline },
      };
    case "generateExecutiveBrief":
      return {
        raw: parts.join(" "),
        structured: { executiveBrief: context.executiveHeadline },
      };
    default: {
      const _: never = useCase;
      return { raw: parts.join(" ") };
    }
  }
}
