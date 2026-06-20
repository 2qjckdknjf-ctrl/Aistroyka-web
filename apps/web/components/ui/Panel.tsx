"use client";

import type { ReactNode } from "react";
import { GlassSurface } from "@/components/design/liquid-glass";

type PanelProps = {
  children: ReactNode;
  className?: string;
};

export function Panel({ children, className = "" }: PanelProps) {
  return (
    <GlassSurface intensity="subtle" padding="none" className={className} contentClassName="p-4 sm:p-6">
      {children}
    </GlassSurface>
  );
}
