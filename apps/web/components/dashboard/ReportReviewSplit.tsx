"use client";

import type { ReactNode } from "react";

/**
 * Canonical Surface E review chrome: evidence (context/media/AI) left,
 * manager decision sticky on the right at desktop; stacked on phone.
 */
export function ReportReviewSplit({
  evidence,
  decision,
  evidenceLabel,
  decisionLabel,
}: {
  evidence: ReactNode;
  decision: ReactNode;
  evidenceLabel: string;
  decisionLabel: string;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(16rem,0.9fr)]">
      <section className="min-w-0 space-y-4" aria-label={evidenceLabel}>
        {evidence}
      </section>
      <aside
        className="min-w-0 space-y-4 lg:sticky lg:top-20 lg:self-start"
        aria-label={decisionLabel}
      >
        {decision}
      </aside>
    </div>
  );
}
