"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useLocale } from "next-intl";
import { useMutation } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { runExecutiveSummary, runExplainRisk, askCopilot } from "@/lib/engine/ai";
import type { DecisionContextPayload } from "@/lib/engine/types";
import type { EngineError } from "@/lib/engine/errors";
import { normalizeToQueryError, getEngineError } from "@/lib/engine/normalizeError";
import type { CopilotResult } from "@/lib/engine/types";
import { Button } from "@/components/ui";
import { Skeleton } from "@/components/ui";
import { AiErrorBanner } from "./AiErrorBanner";
import { LowConfidenceNotice } from "./LowConfidenceNotice";
import { CopyRequestIdButton } from "./CopyRequestIdButton";
import { CopilotChatPanel } from "@/lib/features/ai/components/CopilotChatPanel";

type TabId = "summary" | "explain_risk" | "copilot";

type ResultState = {
  text: string;
  summary?: string;
  key_drivers?: string[];
  recommended_actions?: string[];
  groundedness_passed?: boolean | null;
  retrieval_low_confidence?: boolean;
  fallback_reason?: string | null;
  error_category?: string | null;
};

const DEFAULT_CONTEXT: DecisionContextPayload = {
  overall_risk: 0,
  confidence: 0,
  top_risk_factors: [],
  projected_delay_date: null,
  velocity_trend: "unknown",
  anomalies: [],
  aggregated_at: new Date().toISOString(),
};

export interface AiActionPanelProps {
  decisionContext?: DecisionContextPayload | null;
  projectId?: string | null;
  tenantId?: string | null;
  locale?: string | null;
  /** Show request_id (e.g. dev/staging) */
  showRequestId?: boolean;
}

const IS_DEV_OR_STAGING =
  typeof process !== "undefined" &&
  (process.env.NODE_ENV !== "production" ||
    (process.env.NEXT_PUBLIC_ENV ?? "").toLowerCase() === "staging" ||
    (process.env.NEXT_PUBLIC_VERCEL_ENV ?? "").toLowerCase() === "staging");

