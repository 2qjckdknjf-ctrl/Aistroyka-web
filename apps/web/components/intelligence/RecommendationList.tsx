"use client";

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
          {recommendations.slice(0, 5).map((r) => (
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
            </li>
          ))}
        </ul>
      )}
    </IntelligenceCard>
  );
}
