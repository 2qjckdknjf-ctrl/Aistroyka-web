import type { ReactNode } from "react";
import type { LiquidGlassMotion } from "@/lib/design/liquid-glass";
import { LiquidGlass } from "./LiquidGlass";

type GlassHeroCardProps = {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  /** Enable single-page float accent (max one per viewport in LG-2). */
  float?: boolean;
};

/** Hero/feature card primitive for LG-2 public redesign. */
export function GlassHeroCard({
  children,
  className = "",
  contentClassName = "",
  float = false,
}: GlassHeroCardProps) {
  const motion: LiquidGlassMotion[] = ["enter", "glow", "interactive"];
  if (float) motion.push("float");

  return (
    <LiquidGlass
      variant="hero"
      intensity="medium"
      motion={motion}
      className={className}
      contentClassName={contentClassName}
    >
      {children}
    </LiquidGlass>
  );
}
