import type { ReactNode } from "react";
import { GlassSurface } from "./GlassSurface";

type GlassPanelProps = {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  title?: string;
  intensity?: "subtle" | "medium" | "strong";
  reveal?: boolean;
};

/** Structured panel with optional heading — content should stay short. */
export function GlassPanel({
  children,
  className,
  contentClassName,
  title,
  intensity = "medium",
  reveal = false,
}: GlassPanelProps) {
  return (
    <GlassSurface
      intensity={intensity}
      className={className}
      contentClassName={contentClassName}
      reveal={reveal}
      aria-label={title}
    >
      {title ? (
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-aistroyka-text-secondary">
          {title}
        </h3>
      ) : null}
      {children}
    </GlassSurface>
  );
}
