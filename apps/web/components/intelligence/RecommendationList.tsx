"use client";

import { Link } from "@/i18n/navigation";
import { getResourceHref } from "@/lib/intelligence/resource-links";
import type { ActionRecommendationData } from "./types";
import { IntelligenceCard } from "./IntelligenceCard";
import { SeverityBadge } from "./SeverityBadge";

export function RecommendationList({
  recommendations,
  emptyMessage = "No recommended actions",
}: {
  recommendations: ActionRecommendationData[];
  emptyMessage?: string;
}) {
  return (
    <IntelligenceCard title="Recommended actions" aria-label="Recommended actions">
      {recommendations.length === 0 ? (
        <p className="text-aistroyka-subheadline text-aistroyka-text-tertiary">
          {emptyMessage}
        </p>
      ) : (
        <ul className="space-y-2" aria-label="Recommendations">
          {recommendations.slice(0, 5).map((r) => {
            const resolvedHref =
              r.relatedResourceType && r.relatedResourceId
                ? getResourceHref(
                    r.relatedResourceType,
                    r.relatedResourceId,
                    r.projectId
                  )
                : null;
            const href = resolvedHref ?? `/dashboard/projects/${r.projectId}`;
            return (
              <li key={r.id} className="flex flex-col gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  <SeverityBadge severity={r.priority} />
                  <span className="text-aistroyka-subheadline font-medium text-aistroyka-text-primary">
                    {r.title}
                  </span>
                </div>
                {r.description && (
                  <p className="text-aistroyka-caption text-aistroyka-text-secondary">
                    {r.description}
                  </p>
                )}
                <Link
                  href={href}
                  className="mt-0.5 inline-block text-sm font-medium text-aistroyka-accent hover:underline"
                >
                  Open →
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </IntelligenceCard>
  );
}
