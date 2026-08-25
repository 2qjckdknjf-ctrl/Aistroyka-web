"use client";

import type { ReactNode } from "react";
import { DashboardGlassCard } from "@/components/dashboard/DashboardGlassCard";

type CanonSurfaceProps = {
  isCanon: boolean;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
};

/** Maps legacy DashboardGlassCard to canon-glass when skin=canon. */
export function CanonSurface({ isCanon, children, className, contentClassName }: CanonSurfaceProps) {
  if (isCanon) {
    return (
      <div className={`canon-glass ${className ?? ""} ${contentClassName ?? ""}`.trim()}>
        {children}
      </div>
    );
  }
  return (
    <DashboardGlassCard className={className} contentClassName={contentClassName}>
      {children}
    </DashboardGlassCard>
  );
}
