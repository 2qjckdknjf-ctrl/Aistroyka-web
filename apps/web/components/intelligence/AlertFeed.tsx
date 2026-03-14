"use client";

import { Link } from "@/i18n/navigation";
import { getAlertFallbackHref } from "@/lib/dashboard/alert-fallback-href";
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
          {alerts.slice(0, 10).map((a) => {
            const href = getAlertFallbackHref(a.type);
            return (
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
                {href && (
                  <Link
                    href={href}
                    className="mt-1.5 inline-block text-sm font-medium text-aistroyka-accent hover:underline"
                  >
                    Open related →
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </IntelligenceCard>
  );
}
