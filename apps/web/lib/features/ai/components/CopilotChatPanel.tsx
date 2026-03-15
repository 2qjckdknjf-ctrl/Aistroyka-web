"use client";

import { useState, useRef, useCallback } from "react";
import { useLocale } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import type { DecisionContextPayload } from "@/lib/engine/types";
import type { EngineError } from "@/lib/engine/errors";
import { useCopilotThread } from "../api/useCopilotThread";
import { useThreadSummary } from "../api/useThreadSummary";
import { requestMemoryRefresh } from "../api/chatApi";
import { AiErrorBanner } from "@/components/ai/AiErrorBanner";
import { LowConfidenceNotice } from "@/components/ai/LowConfidenceNotice";
import { CopyRequestIdButton } from "@/components/ai/CopyRequestIdButton";
import { Button } from "@/components/ui";
import type { ChatMessage } from "../types";

const DEFAULT_CONTEXT: DecisionContextPayload = {
  overall_risk: 0,
  confidence: 0,
  top_risk_factors: [],
  projected_delay_date: null,
  velocity_trend: "unknown",
  anomalies: [],
  aggregated_at: new Date().toISOString(),
};

function messageToEngineError(msg: ChatMessage): EngineError | null {
  if (!msg.errorKind) return null;
  return {
    kind: msg.errorKind,
    status: msg.errorKind === "unauthorized" ? 401 : msg.errorKind === "rate_limited" ? 429 : 0,
    requestId: msg.requestId ?? "",
    message: msg.content || "Something went wrong.",
    retryable:
      msg.errorKind === "rate_limited" ||
      msg.errorKind === "circuit_open" ||
      msg.errorKind === "timeout",
  };
}

const IS_DEV_OR_STAGING =
  typeof process !== "undefined" &&
  (process.env.NODE_ENV !== "production" ||
    (process.env.NEXT_PUBLIC_ENV ?? "").toLowerCase() === "staging" ||
    (process.env.NEXT_PUBLIC_VERCEL_ENV ?? "").toLowerCase() === "staging");

export interface CopilotChatPanelProps {
  projectId: string;
  tenantId?: string | null;
  decisionContext?: DecisionContextPayload | null;
  locale?: string | null;
}

