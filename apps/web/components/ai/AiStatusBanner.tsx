"use client";

import type { EngineError } from "@/lib/engine/errors";

export function AiStatusBanner({
  error,
  onRetry,
}: {
  error: EngineError;
  onRetry?: () => void;
}) {
  const isRetryable = error.retryable && onRetry;

  return (
    <div
      className="rounded-lg border border-aistroyka-warning/50 bg-aistroyka-warning/10 p-4 text-sm"
      role="alert"
    >
      <p className="font-medium text-aistroyka-text-primary">{error.message}</p>
      {isRetryable && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-2 min-h-[36px] rounded border border-aistroyka-warning bg-aistroyka-surface px-3 py-2 text-sm text-aistroyka-warning hover:bg-aistroyka-warning/20"
        >
          Retry
        </button>
      )}
    </div>
  );
}
