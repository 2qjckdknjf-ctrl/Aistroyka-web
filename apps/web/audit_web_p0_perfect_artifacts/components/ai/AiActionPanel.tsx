"use client";

import { useState, useCallback, useRef } from "react";
import { useLocale } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { runExecutiveSummary, runExplainRisk, askCopilot } from "@/lib/engine/ai";
import type { DecisionContextPayload } from "@/lib/engine/types";
import type { EngineError } from "@/lib/engine/errors";
import { Button } from "@/components/ui";
import { Skeleton } from "@/components/ui";
import { AiErrorBanner } from "./AiErrorBanner";
import { LowConfidenceNotice } from "./LowConfidenceNotice";
import { CopyRequestIdButton } from "./CopyRequestIdButton";

type TabId = "summary" | "explain_risk" | "copilot";

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
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    text: string;
    summary?: string;
    key_drivers?: string[];
    recommended_actions?: string[];
    groundedness_passed?: boolean | null;
    retrieval_low_confidence?: boolean;
    fallback_reason?: string | null;
    error_category?: string | null;
  } | null>(null);
  const [error, setError] = useState<EngineError | null>(null);
  const [requestId, setRequestId] = useState<string>("");
  const questionTextareaRef = useRef<HTMLTextAreaElement>(null);

  const ctx = decisionContext ?? DEFAULT_CONTEXT;

  const getAuthToken = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  }, []);

  const run = useCallback(async () => {
    setError(null);
    setResult(null);
    setLoading(true);
    setRequestId("");

    const options = {
      getAuthToken,
      tenant_id: tenantId ?? null,
      project_id: projectId ?? null,
      locale: effectiveLocale ?? undefined,
    };

    try {
      if (tab === "summary") {
        const res = await runExecutiveSummary(ctx, options);
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
      } else if (tab === "explain_risk") {
        const res = await runExplainRisk(ctx, copilotQuestion.trim() || undefined, options);
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
      } else {
        const question = copilotQuestion.trim();
        if (!question) {
          setError({
            kind: "unknown",
            status: 0,
            requestId: "",
            message: "Enter a question for Copilot.",
            retryable: false,
          });
          setLoading(false);
          return;
        }
        const res = await askCopilot(ctx, question, options);
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
      }
    } finally {
      setLoading(false);
    }
  }, [tab, ctx, copilotQuestion, getAuthToken, tenantId, projectId, effectiveLocale]);

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

      {tab === "copilot" && (
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
        <Button onClick={run} disabled={loading} loading={loading}>
          {loading ? "Running…" : "Run"}
        </Button>
        {showRequestId && requestId && <CopyRequestIdButton requestId={requestId} />}
      </div>

      {error && (
        <div className="mb-4">
          <AiErrorBanner error={error} onRetry={error.retryable ? run : undefined} />
        </div>
      )}

      {loading && (
        <div className="mb-4">
          <Skeleton className="h-24 w-full rounded" />
        </div>
      )}

      {!loading && !result && !error && (
        <div className="rounded border border-aistroyka-border-subtle bg-aistroyka-surface-muted/50 p-4 text-center text-sm text-aistroyka-text-tertiary">
          Run AI to see summary, risk explanation, or ask a question.
        </div>
      )}

      {result && !loading && (
        <div className="space-y-2">
          {lowConfidence && (
            <LowConfidenceNotice
              onSuggestFollowUp={tab === "copilot" ? (text) => setCopilotQuestion(text) : undefined}
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
    </div>
  );
}
