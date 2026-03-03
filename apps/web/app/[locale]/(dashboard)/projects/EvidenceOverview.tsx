"use client";

import type { EvidencePack } from "@/lib/intelligence/evidence";

export function EvidenceOverview({ pack }: { pack: EvidencePack | null }) {
  if (pack == null) {
    return (
      <div className="rounded-lg border border-aistroyka-border-subtle bg-aistroyka-surface-raised p-4 text-sm text-aistroyka-text-secondary sm:p-6">
        Evidence Overview: No analysis data. Run analyses to build evidence pack.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-aistroyka-border-subtle bg-aistroyka-surface-raised p-4 text-sm sm:p-6">
      <div className="font-medium text-aistroyka-text-primary">Evidence Overview</div>

      <div className="mt-4">
        <span className="text-aistroyka-text-tertiary">Driver list:</span>
        {pack.riskDrivers.length > 0 ? (
          <ul className="mt-2 list-inside list-disc text-aistroyka-text-primary">
            {pack.riskDrivers.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-aistroyka-text-secondary">None</p>
        )}
      </div>

      <div className="mt-4">
        <span className="text-aistroyka-text-tertiary">Supporting timeline entries:</span>
        {pack.timelineDeltas.length > 0 ? (
          <ul className="mt-2 list-inside list-disc text-aistroyka-text-primary">
            {pack.timelineDeltas.slice(-5).map((t, i) => (
              <li key={`${t.fromId}-${t.toId}-${i}`}>
                {t.fromDate.slice(0, 10)} → {t.toDate.slice(0, 10)}: completion{" "}
                {t.completionDelta >= 0 ? "+" : ""}
                {t.completionDelta}%, risk {t.riskDelta}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-aistroyka-text-secondary">None (need at least 2 analyses)</p>
        )}
      </div>

      <div className="mt-4">
        <span className="text-aistroyka-text-tertiary">Escalation path:</span>
        {pack.escalationPath.length > 0 ? (
          <ul className="mt-2 list-inside list-disc text-aistroyka-text-primary">
            {pack.escalationPath.map((s, i) => (
              <li key={`${i}-${s}`}>{s}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-aistroyka-text-secondary">None</p>
        )}
      </div>

      <div className="mt-4">
        <span className="text-aistroyka-text-tertiary">Confidence context:</span>{" "}
        <span className="text-aistroyka-text-primary">{pack.confidenceScore} (governance)</span>
      </div>

      {pack.anomalyReferences.length > 0 && (
        <div className="mt-4">
          <span className="text-aistroyka-text-tertiary">Anomaly references:</span>
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
