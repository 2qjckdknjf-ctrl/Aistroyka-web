"use client";

import { useState, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useRequestById } from "@/src/features/admin/ai/api/useRequestById";
import { QueryBoundary } from "@/lib/query/render";
import { DashboardGlassCard } from "@/components/dashboard/DashboardGlassCard";

const DEBOUNCE_MS = 300;

export function AdminAiRequestsClient() {
  const tDetail = useTranslations("dashboardDetail");
  const [input, setInput] = useState("");
  const [requestId, setRequestId] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      const trimmed = input.trim();
      setRequestId(trimmed || null);
    }, DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [input]);

  const query = useRequestById(requestId, null);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor="request-id" className="text-aistroyka-subheadline text-aistroyka-text-secondary">
          {tDetail("requestId")}
        </label>
        <input
          id="request-id"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={tDetail("pasteRequestIdHint")}
          className="min-w-[240px] rounded border border-aistroyka-border-subtle bg-aistroyka-surface-raised px-3 py-2 font-mono text-aistroyka-subheadline"
        />
      </div>

      {requestId ? (
        <QueryBoundary
          query={query}
          emptyCondition={(d) => d == null}
          emptyTitle={tDetail("noDataForRequest")}
          emptySubtitle={tDetail("checkIdOrTryAnother")}
        >
          {(data) => (
            <div className="space-y-4">
              {data.llm ? (
                <DashboardGlassCard>
                  <h2 className="text-aistroyka-subheadline font-semibold text-aistroyka-text-primary">{tDetail("llmLog")}</h2>
                  <dl className="mt-2 grid gap-1 text-aistroyka-caption sm:grid-cols-2">
                    <dt className="text-aistroyka-text-tertiary">{tDetail("mode")}</dt>
                    <dd>{data.llm.mode}</dd>
                    <dt className="text-aistroyka-text-tertiary">{tDetail("totalMs")}</dt>
                    <dd>{data.llm.total_ms ?? data.llm.latency_ms ?? "—"}</dd>
                    <dt className="text-aistroyka-text-tertiary">{tDetail("tokensUsed")}</dt>
                    <dd>{data.llm.tokens_used}</dd>
                    <dt className="text-aistroyka-text-tertiary">{tDetail("fallbackReason")}</dt>
                    <dd>{data.llm.fallback_reason ?? "—"}</dd>
                    <dt className="text-aistroyka-text-tertiary">{tDetail("errorCategory")}</dt>
                    <dd>{data.llm.error_category ?? "—"}</dd>
                    <dt className="text-aistroyka-text-tertiary">{tDetail("groundednessPassed")}</dt>
                    <dd>{String(data.llm.groundedness_passed)}</dd>
                    <dt className="text-aistroyka-text-tertiary">{tDetail("injectionDetected")}</dt>
                    <dd>{String(data.llm.injection_detected)}</dd>
                    <dt className="text-aistroyka-text-tertiary">{tDetail("securityBlocked")}</dt>
                    <dd>{String(data.llm.security_blocked)}</dd>
                  </dl>
                </DashboardGlassCard>
              ) : (
                <p className="text-aistroyka-subheadline text-aistroyka-text-tertiary">{tDetail("noLlmLogForRequest")}</p>
              )}

              {data.retrieval_logs?.length ? (
                <DashboardGlassCard>
                  <h2 className="text-aistroyka-subheadline font-semibold text-aistroyka-text-primary">{tDetail("retrievalLogs")}</h2>
                  <ul className="mt-2 space-y-2 text-aistroyka-caption">
                    {data.retrieval_logs.map((r) => (
                      <li key={r.id}>
                        retrieved_count={r.retrieved_count}, avg_similarity={String(r.avg_similarity)}, max_similarity={String(r.max_similarity)}, low_confidence={String(r.low_confidence)}
                      </li>
                    ))}
                  </ul>
                </DashboardGlassCard>
              ) : null}

              {data.chat_messages?.length ? (
                <DashboardGlassCard>
                  <h2 className="text-aistroyka-subheadline font-semibold text-aistroyka-text-primary">{tDetail("chatMessagesByRequestId")}</h2>
                  <ul className="mt-2 space-y-2 text-aistroyka-caption">
                    {data.chat_messages.map((m) => (
                      <li key={m.id}>
                        <span className="font-medium">{m.role}</span>: {m.content.slice(0, 100)}
                        {m.content.length > 100 ? "…" : ""} {m.low_confidence ? `(${tDetail("lowConfidence")})` : ""}
                      </li>
                    ))}
                  </ul>
                </DashboardGlassCard>
              ) : null}
            </div>
          )}
        </QueryBoundary>
      ) : (
        <p className="text-aistroyka-subheadline text-aistroyka-text-tertiary">{tDetail("enterRequestIdToLookup")}</p>
      )}
    </div>
  );
}