export function AiActionPanel({
  decisionContext,
  projectId,
  tenantId,
  locale,
  showRequestId = IS_DEV_OR_STAGING,
}: AiActionPanelProps) {
  const localeFromHook = useLocale();
  const effectiveLocale = locale != null ? locale : localeFromHook;
  const [tab, setTab] = useState<TabId>("summary");
  const [copilotQuestion, setCopilotQuestion] = useState("");
  const [result, setResult] = useState<ResultState | null>(null);
  const [error, setError] = useState<EngineError | null>(null);
  const [requestId, setRequestId] = useState<string>("");
  const questionTextareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const ctx = decisionContext ?? DEFAULT_CONTEXT;

  const getAuthToken = useCallback(async () => {
    const supabase = createClient();
    try {
      const res = await supabase.auth.getSession();
      const session = res?.data?.session ?? null;
      return session?.access_token ?? null;
    } catch {
      return null;
    }
  }, []);

  const mutation = useMutation({
    mutationFn: async (variables: {
      tab: TabId;
      copilotQuestion: string;
      signal?: AbortSignal;
    }): Promise<CopilotResult> => {
      const { tab: t, copilotQuestion: q, signal } = variables;
      const options = {
        getAuthToken,
        tenant_id: tenantId ?? null,
        project_id: projectId ?? null,
        locale: effectiveLocale ?? undefined,
        signal: signal ?? null,
      };
      if (t === "summary") return runExecutiveSummary(ctx, options);
      if (t === "explain_risk") return runExplainRisk(ctx, q.trim() || undefined, options);
      const question = q.trim();
      if (!question) {
        throw normalizeToQueryError({
          kind: "unknown",
          status: 0,
          requestId: "",
          message: "Enter a question for Copilot.",
          retryable: false,
        });
      }
      return askCopilot(ctx, question, options);
    },
    onMutate: () => {
      setError(null);
      setResult(null);
      setRequestId("");
    },
    onSuccess: (res) => {
      setRequestId(res.request_id);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setResult({
        text: res.payload.text,
        summary: res.payload.summary,
        key_drivers: res.payload.key_drivers,
        recommended_actions: res.payload.recommended_actions,
        groundedness_passed: res.payload.groundedness_passed,
        retrieval_low_confidence: res.payload.retrieval_low_confidence,
        fallback_reason: res.payload.fallback_reason ?? null,
        error_category: res.payload.error_category ?? null,
      });
    },
    onError: (err) => {
      const engineErr = getEngineError(err);
      if (engineErr) setError(engineErr);
      else
        setError({
          kind: "unknown",
          status: (err as Error & { status?: number }).status ?? 0,
          requestId: "",
          message: err instanceof Error ? err.message : "Request failed.",
          retryable: false,
        });
    },
    onSettled: () => {
      abortRef.current = null;
    },
  });

  useEffect(() => {
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  const run = useCallback(() => {
    if (tab === "copilot" && !copilotQuestion.trim()) {
      setError({
        kind: "unknown",
        status: 0,
        requestId: "",
        message: "Enter a question for Copilot.",
        retryable: false,
      });
      return;
    }
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    mutation.mutate({
      tab,
      copilotQuestion,
      signal: ctrl.signal,
    });
  }, [tab, copilotQuestion, mutation]);

  const isPending = mutation.isPending;
  const lowConfidence =
    result &&
    (result.groundedness_passed === false || result.retrieval_low_confidence === true);

  return (
    <div className="rounded-lg border border-aistroyka-border-subtle bg-aistroyka-surface p-4">
      <h3 className="mb-3 text-aistroyka-font-title3 font-semibold text-aistroyka-text-primary">
        AI Copilot
      </h3>

      {/* Tabs */}
      <div className="mb-4 flex gap-2 border-b border-aistroyka-border-subtle" role="tablist">
        {(["summary", "explain_risk", "copilot"] as const).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-label={t === "summary" ? "Executive summary" : t === "explain_risk" ? "Explain risk" : "Copilot chat"}
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`min-h-[36px] px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-aistroyka-accent focus:ring-offset-2 ${
              tab === t
                ? "border-b-2 border-aistroyka-accent text-aistroyka-accent"
                : "text-aistroyka-text-secondary hover:text-aistroyka-text-primary"
            }`}
          >
            {t === "summary" ? "Summary" : t === "explain_risk" ? "Explain Risk" : "Copilot"}
          </button>
        ))}
      </div>

      {tab === "copilot" && projectId ? (
        <CopilotChatPanel
          projectId={projectId}
          tenantId={tenantId}
          decisionContext={ctx}
          locale={effectiveLocale}
        />
      ) : (
        <>
          {tab === "explain_risk" && (
            <div className="mb-4">
              <label htmlFor="copilot-question" className="mb-1 block text-sm text-aistroyka-text-secondary">
                Question
              </label>
              <textarea
                id="copilot-question"
                ref={questionTextareaRef}
                value={copilotQuestion}
                onChange={(e) => setCopilotQuestion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && e.ctrlKey) {
                    e.preventDefault();
                    run();
                  }
                }}
                placeholder="Ask about risk or next steps... (Ctrl+Enter to submit)"
                rows={2}
                className="w-full rounded border border-aistroyka-border-subtle bg-aistroyka-bg-primary px-3 py-2 text-sm text-aistroyka-text-primary placeholder:text-aistroyka-text-tertiary focus:outline-none focus:ring-2 focus:ring-aistroyka-accent focus:ring-offset-2"
                aria-label="Copilot question"
              />
            </div>
          )}

          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Button onClick={run} disabled={isPending} loading={isPending}>
              {isPending ? "Running…" : "Run"}
            </Button>
            {showRequestId && requestId && <CopyRequestIdButton requestId={requestId} />}
          </div>

          {error && (
        <div className="mb-4">
          <AiErrorBanner error={error} onRetry={error.retryable ? run : undefined} />
        </div>
      )}

      {isPending && (
        <div className="mb-4">
          <Skeleton className="h-24 w-full rounded" />
        </div>
      )}

      {!isPending && !result && !error && (
        <div className="rounded border border-aistroyka-border-subtle bg-aistroyka-surface-muted/50 p-4 text-center text-sm text-aistroyka-text-tertiary">
          Run AI to see summary, risk explanation, or ask a question.
        </div>
      )}

      {result && !isPending && (
        <div className="space-y-2">
          {lowConfidence && (
            <LowConfidenceNotice
              onSuggestFollowUp={tab === "explain_risk" ? (text) => setCopilotQuestion(text) : undefined}
            />
          )}
          <div className="rounded bg-aistroyka-surface-muted p-3 text-sm text-aistroyka-text-primary">
            {result.summary ?? result.text}
          </div>
          {result.key_drivers && result.key_drivers.length > 0 && (
            <ul className="list-inside list-disc text-sm text-aistroyka-text-secondary">
              {result.key_drivers.map((d, i) => (
                <li key={i}>{d}</li>
              ))}
            </ul>
          )}
          {result.recommended_actions && result.recommended_actions.length > 0 && (
            <p className="text-sm text-aistroyka-text-secondary">
              <span className="font-medium">Recommended:</span>{" "}
              {result.recommended_actions.join("; ")}
            </p>
          )}
        </div>
      )}

      {IS_DEV_OR_STAGING && (requestId || result || error) && (
        <details className="mt-4 rounded border border-aistroyka-border-subtle bg-aistroyka-surface-muted/30 p-3 text-xs">
          <summary className="cursor-pointer font-medium text-aistroyka-text-secondary">
            Diagnostics
          </summary>
          <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-2 gap-y-1 font-mono text-aistroyka-text-tertiary">
            <dt>request_id</dt>
            <dd>{requestId || error?.requestId || "—"}</dd>
            <dt>mode</dt>
            <dd>{tab}</dd>
            {result && (
              <>
                <dt>retrieval_low_confidence</dt>
                <dd>{String(result.retrieval_low_confidence ?? false)}</dd>
                <dt>fallback_reason</dt>
                <dd>{result.fallback_reason ?? "—"}</dd>
                <dt>error_category</dt>
                <dd>{result.error_category ?? "—"}</dd>
              </>
            )}
            {error && (
              <>
                <dt>error_category</dt>
                <dd>{error.kind}</dd>
              </>
            )}
          </dl>
        </details>
      )}
        </>
      )}
    </div>
  );
}
