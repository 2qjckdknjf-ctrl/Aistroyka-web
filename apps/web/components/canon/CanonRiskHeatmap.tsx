"use client";

import { useTranslations } from "next-intl";

type HeatmapCell = { level: number; label: string };

export function CanonRiskHeatmap({ cells }: { cells: HeatmapCell[] }) {
  const t = useTranslations("canon");

  return (
    <div className="canon-glass p-4">
      <p className="text-sm font-semibold text-[var(--canon-text-primary)]">{t("aiRiskHeatmap")}</p>
      <p className="mt-1 text-xs text-[var(--canon-text-muted)]">{t("aiRiskHeatmapHint")}</p>
      <div className="canon-risk-heatmap mt-4" role="img" aria-label={t("aiRiskHeatmap")}>
        {cells.map((cell, index) => (
          <div
            key={index}
            className={`canon-risk-heatmap-cell canon-risk-heatmap-cell--${cell.level}`}
            title={cell.label}
          />
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[10px] text-[var(--canon-text-muted)]">
        <span>{t("aiHeatmapLow")}</span>
        <span>{t("aiHeatmapHigh")}</span>
      </div>
    </div>
  );
}

/** Build 5×5 heatmap intensity from AI job summary (legacy fallback). */
export function buildAiRiskHeatmapCells(summary: {
  failed: number;
  dead: number;
  queued: number;
  running: number;
  success: number;
}): HeatmapCell[] {
  const cells: HeatmapCell[] = [];
  const hot = summary.failed + summary.dead;
  const warm = summary.queued + summary.running;
  const cool = summary.success;

  for (let row = 0; row < 5; row += 1) {
    for (let col = 0; col < 5; col += 1) {
      const impact = col;
      const probability = row;
      let level = 0;
      if (impact >= 3 && probability >= 3 && hot > 0) level = 4;
      else if (impact >= 2 && probability >= 2 && hot > 0) level = 3;
      else if (warm > 0 && impact + probability >= 4) level = 2;
      else if (cool > 0 && impact + probability <= 2) level = 1;
      cells.push({ level, label: `P${probability} I${impact}` });
    }
  }
  return cells;
}
