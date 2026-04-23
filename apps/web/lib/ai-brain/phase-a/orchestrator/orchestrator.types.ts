/**
 * AI Brain Phase A — Orchestrator types.
 */

import type { ProjectTruthSnapshot } from "../truth-snapshot";

export type OrchestratorMode =
  | "executive_summary"
  | "project_intelligence"
  | "manager_assist"
  | "worker_assist"
  | "client_safe_summary";

export type RunContextRole = "manager" | "worker" | "client" | "admin";

export interface AiBrainRunContext {
  requestId: string;
  mode: OrchestratorMode;
  tenantId: string;
  projectId: string;
  userId?: string;
  role?: RunContextRole;
}

export interface ModeDefinition {
  mode: OrchestratorMode;
  requiredContext: string[];
  allowedTools: string[];
  outputContract: string;
}

export interface OrchestratorResult<T = unknown> {
  success: boolean;
  mode: OrchestratorMode;
  snapshot: ProjectTruthSnapshot | null;
  context: Record<string, unknown>;
  output: T | null;
  degradationFlags: string[];
  error?: string;
}
