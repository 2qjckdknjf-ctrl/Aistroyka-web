"use client";

import { useTranslations } from "next-intl";
import type { EvidencePack } from "@/lib/intelligence/evidence";

export function EvidenceOverview({ pack }: { pack: EvidencePack | null }) {
  const tDetail = useTranslations("dashboardDetail");
  if (pack == null) {
    return (
      <div className="surface-glass-raised rounded-lg p-4 text-sm text-aistroyka-text-secondary sm:p-6">
        {tDetail("evidenceOverviewEmpty")}
      </div>
    );
  }

  return (
    <div className="surface-glass-raised rounded-lg p-4 text-sm sm:p-6">
      <div className="font-medium text-aistroyka-text-primary">{tDetail("evidenceOverview")}</div>

      <div className="mt-4">
        <span className="text-aistroyka-text-tertiary">{tDetail("driverList")}:</span>
        {pack.riskDrivers.length > 0 ? (
          <ul className="mt-2 list-inside list-disc text-aistroyka-text-primary">
            {pack.riskDrivers.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-aistroyka-text-secondary">{tDetail("none")}</p>
        )}
      </div>

      <div className="mt-4">
        <span className="text-aistroyka-text-tertiary">{tDetail("supportingTimelineEntries")}:</span>
        {pack.timelineDeltas.length > 0 ? (
          <ul className="mt-2 list-inside list-disc text-aistroyka-text-primary">
            {pack.timelineDeltas.slice(-5).map((t, i) => (
              <li key={`${t.fromId}-${t.toId}-${i}`}>
                {t.fromDate.slice(0, 10)} → {t.toDate.slice(0, 10)}: {tDetail("completion").toLowerCase()}{" "}
                {t.completionDelta >= 0 ? "+" : ""}
                {t.completionDelta}%, {tDetail("risk").toLowerCase()} {t.riskDelta}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-aistroyka-text-secondary">{tDetail("noneNeedAtLeastTwoAnalyses")}</p>
        )}
      </div>

      <div className="mt-4">
        <span className="text-aistroyka-text-tertiary">{tDetail("escalationPath")}:</span>
        {pack.escalationPath.length > 0 ? (
          <ul className="mt-2 list-inside list-disc text-aistroyka-text-primary">
            {pack.escalationPath.map((s, i) => (
              <li key={`${i}-${s}`}>{s}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-aistroyka-text-secondary">{tDetail("none")}</p>
        )}
      </div>

      <div className="mt-4">
        <span className="text-aistroyka-text-tertiary">{tDetail("confidenceContext")}:</span>{" "}
        <span className="text-aistroyka-text-primary">{pack.confidenceScore} ({tDetail("governance").toLowerCase()})</span>
      </div>

      {pack.anomalyReferences.length > 0 && (
        <div className="mt-4">
          <span className="text-aistroyka-text-tertiary">{tDetail("anomalyReferences")}:</span>
          <ul className="mt-2 list-inside list-disc text-aistroyka-text-primary">
            {pack.anomalyReferences.map((a) => (
              <li key={a.analysisId + a.type}>
                {a.type} — {a.analysisDate.slice(0, 10)} (id: {a.analysisId.slice(0, 8)}…)
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
