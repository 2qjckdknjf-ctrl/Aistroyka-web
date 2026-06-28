import type { ReactNode } from "react";
import { LiquidGlass, type LiquidGlassProps } from "./LiquidGlass";

type GlassSurfaceProps = Omit<LiquidGlassProps, "variant"> & {
  children: ReactNode;
  /** Padding preset for card-like surfaces */
  padding?: "none" | "sm" | "md" | "lg";
};

const PADDING_CLASS = {
  none: "",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
} as const;

/**
 * General glass card/panel — not for long-form text or data tables.
 */
export function GlassSurface({
  children,
  padding = "md",
  intensity = "medium",
  contentClassName = "",
  ...rest
}: GlassSurfaceProps) {
  return (
    <LiquidGlass
      variant="panel"
      intensity={intensity}
      contentClassName={[PADDING_CLASS[padding], contentClassName].filter(Boolean).join(" ")}
      {...rest}
    >
      {children}
    </LiquidGlass>
  );
}
