import type { ReactNode } from "react";
import type { LiquidGlassMotion } from "@/lib/design/liquid-glass";
import { LiquidGlass } from "./LiquidGlass";

type GlassHeroCardProps = {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
};

/** Signature hero showcase — glow + 3D tilt (demo balance-card parity). */
export function GlassHeroCard({ children, className = "", contentClassName = "" }: GlassHeroCardProps) {
  return (
    <LiquidGlass
      variant="hero"
      intensity="strong"
      motion={["glow"]}
      tilt
      className={className}
      contentClassName={contentClassName}
    >
      {children}
    </LiquidGlass>
  );
}
