"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import type { EngineError } from "@/lib/engine/errors";
import { CopyRequestIdButton } from "./CopyRequestIdButton";

export function AiErrorBanner({
  error,
  onRetry,
}: {
  error: EngineError;
  onRetry?: () => void;
}) {
  const tDetail = useTranslations("dashboardDetail");
  const [countdown, setCountdown] = useState(
    error.kind === "rate_limited" && error.retryAfterSeconds != null ? error.retryAfterSeconds : 0
  );

  useEffect(() => {
    if (error.kind !== "rate_limited" || error.retryAfterSeconds == null) return;
    setCountdown(error.retryAfterSeconds);
  }, [error.kind, error.retryAfterSeconds]);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setInterval(() => setCountdown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [countdown]);

  const canRetry = error.retryable && onRetry && (error.kind !== "rate_limited" || countdown <= 0);

  const kindMessages: Record<EngineError["kind"], string | null> = {
    rate_limited: tDetail("rateLimitExceededHint"),
    circuit_open: tDetail("aiServiceTemporarilyLimited"),
    timeout: tDetail("requestTimedOutTryAgain"),
    budget_exceeded:
      tDetail("tokenBudgetExceededHint"),
    security_blocked: tDetail("responseBlockedBySecurity"),
    unauthorized: tDetail("unauthorizedSignInAgain"),
    unknown: error.requestId ? tDetail("somethingWentWrongSeeRequestId") : tDetail("somethingWentWrong"),
  };

  const mainMessage = kindMessages[error.kind] ?? error.message;

  return (
    <div
      className="rounded-lg border border-aistroyka-warning/50 bg-aistroyka-warning/10 p-4 text-sm"
      role="alert"
    >
      <p className="font-medium text-aistroyka-text-primary">{mainMessage}</p>
      {error.kind === "rate_limited" && countdown > 0 && (
        <p className="mt-2 text-aistroyka-text-secondary" aria-live="polite">
          {tDetail("retryAvailableIn")} {countdown}s
        </p>
      )}
      {canRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-2 min-h-[36px] rounded border border-aistroyka-warning bg-aistroyka-surface px-3 py-2 text-sm text-aistroyka-warning hover:bg-aistroyka-warning/20 focus:outline-none focus:ring-2 focus:ring-aistroyka-accent focus:ring-offset-2"
        >
          {tDetail("retry")}
        </button>
      )}
      {error.kind === "budget_exceeded" && (
        <p className="mt-2 text-xs text-aistroyka-text-tertiary">
          {tDetail("checkUsageOrContactSupport")}
        </p>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-aistroyka-border-subtle pt-3">
        <span className="text-xs text-aistroyka-text-tertiary">{tDetail("requestId")}:</span>
        {error.requestId ? (
          <CopyRequestIdButton requestId={error.requestId} />
        ) : (
          <span className="text-xs text-aistroyka-text-tertiary">—</span>
        )}
      </div>
    </div>
  );
}
