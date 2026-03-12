"use client";

import type { SignalSeverity } from "./types";

const SEVERITY_CLASS: Record<SignalSeverity, string> = {
  low: "bg-aistroyka-info/15 text-aistroyka-info border-aistroyka-info/30",
  medium: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
  high: "bg-aistroyka-error/15 text-aistroyka-error border-aistroyka-error/30",
};

export function SeverityBadge({
  severity,
  className = "",
}: {
  severity: SignalSeverity;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-[var(--aistroyka-radius-md)] border px-2 py-0.5 text-[var(--aistroyka-font-caption)] font-medium uppercase tracking-wide ${SEVERITY_CLASS[severity]} ${className}`}
      aria-label={`Severity: ${severity}`}
    >
      {severity}
    </span>
  );
}
