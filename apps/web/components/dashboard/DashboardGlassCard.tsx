"use client";

import type { ReactNode } from "react";
import { GlassSurface } from "@/components/design/liquid-glass";
import type { LiquidGlassIntensity } from "@/lib/design/liquid-glass";

type DashboardGlassCardProps = {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  intensity?: LiquidGlassIntensity;
  "aria-label"?: string;
};

/** Dashboard metric/queue panel on Liquid Glass (canonical redesign). */
export function DashboardGlassCard({
  children,
  className = "",
  contentClassName = "p-aistroyka-4",
  intensity = "medium",
  "aria-label": ariaLabel,
}: DashboardGlassCardProps) {
  return (
    <GlassSurface
      padding="none"
      intensity={intensity}
      className={className}
      contentClassName={contentClassName}
      aria-label={ariaLabel}
    >
      {children}
    </GlassSurface>
  );
}
