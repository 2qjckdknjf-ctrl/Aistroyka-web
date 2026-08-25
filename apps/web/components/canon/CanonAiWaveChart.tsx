"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";

export type AiWavePoint = {
  label: string;
  total: number;
  risk: number;
};

function buildSmoothPath(points: AiWavePoint[], width: number, height: number, key: "total" | "risk"): string {
  if (points.length === 0) return "";
  const max = Math.max(...points.map((p) => (key === "total" ? p.total : p.risk)), 1);
  const padY = 8;
  const usableH = height - padY * 2;

  const coords = points.map((p, i) => {
    const x = points.length === 1 ? width / 2 : (i / (points.length - 1)) * width;
    const v = key === "total" ? p.total : p.risk;
    const y = height - padY - (v / max) * usableH;
    return { x, y };
  });

  if (coords.length === 1) {
    return `M ${coords[0].x} ${coords[0].y}`;
  }

  let d = `M ${coords[0].x} ${coords[0].y}`;
  for (let i = 1; i < coords.length; i += 1) {
    const prev = coords[i - 1];
    const curr = coords[i];
    const cx = (prev.x + curr.x) / 2;
    d += ` Q ${cx} ${prev.y} ${curr.x} ${curr.y}`;
  }
  return d;
}

export function CanonAiWaveChart({ points }: { points: AiWavePoint[] }) {
  const t = useTranslations("canon");
  const totalPath = useMemo(() => buildSmoothPath(points, 400, 80, "total"), [points]);
  const riskPath = useMemo(() => buildSmoothPath(points, 400, 80, "risk"), [points]);

  return (
    <div className="canon-ai-wave-chart" aria-hidden>
      <svg viewBox="0 0 400 80" className="h-20 w-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="canon-wave-total" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00d4ff" />
            <stop offset="100%" stopColor="#ffd54f" />
          </linearGradient>
          <linearGradient id="canon-wave-risk" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f87171" />
            <stop offset="100%" stopColor="#fb923c" />
          </linearGradient>
        </defs>
        {totalPath ? (
          <path d={totalPath} fill="none" stroke="url(#canon-wave-total)" strokeWidth="2.5" opacity="0.85" />
        ) : null}
        {riskPath ? (
          <path d={riskPath} fill="none" stroke="url(#canon-wave-risk)" strokeWidth="2" opacity="0.9" />
        ) : null}
      </svg>
      {points.length > 0 ? (
        <div className="mt-1 flex justify-between text-[10px] text-[var(--canon-text-muted)]">
          <span>{points[0]?.label}</span>
          <span>{points[points.length - 1]?.label}</span>
        </div>
      ) : (
        <p className="mt-2 text-xs text-[var(--canon-text-muted)]">{t("aiPortfolioChartEmpty")}</p>
      )}
    </div>
  );
}
