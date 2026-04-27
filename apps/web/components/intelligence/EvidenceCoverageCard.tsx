"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { EvidenceSignalData } from "./types";
import { IntelligenceCard } from "./IntelligenceCard";
import { SeverityBadge } from "./SeverityBadge";

export function EvidenceCoverageCard({
  signals,
  emptyMessage,
}: {
  signals: EvidenceSignalData[];
  emptyMessage?: string;
}) {
  const tDetail = useTranslations("dashboardDetail");
  const resolvedEmptyMessage = emptyMessage ?? tDetail("noEvidenceGaps");
  return (
    <IntelligenceCard title={tDetail("evidenceCoverage")} aria-label={tDetail("evidenceCoverage")}>
      {signals.length === 0 ? (
        <p className="text-aistroyka-subheadline text-aistroyka-text-tertiary">
          {resolvedEmptyMessage}
        </p>
      ) : (
        <ul className="space-y-2" aria-label={tDetail("evidenceGaps")}>
          {signals.slice(0, 5).map((s, i) => (
            <li key={s.at + (s.taskId ?? "") + i} className="flex flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <SeverityBadge severity={s.severity} />
                {s.required != null && s.actual != null && (
                  <span className="text-aistroyka-caption text-aistroyka-text-secondary">
                    {s.actual}/{s.required} {tDetail("photos")}
                  </span>
                )}
              </div>
              <p className="text-aistroyka-subheadline text-aistroyka-text-secondary">
                {s.message}
              </p>
              {s.taskId && (
                <Link
                  href={`/dashboard/tasks/${s.taskId}`}
                  className="mt-0.5 inline-block text-sm font-medium text-aistroyka-accent hover:underline"
                >
                  {tDetail("openTask")}
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}
    </IntelligenceCard>
  );
}
