"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { getAlertDestinations } from "@/lib/dashboard/alert-destinations";
import type { AlertItemData } from "./types";
import { IntelligenceCard } from "./IntelligenceCard";

function severityClass(s: string): string {
  if (s === "critical") return "border-l-aistroyka-error";
  if (s === "warn") return "border-l-aistroyka-warning";
  return "border-l-aistroyka-info";
}

export function AlertFeed({
  alerts,
  emptyMessage,
  maxItems = 10,
}: {
  alerts: AlertItemData[];
  emptyMessage?: string;
  /** Omit or pass null to render the full list (alerts workspace). */
  maxItems?: number | null;
}) {
  const tDetail = useTranslations("dashboardDetail");
  const resolvedEmptyMessage = emptyMessage ?? tDetail("noAlerts");
  const visible = maxItems == null ? alerts : alerts.slice(0, maxItems);
  return (
    <IntelligenceCard title={tDetail("tenantAlerts")} aria-label={tDetail("alertsFeed")}>
      {visible.length === 0 ? (
        <p className="text-aistroyka-subheadline text-aistroyka-text-tertiary">
          {resolvedEmptyMessage}
        </p>
      ) : (
        <ul className="space-y-2" aria-label={tDetail("alertList")}>
          {visible.map((a) => {
            const d = getAlertDestinations(a.id, a.type);
            return (
              <li
                key={a.id}
                id={`alert-${a.id}`}
                className={`scroll-mt-4 rounded-[var(--aistroyka-radius-md)] border-l-4 bg-aistroyka-bg-primary/50 px-2 py-2 ${severityClass(a.severity)}`}
              >
                <p className="text-aistroyka-subheadline font-medium text-aistroyka-text-primary">
                  {a.message}
                </p>
                <p className="mt-0.5 text-aistroyka-caption text-aistroyka-text-tertiary">
                  <span className="font-mono text-[11px]">{d.alertType}</span>
                  {" · "}
                  {new Date(a.created_at).toLocaleString()}
                  {d.linkage === "list_anchor_only" && (
                    <span className="ml-1 text-aistroyka-text-tertiary"> · {tDetail("listOnlyRouting")}</span>
                  )}
                </p>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                  {d.contextHref && d.contextLabel && (
                    <Link
                      href={d.contextHref}
                      className="text-sm font-medium text-aistroyka-accent hover:underline"
                    >
                      {d.contextLabel} →
                    </Link>
                  )}
                  <Link
                    href={d.anchoredListHref}
                    className={`text-sm hover:underline ${
                      d.contextHref
                        ? "text-aistroyka-text-secondary hover:text-aistroyka-accent"
                        : "font-medium text-aistroyka-accent"
                    }`}
                  >
                    {d.contextHref ? d.anchoredListLabel : tDetail("openOnAlertsList")}
                  </Link>
                </div>
                {d.honestyNote && (
                  <p className="mt-1.5 text-xs text-aistroyka-text-tertiary">{d.honestyNote}</p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </IntelligenceCard>
  );
}
