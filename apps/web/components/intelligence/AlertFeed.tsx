"use client";

import type { AlertItemData } from "./types";
import { IntelligenceCard } from "./IntelligenceCard";

function severityClass(s: string): string {
  if (s === "critical") return "border-l-aistroyka-error";
  if (s === "warn") return "border-l-amber-500";
  return "border-l-aistroyka-info";
}

export function AlertFeed({
  alerts,
  emptyMessage = "No alerts",
}: {
  alerts: AlertItemData[];
  emptyMessage?: string;
}) {
  return (
    <IntelligenceCard title="Alerts" aria-label="Alerts feed">
      {alerts.length === 0 ? (
        <p className="text-aistroyka-subheadline text-aistroyka-text-tertiary">
          {emptyMessage}
        </p>
      ) : (
        <ul className="space-y-2" aria-label="Alert list">
          {alerts.slice(0, 10).map((a) => (
            <li
              key={a.id}
              className={`rounded-[var(--aistroyka-radius-md)] border-l-4 bg-aistroyka-bg-primary/50 px-2 py-2 ${severityClass(a.severity)}`}
            >
              <p className="text-aistroyka-subheadline font-medium text-aistroyka-text-primary">
                {a.message}
              </p>
              <p className="mt-0.5 text-aistroyka-caption text-aistroyka-text-tertiary">
                {a.type} · {new Date(a.created_at).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </IntelligenceCard>
  );
}
