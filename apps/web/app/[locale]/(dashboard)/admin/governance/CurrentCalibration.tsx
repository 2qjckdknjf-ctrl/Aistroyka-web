"use client";

import { useState } from "react";
import { Card } from "@/components/ui";
import { Button } from "@/components/ui/Button";

type Latest = {
  created_at: string;
  calibration_version: string;
  thresholds_smoothed: Record<string, number>;
  smoothing_alpha: number | null;
} | null;

export function CurrentCalibration({ latest }: { latest: Latest }) {
  const [showExplain, setShowExplain] = useState(false);

  if (!latest) {
    return (
      <Card className="border-l-4 border-l-aistroyka-text-tertiary">
        <h2 className="text-aistroyka-headline font-semibold text-aistroyka-text-primary">Current Calibration</h2>
        <p className="mt-aistroyka-2 text-aistroyka-subheadline text-aistroyka-text-secondary">
          No calibration snapshot yet. Run the daily org pipeline to generate thresholds.
        </p>
      </Card>
    );
  }

  const date = new Date(latest.created_at).toLocaleDateString(undefined, { dateStyle: "medium" });
  const alpha = latest.smoothing_alpha != null ? latest.smoothing_alpha.toFixed(2) : "-";

  return (
    <Card className="border-l-4 border-l-aistroyka-accent">
      <h2 className="text-aistroyka-headline font-semibold text-aistroyka-text-primary">Current Calibration</h2>
      <dl className="mt-aistroyka-3 grid gap-aistroyka-2 text-aistroyka-subheadline sm:grid-cols-3">
        <div>
          <dt className="text-aistroyka-text-tertiary">Date</dt>
          <dd className="font-medium text-aistroyka-text-primary">{date}</dd>
        </div>
        <div>
          <dt className="text-aistroyka-text-tertiary">Version</dt>
          <dd className="font-medium text-aistroyka-text-primary">{latest.calibration_version}</dd>
        </div>
        <div>
          <dt className="text-aistroyka-text-tertiary">Smoothing alpha</dt>
          <dd className="font-medium text-aistroyka-text-primary">{alpha}</dd>
        </div>
      </dl>
      {latest.thresholds_smoothed && Object.keys(latest.thresholds_smoothed).length > 0 && (
        <div className="mt-aistroyka-3">
          <dt className="text-aistroyka-caption text-aistroyka-text-tertiary">Thresholds (smoothed)</dt>
          <dd className="mt-1 font-mono text-aistroyka-callout text-aistroyka-text-secondary">
            {Object.entries(latest.thresholds_smoothed).map(([k, v]) => (
              <span key={k} className="mr-aistroyka-4">
                {k}: {typeof v === "number" ? v.toFixed(2) : String(v)}
              </span>
            ))}
          </dd>
        </div>
      )}
      <div className="mt-aistroyka-4" id="ai_threshold_explainability">
        <Button variant="secondary" size="sm" onClick={() => setShowExplain((v) => !v)} aria-expanded={showExplain}>
          {showExplain ? "Hide" : "Why these thresholds?"}
        </Button>
        {showExplain && (
          <div className="mt-aistroyka-3 rounded-aistroyka-lg border border-aistroyka-border-subtle bg-aistroyka-surface-raised p-aistroyka-4 text-aistroyka-subheadline text-aistroyka-text-secondary">
            <p>Thresholds calibrated over last 30 days. Exponential smoothing alpha={alpha}. Guardrails applied. Updated: {date}.</p>
            {latest.thresholds_smoothed && Object.entries(latest.thresholds_smoothed).map(([key, value]) => (
              <p key={key} className="mt-aistroyka-2">
                <strong className="text-aistroyka-text-primary">{key}</strong>: Calibrated over 30 days. Smoothing alpha={alpha}. Value: {typeof value === "number" ? value.toFixed(2) : String(value)}.
              </p>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
