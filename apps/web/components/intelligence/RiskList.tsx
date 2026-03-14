"use client";

import { Link } from "@/i18n/navigation";
import { getResourceHref } from "@/lib/intelligence/resource-links";
import type { RiskSignalData } from "./types";
import { SeverityBadge } from "./SeverityBadge";

export function RiskList({
  risks,
  maxItems = 5,
  emptyMessage = "No risk signals",
}: {
  risks: RiskSignalData[];
  maxItems?: number;
  emptyMessage?: string;
}) {
  if (risks.length === 0) {
    return (
      <p className="text-aistroyka-subheadline text-aistroyka-text-tertiary">
        {emptyMessage}
      </p>
    );
  }
  return (
    <ul className="space-y-2" aria-label="Risk list">
      {risks.slice(0, maxItems).map((r, i) => {
        const href =
          r.resourceType && r.resourceId
            ? getResourceHref(r.resourceType, r.resourceId, r.projectId)
            : null;
        return (
          <li key={r.at + i} className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <SeverityBadge severity={r.severity} />
              <span className="text-aistroyka-subheadline font-medium text-aistroyka-text-primary">
                {r.title}
              </span>
            </div>
            {r.description && (
              <p className="text-aistroyka-caption text-aistroyka-text-secondary">
                {r.description}
              </p>
            )}
            {href && (
              <Link
                href={href}
                className="mt-0.5 inline-block text-sm font-medium text-aistroyka-accent hover:underline"
              >
                Open related →
              </Link>
            )}
          </li>
        );
      })}
    </ul>
  );
}
