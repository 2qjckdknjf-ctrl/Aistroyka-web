"use client";

import type { ReportSignalData } from "./types";
import { IntelligenceCard } from "./IntelligenceCard";
import { SeverityBadge } from "./SeverityBadge";

export function ReportingDisciplineCard({
  signals,
  emptyMessage = "No reporting issues",
}: {
  signals: ReportSignalData[];
  emptyMessage?: string;
}) {
  return (
    <IntelligenceCard title="Reporting discipline" aria-label="Reporting discipline">
      {signals.length === 0 ? (
        <p className="text-aistroyka-subheadline text-aistroyka-text-tertiary">
          {emptyMessage}
        </p>
      ) : (
        <ul className="space-y-2" aria-label="Report signals">
          {signals.slice(0, 5).map((s, i) => (
            <li key={s.at + (s.dayId ?? "") + i} className="flex flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <SeverityBadge severity={s.severity} />
                <span className="text-aistroyka-caption text-aistroyka-text-secondary">
                  {s.type}
                </span>
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
