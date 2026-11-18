"use client";

import { useTranslations } from "next-intl";
import type { GanttBarLayout, GanttMonthHeader } from "@/app/[locale]/(dashboard)/dashboard/projects/[id]/gantt-layout.utils";

type CanonGanttChartProps = {
  bars: GanttBarLayout[];
  monthHeaders: GanttMonthHeader[];
  todayPercent: number | null;
  selectedId: string | null;
  onSelect: (id: string) => void;
};

function barToneClass(bar: GanttBarLayout): string {
  if (bar.status === "done") return "canon-gantt-bar--done";
  if (bar.overdue) return "canon-gantt-bar--overdue";
  if (bar.status === "in_progress" || bar.status === "at_risk") return "canon-gantt-bar--active";
  return "canon-gantt-bar--planned";
}

export function CanonGanttChart({
  bars,
  monthHeaders,
  todayPercent,
  selectedId,
  onSelect,
}: CanonGanttChartProps) {
  const t = useTranslations("canon");

  if (bars.length === 0) {
    return (
      <p className="p-6 text-sm text-[var(--canon-text-muted)]">{t("ganttEmpty")}</p>
    );
  }

  return (
    <div className="canon-gantt-chart-wrap">
      <div className="canon-gantt-chart" role="img" aria-label={t("ganttChartLabel")}>
        <div className="canon-gantt-months">
          {monthHeaders.map((header) => (
            <div
              key={header.key}
              className="canon-gantt-month"
              style={{ left: `${header.leftPercent}%`, width: `${header.widthPercent}%` }}
            >
              {header.label}
            </div>
          ))}
        </div>

        <div className="canon-gantt-body">
          {todayPercent != null ? (
            <div className="canon-gantt-today" style={{ left: `${todayPercent}%` }} aria-hidden />
          ) : null}

          {bars.map((bar) => (
            <div key={bar.id} className="canon-gantt-row">
              <button
                type="button"
                className={`canon-gantt-label ${selectedId === bar.id ? "canon-gantt-label--active" : ""}`}
                onClick={() => onSelect(bar.id)}
              >
                <span className="truncate">{bar.title}</span>
              </button>
              <div className="canon-gantt-track">
                <button
                  type="button"
                  className={`canon-gantt-bar ${barToneClass(bar)} ${
                    selectedId === bar.id ? "canon-gantt-bar--selected" : ""
                  }`}
                  style={{ left: `${bar.leftPercent}%`, width: `${bar.widthPercent}%` }}
                  onClick={() => onSelect(bar.id)}
                  title={`${bar.title} · ${bar.endDate}`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="canon-gantt-legend canon-scroll-x mt-3 flex gap-3 text-xs">
        <span className="canon-gantt-legend-item">
          <span className="canon-gantt-legend-dot canon-gantt-bar--planned" aria-hidden />
          {t("ganttLegendPlanned")}
        </span>
        <span className="canon-gantt-legend-item">
          <span className="canon-gantt-legend-dot canon-gantt-bar--active" aria-hidden />
          {t("ganttLegendActive")}
        </span>
        <span className="canon-gantt-legend-item">
          <span className="canon-gantt-legend-dot canon-gantt-bar--done" aria-hidden />
          {t("ganttLegendDone")}
        </span>
        <span className="canon-gantt-legend-item">
          <span className="canon-gantt-legend-dot canon-gantt-bar--overdue" aria-hidden />
          {t("ganttLegendOverdue")}
        </span>
      </div>
    </div>
  );
}
