"use client";

import type { ReactNode } from "react";
import { LiquidGlass } from "@/components/design/liquid-glass";

export function DashboardCockpitHero({ children }: { children: ReactNode }) {
  return (
    <LiquidGlass
      variant="hero"
      intensity="strong"
      motion={["enter", "glow"]}
      className="mb-aistroyka-6"
      contentClassName="px-aistroyka-4 py-aistroyka-4 text-aistroyka-text-on-branded"
    >
      {children}
    </LiquidGlass>
  );
}
