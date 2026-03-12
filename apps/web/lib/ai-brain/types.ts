/**
 * AI Brain — shared types and provider abstraction.
 * LLM/vision calls go through an adapter; business logic stays provider-agnostic.
 */

import type {
  ProjectHealth,
  ManagerInsight,
  ExecutiveSummary,
  ActionRecommendation,
  RiskSignal,
} from "./domain";

export type { ProjectHealth, ManagerInsight, ExecutiveSummary, ActionRecommendation, RiskSignal };

/** Context passed to LLM adapter (future). */
export interface CopilotContext {
  projectId: string;
  tenantId: string;
  snapshot?: unknown;
  reportsSummary?: string;
  risksSummary?: string;
  tasksSummary?: string;
  evidenceSummary?: string;
}

/** Result from LLM adapter (future). */
export interface CopilotLLMResult {
  summary?: string;
  recommendations?: string[];
  structured?: Record<string, unknown>;
  raw?: string;
}

/** Adapter interface for LLM/generation. Implement with real provider or mock. */
export interface ILLMAdapter {
  generateBrief(context: CopilotContext): Promise<CopilotLLMResult>;
  isAvailable(): boolean;
}
