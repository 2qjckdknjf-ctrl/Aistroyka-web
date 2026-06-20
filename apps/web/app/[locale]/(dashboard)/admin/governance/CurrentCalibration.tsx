"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui";
import { Button } from "@/components/ui/Button";

type Latest = {
  created_at: string;
  calibration_version: string;
  thresholds_smoothed: Record<string, number>;
  smoothing_alpha: number | null;
} | null;

export function CurrentCalibration({ latest }: { latest: Latest }) {
  const tDetail = useTranslations("dashboardDetail");
  const [showExplain, setShowExplain] = useState(false);

  if (!latest) {
    return (
      <Card className="border-l-4 border-l-aistroyka-text-tertiary">
        <h2 className="text-aistroyka-headline font-semibold text-aistroyka-text-primary">{tDetail("currentCalibration")}</h2>
        <p className="mt-aistroyka-2 text-aistroyka-subheadline text-aistroyka-text-secondary">
          {tDetail("noCalibrationSnapshotYet")}
        </p>
      </Card>
    );
  }

  const date = new Date(latest.created_at).toLocaleDateString(undefined, { dateStyle: "medium" });
  const alpha = latest.smoothing_alpha != null ? latest.smoothing_alpha.toFixed(2) : "-";

  return (
    <Card className="border-l-4 border-l-aistroyka-accent">
      <h2 className="text-aistroyka-headline font-semibold text-aistroyka-text-primary">{tDetail("currentCalibration")}</h2>
      <dl className="mt-aistroyka-3 grid gap-aistroyka-2 text-aistroyka-subheadline sm:grid-cols-3">
        <div>
          <dt className="text-aistroyka-text-tertiary">{tDetail("date")}</dt>
          <dd className="font-medium text-aistroyka-text-primary">{date}</dd>
        </div>
        <div>
          <dt className="text-aistroyka-text-tertiary">{tDetail("version")}</dt>
          <dd className="font-medium text-aistroyka-text-primary">{latest.calibration_version}</dd>
        </div>
        <div>
          <dt className="text-aistroyka-text-tertiary">{tDetail("smoothingAlpha")}</dt>
          <dd className="font-medium text-aistroyka-text-primary">{alpha}</dd>
        </div>
      </dl>
      {latest.thresholds_smoothed && Object.keys(latest.thresholds_smoothed).length > 0 && (
        <div className="mt-aistroyka-3">
          <dt className="text-aistroyka-caption text-aistroyka-text-tertiary">{tDetail("thresholdsSmoothed")}</dt>
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
          {showExplain ? tDetail("hide") : tDetail("whyTheseThresholds")}
        </Button>
        {showExplain && (
          <div className="surface-glass-raised mt-aistroyka-3 rounded-aistroyka-lg p-aistroyka-4 text-aistroyka-subheadline text-aistroyka-text-secondary">
            <p>{tDetail("thresholdsCalibratedHint", { alpha, date })}</p>
            {latest.thresholds_smoothed && Object.entries(latest.thresholds_smoothed).map(([key, value]) => (
              <p key={key} className="mt-aistroyka-2">
                <strong className="text-aistroyka-text-primary">{key}</strong>: {tDetail("calibratedValueHint", { alpha })} {typeof value === "number" ? value.toFixed(2) : String(value)}.
              </p>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
