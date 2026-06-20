"use client";

import type { ReactNode } from "react";
import { GlassSurface } from "@/components/design/liquid-glass";

type PublicRevealGlassCardProps = {
  children: ReactNode;
  className?: string;
  /** Demo feature-card parity — hover lift + active scale */
  interactive?: boolean;
  intensity?: "subtle" | "medium" | "strong";
};

/** Scroll-revealed glass card for public marketing sections (demo `data-reveal` parity). */
export function PublicRevealGlassCard({
  children,
  className = "",
  interactive = false,
  intensity = "medium",
}: PublicRevealGlassCardProps) {
  return (
    <GlassSurface
      intensity={intensity}
      padding="md"
      reveal
      motion={interactive ? ["interactive"] : []}
      className={className}
    >
      {children}
    </GlassSurface>
  );
}
