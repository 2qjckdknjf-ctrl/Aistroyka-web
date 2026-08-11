"use client";

import { useMemo } from "react";
import type { AIState } from "@/lib/services/aiSignature";
import { getAISignalLineProps, getAISignalLinePropsFromScore } from "./AISignalLine.helpers";

export { getAISignalLineProps, getAISignalLinePropsFromScore } from "./AISignalLine.helpers";

export interface AISignalLineProps {
  state: AIState;
  /** Optional: for risk_detected, use danger color when severity > 70 */
  severity?: number | null;
  /** Optional: when set, color is derived from Risk Scoring Engine total_score (0–30 idle, 30–60 indigo, 60–80 warning, 80–100 danger) */
  totalScore?: number | null;
  /** Tooltip text; default explains AI Signal */
  title?: string;
  className?: string;
}

const DURATION_MS = 300;

/**
 * 2px vertical AI Signal line. Color by state; hidden for idle.
 * Animation: fade 0.3s; subtle pulse only for analyzing (opacity 0.06 -> 0.10). No glow.
 */
export function AISignalLine({ state, severity, totalScore, title, className = "" }: AISignalLineProps) {
  const { visible, colorClass, pulse } = useMemo(() => {
    if (totalScore != null && typeof totalScore === "number") {
      return getAISignalLinePropsFromScore(totalScore);
    }
    return getAISignalLineProps(state, severity ?? undefined);
  }, [state, severity, totalScore]);

  if (!visible) {
    return null;
  }

  const defaultTitle = "AI Signal indicates active intelligence insights.";
  return (
    <div
      className={`flex w-0.5 min-w-[2px] min-h-[24px] rounded-full ${colorClass} transition-opacity duration-300 ${
        pulse ? "animate-ai-signal-pulse" : "opacity-100"
      } ${className}`}
      title={title ?? defaultTitle}
      role="img"
      aria-label={title ?? defaultTitle}
    />
  );
}
