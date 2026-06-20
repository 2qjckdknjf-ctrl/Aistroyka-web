"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
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
  /** Scroll-triggered materialize (demo `data-reveal` parity). */
  reveal?: boolean;
  /** 3D pointer tilt for signature hero cards (demo balance-card parity). */
  tilt?: boolean;
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
  reveal = false,
  tilt = false,
  style,
  "aria-label": ariaLabel,
}: LiquidGlassProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [revealState, setRevealState] = useState<"idle" | "pending" | "visible">(
    reveal ? "pending" : "idle",
  );
  const glowEnabled = motion.includes("glow");
  const enterOnMount = !reveal && motion.includes("enter");

  useEffect(() => {
    if (!reveal || revealState !== "pending") return;
    const node = rootRef.current;
    if (!node) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion || !("IntersectionObserver" in window)) {
      setRevealState("visible");
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setRevealState("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [reveal, revealState]);

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const node = rootRef.current;
      if (!node) return;

      const rect = node.getBoundingClientRect();

      if (glowEnabled) {
        node.style.setProperty("--lg-gx", `${((e.clientX - rect.left) / rect.width) * 100}%`);
        node.style.setProperty("--lg-gy", `${((e.clientY - rect.top) / rect.height) * 100}%`);
      }

      if (tilt) {
        const px = (e.clientX - rect.left) / rect.width - 0.5;
        const py = (e.clientY - rect.top) / rect.height - 0.5;
        node.style.transform = `rotateY(${px * 10}deg) rotateX(${py * -10}deg)`;
      }
    },
    [glowEnabled, tilt],
  );

  const onPointerLeave = useCallback(() => {
    if (!tilt || !rootRef.current) return;
    rootRef.current.style.transform = "rotateY(0deg) rotateX(0deg)";
  }, [tilt]);

  const motionForClass = enterOnMount ? motion : motion.filter((m) => m !== "enter");
  const revealClasses = [
    reveal && revealState === "pending" ? "lg--pending" : "",
    (reveal && revealState === "visible") || enterOnMount ? "lg--enter" : "",
    tilt ? "lg--tilt" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      ref={rootRef}
      className={liquidGlassClassNames({
        intensity,
        variant,
        pill,
        motion: motionForClass,
        className: [className, revealClasses].filter(Boolean).join(" "),
      })}
      style={style}
      onPointerMove={glowEnabled || tilt ? onPointerMove : undefined}
      onPointerLeave={tilt ? onPointerLeave : undefined}
      aria-label={ariaLabel}
    >
      <div className="lg__refraction" aria-hidden />
      <div className="lg__tint" aria-hidden />
      <div className="lg__sheen" aria-hidden />
      <div className={["lg__content", contentClassName].filter(Boolean).join(" ")}>{children}</div>
    </div>
  );
}
