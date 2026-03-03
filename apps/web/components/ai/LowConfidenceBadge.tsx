"use client";

export function LowConfidenceBadge() {
  return (
    <span
      className="inline-flex items-center rounded bg-aistroyka-warning/20 px-2 py-0.5 text-xs font-medium text-aistroyka-warning"
      role="status"
    >
      Limited context
    </span>
  );
}
