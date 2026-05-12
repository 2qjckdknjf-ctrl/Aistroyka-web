"use client";

import { useTranslations } from "next-intl";
import type { ExecutiveSummaryData, ExecutiveProjectSummaryData } from "./types";
import { IntelligenceCard } from "./IntelligenceCard";

export function SummaryCard({
  summary,
}: {
  summary: ExecutiveSummaryData | ExecutiveProjectSummaryData;
}) {
  const tDetail = useTranslations("dashboardDetail");
  return (
    <IntelligenceCard title={tDetail("executiveSummary")} aria-label={tDetail("executiveSummary")}>
      <p className="text-aistroyka-subheadline font-medium text-aistroyka-text-primary">
        {summary.headline}
      </p>
      <p className="mt-2 text-aistroyka-subheadline text-aistroyka-text-secondary">
        {summary.summary}
      </p>
      {summary.topRisks.length > 0 && (
        <ul className="mt-3 list-disc space-y-1 pl-4 text-aistroyka-subheadline text-aistroyka-text-secondary">
          {summary.topRisks.slice(0, 5).map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
      )}
      {summary.recommendedActions.length > 0 && (
        <p className="mt-3 text-aistroyka-caption font-medium text-aistroyka-accent">
          {tDetail("recommended")}: {summary.recommendedActions.slice(0, 3).join(" • ")}
        </p>
      )}
      {"dataSufficiency" in summary && summary.dataSufficiency && summary.dataSufficiency !== "sufficient" && (
        <p className="mt-2 text-xs text-aistroyka-text-tertiary">{tDetail("data")}: {summary.dataSufficiency}</p>
      )}
      {"missingDataDisclaimer" in summary && summary.missingDataDisclaimer && (
        <p className="mt-2 text-xs text-aistroyka-warning">{summary.missingDataDisclaimer}</p>
      )}
    </IntelligenceCard>
  );
}
