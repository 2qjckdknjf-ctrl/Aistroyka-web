"use client";

import { useCallback, useRef, type CSSProperties, type ReactNode } from "react";
import {
  liquidGlassClassNames,
  type LiquidGlassIntensity,
  type LiquidGlassMotion,
  type LiquidGlassVariant,
} from "@/lib/design/liquid-glass";

export type LiquidGlassProps = {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  intensity?: LiquidGlassIntensity;
  variant?: LiquidGlassVariant;
  pill?: boolean;
  /** Shorthand for motion modifiers: enter, float, interactive, glow */
  motion?: LiquidGlassMotion[];
  style?: CSSProperties;
  /** Accessible label when glass wraps a landmark region */
  "aria-label"?: string;
};

/**
 * Base Liquid Glass primitive — 4 layers: refraction, tint, sheen, content.
 * Does not impose layout; children define structure.
 */
export function LiquidGlass({
  children,
  className = "",
  contentClassName = "",
  intensity = "medium",
  variant = "panel",
  pill = false,
  motion = [],
  style,
  "aria-label": ariaLabel,
}: LiquidGlassProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const glowEnabled = motion.includes("glow");

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!glowEnabled || !rootRef.current) return;
      const rect = rootRef.current.getBoundingClientRect();
      rootRef.current.style.setProperty("--lg-gx", `${e.clientX - rect.left}px`);
      rootRef.current.style.setProperty("--lg-gy", `${e.clientY - rect.top}px`);
    },
    [glowEnabled],
  );

  return (
    <div
      ref={rootRef}
      className={liquidGlassClassNames({ intensity, variant, pill, motion, className })}
      style={style}
      onPointerMove={glowEnabled ? onPointerMove : undefined}
      aria-label={ariaLabel}
    >
      <div className="lg__refraction" aria-hidden />
      <div className="lg__tint" aria-hidden />
      <div className="lg__sheen" aria-hidden />
      <div className={["lg__content", contentClassName].filter(Boolean).join(" ")}>{children}</div>
    </div>
  );
}
