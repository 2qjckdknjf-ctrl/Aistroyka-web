/**
 * Types for AI/engine (Copilot Edge) responses.
 * Aligned with aistroyka-llm-copilot response shape.
 */

export type CopilotMode = "executive_summary" | "explain_risk" | "chat_qa";

export interface DecisionContextPayload {
  overall_risk: number;
  confidence: number;
  top_risk_factors: Array<{ name: string; score: number; weight: number }>;
  projected_delay_date: string | null;
  velocity_trend: string;
  anomalies: string[];
  aggregated_at: string;
}

export interface CopilotResponsePayload {
  text: string;
  bullets?: string[];
  summary?: string;
  key_drivers?: string[];
  recommended_actions?: string[];
  assumptions?: string;
  tone?: "neutral" | "cautious" | "urgent";
  confidence?: number;
  model?: string;
  model_version?: string;
  context_version?: string;
  /** True when fallback/cached/safe response was returned instead of live LLM */
  fallback_used?: boolean;
  /** Reason: tenant_budget_exceeded, user_limit_exceeded, circuit_open, timeout, groundedness_gate, prompt_injection, etc. */
  fallback_reason?: string | null;
  /** Category for logging: budget_exceeded, circuit_open, timeout, security_blocked, etc. */
  error_category?: string | null;
  /** When RAG was used: false = low confidence (no or weak retrieval) */
  groundedness_passed?: boolean | null;
  /** When retrieval was used but quality was low */
  retrieval_low_confidence?: boolean;
  security_blocked?: boolean;
  validation_passed?: boolean;
  latency_ms?: number;
  cached?: boolean;
}

export interface CopilotSuccessResult {
  ok: true;
  request_id: string;
  payload: CopilotResponsePayload;
}

export interface CopilotErrorResult {
  ok: false;
  request_id: string;
  error: import("./errors").EngineError;
}

export type CopilotResult = CopilotSuccessResult | CopilotErrorResult;
