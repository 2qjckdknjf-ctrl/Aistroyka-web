"use client";

import { Button } from "./Button";

export function ErrorState({
  message,
  onRetry,
  className = "",
}: {
  message: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-[var(--aistroyka-space-5)] py-[var(--aistroyka-empty-padding)] text-center ${className}`.trim()}
      role="alert"
    >
      <div className="text-aistroyka-warning" aria-hidden>
        <svg
          className="h-[var(--aistroyka-empty-icon-sm)] w-[var(--aistroyka-empty-icon-sm)]"
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden
        >
          <path
            fillRule="evenodd"
            d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 9a1 1 0 011 1v2a1 1 0 11-2 0v-2a1 1 0 011-1zm0 5a1 1 0 100-2 1 1 0 000 2z"
            clipRule="evenodd"
          />
        </svg>
      </div>
      <p className="text-[var(--aistroyka-font-subheadline)] text-aistroyka-text-secondary">
        {message}
      </p>
      {onRetry ? (
        <Button variant="primary" onClick={onRetry}>
          Retry
        </Button>
      ) : null}
    </div>
  );
}
