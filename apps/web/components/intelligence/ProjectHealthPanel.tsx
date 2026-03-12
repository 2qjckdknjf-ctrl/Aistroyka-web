"use client";

import type { ProjectHealthData } from "./types";
import { IntelligenceCard } from "./IntelligenceCard";

const LABEL_CLASS: Record<ProjectHealthData["label"], string> = {
  healthy: "text-aistroyka-success",
  moderate: "text-amber-600 dark:text-amber-400",
  unstable: "text-amber-700 dark:text-amber-300",
  critical: "text-aistroyka-error",
};

export function ProjectHealthPanel({
  health,
  emptyMessage = "Health not available",
}: {
  health?: ProjectHealthData | null;
  emptyMessage?: string;
}) {
  if (!health) {
    return (
      <IntelligenceCard title="Project health" aria-label="Project health">
        <p className="text-aistroyka-subheadline text-aistroyka-text-tertiary">
          {emptyMessage}
        </p>
      </IntelligenceCard>
    );
  }
  return (
    <IntelligenceCard title="Project health" aria-label="Project health">
      <div className="flex flex-wrap items-baseline gap-3">
        <span className="text-aistroyka-title3 font-bold tabular-nums text-aistroyka-text-primary">
          {health.score}
        </span>
        <span className={`text-aistroyka-subheadline font-semibold uppercase ${LABEL_CLASS[health.label]}`}>
          {health.label}
        </span>
      </div>
      {health.blockers.length > 0 && (
        <ul className="mt-2 list-disc space-y-0.5 pl-4 text-aistroyka-subheadline text-aistroyka-error">
          {health.blockers.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>
      )}
      {health.missingData.length > 0 && (
        <p className="mt-2 text-aistroyka-caption text-aistroyka-text-secondary">
          Missing: {health.missingData.join(", ")}
        </p>
      )}
      {health.delayIndicators.length > 0 && (
        <p className="mt-1 text-aistroyka-caption text-aistroyka-text-tertiary">
          Delays: {health.delayIndicators.join(", ")}
        </p>
      )}
    </IntelligenceCard>
  );
}
