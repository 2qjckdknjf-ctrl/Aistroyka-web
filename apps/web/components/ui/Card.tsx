"use client";

import type { ReactNode } from "react";
import { GlassSurface } from "@/components/design/liquid-glass";

export function Card({
  children,
  elevated = false,
  className = "",
}: {
  children: ReactNode;
  elevated?: boolean;
  className?: string;
}) {
  return (
    <GlassSurface
      intensity={elevated ? "medium" : "subtle"}
      padding="none"
      className={className}
      contentClassName="p-[var(--aistroyka-card-padding)]"
      motion={elevated ? ["interactive"] : []}
    >
      {children}
    </GlassSurface>
  );
}
