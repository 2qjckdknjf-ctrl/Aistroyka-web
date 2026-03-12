"use client";

import type { EvidenceSignalData } from "./types";
import { IntelligenceCard } from "./IntelligenceCard";
import { SeverityBadge } from "./SeverityBadge";

export function EvidenceCoverageCard({
  signals,
  emptyMessage = "No evidence gaps",
}: {
  signals: EvidenceSignalData[];
  emptyMessage?: string;
}) {
  return (
    <IntelligenceCard title="Evidence coverage" aria-label="Evidence coverage">
      {signals.length === 0 ? (
        <p className="text-aistroyka-subheadline text-aistroyka-text-tertiary">
          {emptyMessage}
        </p>
      ) : (
        <ul className="space-y-2" aria-label="Evidence gaps">
          {signals.slice(0, 5).map((s, i) => (
            <li key={s.at + (s.taskId ?? "") + i} className="flex flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <SeverityBadge severity={s.severity} />
                {s.required != null && s.actual != null && (
                  <span className="text-aistroyka-caption text-aistroyka-text-secondary">
                    {s.actual}/{s.required} photos
                  </span>
                )}
              </div>
              <p className="text-aistroyka-subheadline text-aistroyka-text-secondary">
                {s.message}
              </p>
            </li>
          ))}
        </ul>
      )}
    </IntelligenceCard>
  );
}
