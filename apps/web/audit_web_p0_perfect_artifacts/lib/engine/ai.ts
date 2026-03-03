/**
 * AI/engine (Copilot Edge) API: runExecutiveSummary, runExplainRisk, askCopilot.
 * Uses engine client; maps errors via EngineError.
 */

import { engineFetch } from "./client";
import { mapToEngineError } from "./errors";
import type {
  CopilotMode,
  CopilotResult,
  CopilotResponsePayload,
  DecisionContextPayload,
} from "./types";

import { getPublicEnv } from "@/lib/env";

function getCopilotBaseUrl(): string {
  try {
    const { NEXT_PUBLIC_SUPABASE_URL } = getPublicEnv();
    const base = typeof NEXT_PUBLIC_SUPABASE_URL === "string" ? NEXT_PUBLIC_SUPABASE_URL.trim() : "";
    return base ? `${base.replace(/\/$/, "")}/functions/v1/aistroyka-llm-copilot` : "";
  } catch {
    return "";
  }
}

export interface CopilotRequestOptions {
  getAuthToken?: () => Promise<string | null>;
  requestId?: string | null;
  signal?: AbortSignal | null;
  timeoutMs?: number;
  tenant_id?: string | null;
  project_id?: string | null;
  locale?: string | null;
  user_id?: string | null;
  historical_context?: string | null;
}

function parsePayload(data: unknown): CopilotResponsePayload | null {
  if (data != null && typeof data === "object" && "text" in data) {
    return data as CopilotResponsePayload;
  }
  return null;
}

async function callCopilot(
  mode: CopilotMode,
  decision_context: DecisionContextPayload,
  bodyExtra: { user_question?: string | null } = {},
  options: CopilotRequestOptions = {}
): Promise<CopilotResult> {
  const baseUrl = getCopilotBaseUrl();
  if (!baseUrl) {
    return {
      ok: false,
      request_id: "",
      error: {
        kind: "unknown",
        status: 0,
        requestId: "",
        message: "AI endpoint not configured (missing Supabase URL).",
        retryable: false,
      },
    };
  }

  try {
    const res = await engineFetch(
      baseUrl,
      {
        method: "POST",
        body: {
          mode,
          decision_context,
          ...bodyExtra,
          tenant_id: options.tenant_id ?? null,
          project_id: options.project_id ?? null,
          locale: options.locale ?? null,
          user_id: options.user_id ?? null,
          historical_context: options.historical_context ?? null,
        },
      },
      {
        getAuthToken: options.getAuthToken,
        requestId: options.requestId,
        signal: options.signal,
        timeoutMs: options.timeoutMs ?? 8000,
      }
    );

    const payload = parsePayload(res.data);
    const requestId = res.request_id;

    if (!res.ok) {
      const err = mapToEngineError(
        res.status,
        res.data != null && typeof res.data === "object" ? (res.data as Record<string, unknown>) : null,
        requestId,
        res.headers
      );
      return { ok: false, request_id: requestId, error: err };
    }

    if (!payload) {
      return {
        ok: false,
        request_id: requestId,
        error: mapToEngineError(500, { error: "Invalid response shape" }, requestId, res.headers),
      };
    }

    const bodyObj = res.data as Record<string, unknown>;
    if (payload.security_blocked === true) {
      const err = mapToEngineError(res.status, bodyObj, requestId, res.headers);
      return { ok: false, request_id: requestId, error: err };
    }
    if (payload.fallback_reason && ["tenant_budget_exceeded", "user_limit_exceeded"].includes(payload.fallback_reason)) {
      const err = mapToEngineError(res.status, bodyObj, requestId, res.headers);
      return { ok: false, request_id: requestId, error: err };
    }
    if (payload.error_category === "circuit_open" || payload.error_category === "timeout") {
      const err = mapToEngineError(res.status, bodyObj, requestId, res.headers);
      return { ok: false, request_id: requestId, error: err };
    }

    return { ok: true, request_id: requestId, payload };
  } catch (e) {
    const err = e as Error & { requestId?: string };
    const requestId = err.requestId ?? "";
    const isTimeout = err.message?.includes("timed out") || err.message?.includes("cancelled") || err.name === "AbortError";
    return {
      ok: false,
      request_id: requestId,
      error: {
        kind: isTimeout ? "timeout" : "unknown",
        status: 0,
        requestId,
        message: err.message ?? "Request failed.",
        retryable: isTimeout,
      },
    };
  }
}

/** Executive summary mode (no free-text question). */
export async function runExecutiveSummary(
  decision_context: DecisionContextPayload,
  options: CopilotRequestOptions = {}
): Promise<CopilotResult> {
  return callCopilot("executive_summary", decision_context, {}, options);
}

/** Explain risk mode (optional question). */
export async function runExplainRisk(
  decision_context: DecisionContextPayload,
  user_question?: string | null,
  options: CopilotRequestOptions = {}
): Promise<CopilotResult> {
  return callCopilot("explain_risk", decision_context, { user_question: user_question ?? null }, options);
}

/** Chat Q&A mode (question required for useful answer). */
export async function askCopilot(
  decision_context: DecisionContextPayload,
  user_question: string,
  options: CopilotRequestOptions = {}
): Promise<CopilotResult> {
  return callCopilot("chat_qa", decision_context, { user_question: user_question.trim() || null }, options);
}
