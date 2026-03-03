"use client";

import type { ReactNode } from "react";

type Style = "error" | "success" | "warning" | "info";

const borderTintClasses: Record<Style, string> = {
  error: "border-aistroyka-error/50 text-aistroyka-error",
  success: "border-aistroyka-success/50 text-aistroyka-success",
  warning: "border-aistroyka-warning/50 text-aistroyka-warning",
  info: "border-aistroyka-info/50 text-aistroyka-info",
};

function Icon({ style }: { style: Style }) {
  if (style === "error" || style === "warning") {
    return (
      <svg
        className="h-5 w-5 shrink-0"
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
    );
  }
  if (style === "success") {
    return (
      <svg
        className="h-5 w-5 shrink-0"
        fill="currentColor"
        viewBox="0 0 20 20"
        aria-hidden
      >
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
          clipRule="evenodd"
        />
      </svg>
    );
  }
  return (
    <svg
      className="h-5 w-5 shrink-0"
      fill="currentColor"
      viewBox="0 0 20 20"
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function Alert({
  message,
  style = "error",
  onDismiss,
  className = "",
}: {
  message: ReactNode;
  style?: Style;
  onDismiss?: () => void;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={`flex items-start gap-[var(--aistroyka-space-3)] rounded-[var(--aistroyka-radius-md)] border bg-aistroyka-surface p-[var(--aistroyka-space-4)] ${borderTintClasses[style]} ${className}`.trim()}
    >
      <Icon style={style} />
      <p className="min-w-0 flex-1 text-[var(--aistroyka-font-subheadline)] font-medium text-aistroyka-text-primary">
        {message}
      </p>
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 rounded p-1 text-aistroyka-text-secondary hover:opacity-70 focus:outline-none focus:ring-2 focus:ring-aistroyka-accent focus:ring-offset-2"
          aria-label="Dismiss"
        >
          <svg
            className="h-5 w-5"
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden
          >
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      ) : null}
    </div>
  );
}
