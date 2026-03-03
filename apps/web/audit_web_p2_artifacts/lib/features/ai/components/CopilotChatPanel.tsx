"use client";

import { useState, useRef, useCallback } from "react";
import { useLocale } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import type { DecisionContextPayload } from "@/lib/engine/types";
import type { EngineError } from "@/lib/engine/errors";
import { useCopilotThread } from "../api/useCopilotThread";
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
  const ctx = decisionContext ?? DEFAULT_CONTEXT;

  const { thread, sendMessage, sendMessageMutation, clearChat } = useCopilotThread(projectId);
  const messages = thread?.messages ?? [];
  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
  const lastRequestId = lastAssistant?.requestId;
  const lastLowConfidence = lastAssistant?.lowConfidence;
  const lastError = lastAssistant ? messageToEngineError(lastAssistant) : null;

  const getAuthToken = useCallback(async () => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  }, []);

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || sendMessageMutation.isPending) return;
    sendMessageMutation
      .mutateAsync({
        message: text,
        decisionContext: ctx,
        getAuthToken,
        tenantId: tenantId ?? null,
        locale: locale ?? null,
      })
      .then(() => setInput(""))
      .catch(() => {});
  }, [input, ctx, getAuthToken, tenantId, locale, sendMessageMutation]);

  const isPending = sendMessageMutation.isPending;

  return (
    <div className="flex flex-col rounded-lg border border-aistroyka-border-subtle bg-aistroyka-surface p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-aistroyka-font-title3 font-semibold text-aistroyka-text-primary">
          Chat
        </h3>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={clearChat}
            disabled={messages.length === 0}
          >
            Clear chat
          </Button>
          {lastRequestId && (
            <CopyRequestIdButton requestId={lastRequestId} />
          )}
        </div>
      </div>

      <div
        ref={listRef}
        className="mb-4 flex max-h-[320px] min-h-[120px] flex-col gap-3 overflow-y-auto rounded border border-aistroyka-border-subtle bg-aistroyka-bg-primary p-3"
        role="log"
        aria-label="Chat messages"
      >
        {messages.length === 0 && (
          <p className="text-sm text-aistroyka-text-tertiary">
            Ask a question about risk or next steps. History is saved in this browser.
          </p>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`rounded-lg px-3 py-2 text-sm ${
              m.role === "user"
                ? "ml-4 bg-aistroyka-accent/15 text-aistroyka-text-primary"
                : "mr-4 bg-aistroyka-surface-muted text-aistroyka-text-primary"
            }`}
          >
            <p className="whitespace-pre-wrap">{m.content}</p>
            {m.role === "assistant" && m.requestId && (
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
        <Button onClick={handleSend} disabled={isPending || !input.trim()} loading={isPending}>
          Send
        </Button>
      </div>

      {IS_DEV_OR_STAGING && (lastRequestId || lastAssistant) && (
        <details className="mt-4 rounded border border-aistroyka-border-subtle bg-aistroyka-surface-muted/30 p-3 text-xs">
          <summary className="cursor-pointer font-medium text-aistroyka-text-secondary">
            Diagnostics
          </summary>
          <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-2 gap-y-1 font-mono text-aistroyka-text-tertiary">
            <dt>request_id</dt>
            <dd>{lastRequestId ?? "—"}</dd>
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
