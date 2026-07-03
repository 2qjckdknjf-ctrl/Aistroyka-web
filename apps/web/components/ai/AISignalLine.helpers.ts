import type { AIState } from "@/lib/services/aiSignature";

/** Score-based color for Risk Scoring Engine v1. 0–30 idle, 30–60 indigo, 60–80 warning, 80–100 danger. */
export function getAISignalLinePropsFromScore(
  totalScore: number
): { visible: boolean; colorClass: string; pulse: boolean } {
  if (totalScore <= 30) {
    return { visible: true, colorClass: "bg-aistroyka-text-tertiary/40", pulse: false };
  }
  if (totalScore <= 60) {
    return { visible: true, colorClass: "bg-aistroyka-accent", pulse: false };
  }
  if (totalScore <= 80) {
    return { visible: true, colorClass: "bg-aistroyka-warning", pulse: false };
  }
  return { visible: true, colorClass: "bg-aistroyka-error", pulse: false };
}

/** State + severity → visibility, color class, pulse. */
export function getAISignalLineProps(
  state: AIState,
  severity?: number | null
): { visible: boolean; colorClass: string; pulse: boolean } {
  if (state === "idle") {
    return { visible: false, colorClass: "", pulse: false };
  }
  if (state === "analyzing") {
    return { visible: true, colorClass: "bg-aistroyka-accent", pulse: true };
  }
  if (state === "risk_detected") {
    const danger = severity != null && severity > 70;
    return {
      visible: true,
      colorClass: danger ? "bg-aistroyka-error" : "bg-aistroyka-warning",
      pulse: false,
    };
  }
  if (state === "optimization_found") {
    return { visible: true, colorClass: "bg-aistroyka-accent/80", pulse: false };
  }
  if (state === "milestone_achieved") {
    return { visible: true, colorClass: "bg-aistroyka-success", pulse: false };
  }
  return { visible: false, colorClass: "", pulse: false };
}