export function CopilotChatPanel({
  projectId,
  tenantId,
  decisionContext,
  locale: localeProp,
}: CopilotChatPanelProps) {
  const localeFromHook = useLocale();
  const locale = localeProp ?? localeFromHook;
  const [input, setInput] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const [lastMemoryMeta, setLastMemoryMeta] = useState<{ summaryUsed?: boolean; chunksCount?: number }>({});
  const [streamingContent, setStreamingContent] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const ctx = decisionContext ?? DEFAULT_CONTEXT;

  const { thread, threadId, sendMessageMutation, clearChat, clearChatMutation } = useCopilotThread(projectId);
  const messages = thread?.messages ?? [];
  const displayMessages = streamingContent
    ? [...messages, { id: "_streaming", role: "assistant" as const, content: streamingContent }]
    : messages;
  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
  const lastRequestId = lastAssistant?.requestId;
  const lastLowConfidence = lastAssistant?.lowConfidence;
  const lastError = lastAssistant ? messageToEngineError(lastAssistant) : null;

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

  const getAuthTokenStable = useCallback(async () => {
    const supabase = createClient();
    try {
      const res = await supabase.auth.getSession();
      const session = res?.data?.session ?? null;
      return session?.access_token ?? null;
    } catch {
      return null;
    }
  }, []);

  const summaryQuery = useThreadSummary(threadId, getAuthTokenStable);
  const threadSummary = summaryQuery.data ?? null;

  const [refreshRequestPending, setRefreshRequestPending] = useState(false);
  const handleRequestRefresh = useCallback(async () => {
    if (!threadId || refreshRequestPending) return;
    setRefreshRequestPending(true);
    try {
      await requestMemoryRefresh(threadId, getAuthTokenStable);
      await summaryQuery.refetch();
    } finally {
      setRefreshRequestPending(false);
    }
  }, [threadId, getAuthTokenStable, refreshRequestPending, summaryQuery]);

  const handleCancel = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setStreamingContent("");
  }, []);

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || sendMessageMutation.isPending) return;
    setStreamingContent("");
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    sendMessageMutation
      .mutateAsync({
        message: text,
        decisionContext: ctx,
        getAuthToken,
        locale: locale ?? null,
        signal: ctrl.signal,
        onToken: (delta) => setStreamingContent((s) => s + delta),
      })
      .then((data) => {
        setInput("");
        setStreamingContent("");
        setLastMemoryMeta({
          summaryUsed: data.memory_summary_used,
          chunksCount: data.memory_chunks_count,
        });
      })
      .catch(() => {
        setStreamingContent("");
      })
      .finally(() => {
        abortRef.current = null;
      });
  }, [input, ctx, getAuthToken, tenantId, locale, sendMessageMutation]);

  const isPending = sendMessageMutation.isPending;

  return (
    <div className="flex flex-col rounded-lg border border-aistroyka-border-subtle bg-aistroyka-surface p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-aistroyka-font-title3 font-semibold text-aistroyka-text-primary">
          Chat
        </h3>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={clearChat}
            disabled={messages.length === 0 || clearChatMutation.isPending}
          >
            Clear chat
          </Button>
          {threadId && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleRequestRefresh}
              disabled={refreshRequestPending}
            >
              {refreshRequestPending ? "Requesting…" : "Refresh summary"}
            </Button>
          )}
          {lastRequestId && (
            <CopyRequestIdButton requestId={lastRequestId} />
          )}
        </div>
      </div>

      {threadSummary?.summary && (
        <details className="mb-3 rounded border border-aistroyka-border-subtle bg-aistroyka-surface-muted/50 p-2">
          <summary className="cursor-pointer text-sm font-medium text-aistroyka-text-secondary">
            Thread summary
          </summary>
          <p className="mt-2 whitespace-pre-wrap text-sm text-aistroyka-text-primary">
            {threadSummary.summary}
          </p>
        </details>
      )}

      <div
        ref={listRef}
        className="mb-4 flex max-h-[320px] min-h-[120px] flex-col gap-3 overflow-y-auto rounded border border-aistroyka-border-subtle bg-aistroyka-bg-primary p-3"
        role="log"
        aria-label="Chat messages"
      >
        {messages.length === 0 && (
          <p className="text-sm text-aistroyka-text-tertiary">
            Ask a question about risk or next steps. History is saved on the server.
          </p>
        )}
        {displayMessages.map((m) => (
          <div
            key={m.id}
            className={`rounded-lg px-3 py-2 text-sm ${
              m.role === "user"
                ? "ml-4 bg-aistroyka-accent/15 text-aistroyka-text-primary"
                : "mr-4 bg-aistroyka-surface-muted text-aistroyka-text-primary"
            }`}
          >
            <p className="whitespace-pre-wrap">{m.content}</p>
            {m.role === "assistant" && "requestId" in m && m.requestId && (
              <p className="mt-1 text-xs text-aistroyka-text-tertiary">ID: {m.requestId}</p>
            )}
          </div>
        ))}
      </div>

      {lastError && (
        <div className="mb-4">
          <AiErrorBanner
            error={lastError}
            onRetry={lastError.retryable ? handleSend : undefined}
          />
        </div>
      )}

      {lastLowConfidence && !lastError && (
        <div className="mb-4">
          <LowConfidenceNotice
            onSuggestFollowUp={(text) => setInput(text)}
          />
        </div>
      )}

      <div className="flex flex-col gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && e.ctrlKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Ask about risk or next steps… (Ctrl+Enter to send)"
          rows={2}
          className="w-full rounded border border-aistroyka-border-subtle bg-aistroyka-bg-primary px-3 py-2 text-sm text-aistroyka-text-primary placeholder:text-aistroyka-text-tertiary focus:outline-none focus:ring-2 focus:ring-aistroyka-accent focus:ring-offset-2"
          aria-label="Chat message"
          disabled={isPending}
        />
        <div className="flex gap-2">
          <Button onClick={handleSend} disabled={isPending || !input.trim()} loading={isPending}>
            Send
          </Button>
          {isPending && (
            <Button type="button" variant="secondary" onClick={handleCancel}>
              Cancel
            </Button>
          )}
        </div>
      </div>

      {IS_DEV_OR_STAGING && (lastRequestId || lastAssistant || lastMemoryMeta.chunksCount != null || lastMemoryMeta.summaryUsed) && (
        <details className="mt-4 rounded border border-aistroyka-border-subtle bg-aistroyka-surface-muted/30 p-3 text-xs">
          <summary className="cursor-pointer font-medium text-aistroyka-text-secondary">
            Diagnostics
          </summary>
          <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-2 gap-y-1 font-mono text-aistroyka-text-tertiary">
            <dt>request_id</dt>
            <dd>{lastRequestId ?? "—"}</dd>
            <dt>memory_summary_used</dt>
            <dd>{String(lastMemoryMeta.summaryUsed ?? false)}</dd>
            <dt>memory_chunks_count</dt>
            <dd>{lastMemoryMeta.chunksCount ?? "—"}</dd>
            {lastAssistant && (
              <>
                <dt>low_confidence</dt>
                <dd>{String(lastAssistant.lowConfidence ?? false)}</dd>
                <dt>fallback_reason</dt>
                <dd>{lastAssistant.fallback_reason ?? "—"}</dd>
                <dt>error_kind</dt>
                <dd>{lastAssistant.errorKind ?? "—"}</dd>
              </>
            )}
          </dl>
        </details>
      )}
    </div>
  );
}
