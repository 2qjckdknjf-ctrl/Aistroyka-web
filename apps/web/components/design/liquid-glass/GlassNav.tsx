"use client";

import { useEffect, useState, type ReactNode } from "react";
import { LiquidGlass } from "./LiquidGlass";

type GlassNavProps = {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  /** When true, nav material becomes denser (scroll-adaptive preset for LG-2). */
  scrolled?: boolean;
};

/**
 * Navigation capsule primitive — not wired to PublicHeader in LG-1.
 */
export function GlassNav({
  children,
  className = "",
  contentClassName = "",
  scrolled = false,
}: GlassNavProps) {
  return (
    <LiquidGlass
      variant="nav"
      intensity={scrolled ? "strong" : "medium"}
      pill
      className={className}
      contentClassName={contentClassName}
      aria-label="Navigation"
    >
      {children}
    </LiquidGlass>
  );
}

/** Hook for future header integration (LG-2/LG-3). */
export function useGlassNavScrolled(threshold = 24): boolean {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);

  return scrolled;
}
