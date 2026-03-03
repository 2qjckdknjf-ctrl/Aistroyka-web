"use client";

import type { ReactNode } from "react";
import type { AIState } from "@/lib/services/aiSignature";

export interface StructuralGridActivationProps {
  state: AIState;
  /** When true, add subtle highlight around content (e.g. AI Insights panel when analyzing/risk) */
  highlight?: boolean;
  children: ReactNode;
  className?: string;
}

/**
 * Blueprint grid opacity changes subtly by AIState.
 * Optional local highlight around AI Insights panel when analyzing/risk.
 */
export function StructuralGridActivation({
  state,
  highlight = false,
  children,
  className = "",
}: StructuralGridActivationProps) {
  const gridOpacity = state === "idle" ? 0.03 : state === "analyzing" || state === "risk_detected" ? 0.06 : 0.04;
  const showHighlight = highlight && (state === "analyzing" || state === "risk_detected");

  return (
    <div
      className={`relative ${className}`}
      data-ai-state={state}
    >
      {/* Subtle blueprint grid overlay */}
      <div
        className="pointer-events-none absolute inset-0 rounded-[var(--aistroyka-radius-card)]"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(115, 66, 217, ${gridOpacity}) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(115, 66, 217, ${gridOpacity}) 1px, transparent 1px)
          `,
          backgroundSize: "12px 12px",
        }}
        aria-hidden
      />
      <div className={`relative ${showHighlight ? "ring-1 ring-aistroyka-accent/30 rounded-[var(--aistroyka-radius-card)]" : ""}`}>
        {children}
      </div>
    </div>
  );
}
