"use client";

import { useState, useEffect, useMemo } from "react";
import { useRequestById } from "@/src/features/admin/ai/api/useRequestById";
import { QueryBoundary } from "@/lib/query/render";
import { Card } from "@/components/ui";

const DEBOUNCE_MS = 300;

export function AdminAiRequestsClient() {
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
          Request ID
        </label>
        <input
          id="request-id"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste request_id (e.g. from X-Request-Id)"
          className="min-w-[240px] rounded border border-aistroyka-border-subtle bg-aistroyka-surface-raised px-3 py-2 font-mono text-aistroyka-subheadline"
        />
      </div>

      {requestId ? (
        <QueryBoundary
          query={query}
          emptyCondition={(d) => d == null}
          emptyTitle="No data for this request"
          emptySubtitle="Check the ID or try another."
        >
          {(data) => (
            <div className="space-y-4">
              {data.llm ? (
                <Card>
                  <h2 className="text-aistroyka-subheadline font-semibold text-aistroyka-text-primary">LLM log</h2>
                  <dl className="mt-2 grid gap-1 text-aistroyka-caption sm:grid-cols-2">
                    <dt className="text-aistroyka-text-tertiary">mode</dt>
                    <dd>{data.llm.mode}</dd>
                    <dt className="text-aistroyka-text-tertiary">total_ms</dt>
                    <dd>{data.llm.total_ms ?? data.llm.latency_ms ?? "—"}</dd>
                    <dt className="text-aistroyka-text-tertiary">tokens_used</dt>
                    <dd>{data.llm.tokens_used}</dd>
                    <dt className="text-aistroyka-text-tertiary">fallback_reason</dt>
                    <dd>{data.llm.fallback_reason ?? "—"}</dd>
                    <dt className="text-aistroyka-text-tertiary">error_category</dt>
                    <dd>{data.llm.error_category ?? "—"}</dd>
                    <dt className="text-aistroyka-text-tertiary">groundedness_passed</dt>
                    <dd>{String(data.llm.groundedness_passed)}</dd>
                    <dt className="text-aistroyka-text-tertiary">injection_detected</dt>
                    <dd>{String(data.llm.injection_detected)}</dd>
                    <dt className="text-aistroyka-text-tertiary">security_blocked</dt>
                    <dd>{String(data.llm.security_blocked)}</dd>
                  </dl>
                </Card>
              ) : (
                <p className="text-aistroyka-subheadline text-aistroyka-text-tertiary">No LLM log for this request_id.</p>
              )}

              {data.retrieval_logs?.length ? (
                <Card>
                  <h2 className="text-aistroyka-subheadline font-semibold text-aistroyka-text-primary">Retrieval logs</h2>
                  <ul className="mt-2 space-y-2 text-aistroyka-caption">
                    {data.retrieval_logs.map((r) => (
                      <li key={r.id}>
                        retrieved_count={r.retrieved_count}, avg_similarity={String(r.avg_similarity)}, max_similarity={String(r.max_similarity)}, low_confidence={String(r.low_confidence)}
                      </li>
                    ))}
                  </ul>
                </Card>
              ) : null}

              {data.chat_messages?.length ? (
                <Card>
                  <h2 className="text-aistroyka-subheadline font-semibold text-aistroyka-text-primary">Chat messages (by request_id)</h2>
                  <ul className="mt-2 space-y-2 text-aistroyka-caption">
                    {data.chat_messages.map((m) => (
                      <li key={m.id}>
                        <span className="font-medium">{m.role}</span>: {m.content.slice(0, 100)}
                        {m.content.length > 100 ? "…" : ""} {m.low_confidence ? "(low confidence)" : ""}
                      </li>
                    ))}
                  </ul>
                </Card>
              ) : null}
            </div>
          )}
        </QueryBoundary>
      ) : (
        <p className="text-aistroyka-subheadline text-aistroyka-text-tertiary">Enter a request_id to look up (e.g. from Copilot response header or security event).</p>
      )}
    </div>
  );
}
