/**
 * Builds prompts for Copilot use cases.
 * Templates only; no LLM calls.
 */

import type { CopilotUseCase } from "./copilot.types";
import type { CopilotContextData } from "./copilot.context-builder";

export function buildPrompt(useCase: CopilotUseCase, context: CopilotContextData): string {
  const base = [
    "Context for construction project:",
    context.snapshotSummary,
    context.healthSummary,
    `Reports: ${context.reportSummary}`,
    `Risks: ${context.riskSummary}`,
    `Evidence: ${context.evidenceSummary}`,
    `Tasks: ${context.taskSummary}`,
    `Recommendations: ${context.recommendationsSummary}`,
  ].join("\n");

  switch (useCase) {
    case "summarizeProjectStatus":
      return `${base}\n\nProvide a short project status summary (2-3 sentences).`;
    case "summarizeDailyReports":
      return `${base}\n\nSummarize daily reporting status and any gaps.`;
    case "detectTopRisks":
      return `${base}\n\nList top risks with severity.`;
    case "findMissingEvidence":
      return `${base}\n\nList missing or partial photo evidence.`;
    case "identifyBlockedTasks":
      return `${base}\n\nIdentify blocked or overdue tasks.`;
    case "generateManagerBrief":
      return `${base}\n\nGenerate a brief manager brief (headline + 3-5 bullet points).`;
    case "generateExecutiveBrief":
      return `${base}\n\nGenerate an executive brief (one paragraph, key metrics and actions).`;
    default: {
      const _: never = useCase;
      return base;
    }
  }
}
