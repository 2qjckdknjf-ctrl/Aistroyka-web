/**
 * Liquid Glass design system — types, constants, and class helpers.
 * Canonical path for LG-1+; do not duplicate in components.
 */

export type LiquidGlassIntensity = "subtle" | "medium" | "strong";
export type LiquidGlassVariant = "nav" | "panel" | "hero" | "control";

export type LiquidGlassMotion = "enter" | "float" | "interactive" | "glow";

export const LG_INTENSITY_MIN = 25;
export const LG_INTENSITY_MAX = 90;
export const LG_INTENSITY_DEFAULT = 55;
export const LG_MAX_VISIBLE_NODES = 6;

export const LG_FILTER_IDS = {
  refraction: "lg-refraction",
  refractionSoft: "lg-refraction-soft",
} as const;

export const LG_STORAGE_KEY = "aistroyka-lg-intensity";

/** CSS custom properties that must be defined on `:root` in `app/design-tokens.css`. */
export const LG_REQUIRED_ROOT_VARS = [
  "--lg-intensity",
  "--lg-opacity",
  "--lg-blur",
  "--lg-blur-refraction",
  "--lg-radius",
  "--lg-radius-control",
  "--lg-radius-pill",
  "--lg-tint",
  "--lg-tint-strong",
  "--lg-tint-accent",
  "--lg-border",
  "--lg-sheen-highlight",
  "--lg-sheen-bottom",
  "--lg-sheen-opacity",
  "--lg-shadow",
  "--lg-shadow-hover",
  "--lg-z-content",
  "--lg-motion-duration",
  "--lg-motion-sweep",
  "--lg-motion-ease",
  "--lg-motion-ease-gentle",
  "--lg-motion-ease-bouncy",
] as const;

const INTENSITY_CLASS: Record<LiquidGlassIntensity, string> = {
  subtle: "lg--intensity-subtle",
  medium: "lg--intensity-medium",
  strong: "lg--intensity-strong",
};

const VARIANT_CLASS: Record<LiquidGlassVariant, string> = {
  nav: "lg--variant-nav",
  panel: "lg--variant-panel",
  hero: "lg--variant-hero",
  control: "lg--variant-control",
};

const MOTION_CLASS: Record<LiquidGlassMotion, string> = {
  enter: "lg--enter",
  float: "lg--float",
  interactive: "lg--interactive",
  glow: "lg--glow",
};

export type LiquidGlassClassOptions = {
  intensity?: LiquidGlassIntensity;
  variant?: LiquidGlassVariant;
  pill?: boolean;
  motion?: LiquidGlassMotion[];
  className?: string;
};

/** Build canonical `.lg` modifier class list for the primitive. */
export function liquidGlassClassNames({
  intensity = "medium",
  variant = "panel",
  pill = false,
  motion = [],
  className = "",
}: LiquidGlassClassOptions): string {
  return [
    "lg",
    INTENSITY_CLASS[intensity],
    VARIANT_CLASS[variant],
    pill && "lg--pill",
    ...motion.map((m) => MOTION_CLASS[m]),
    className,
  ]
    .filter(Boolean)
    .join(" ");
}

/** Clamp user intensity to supported range. */
export function clampLiquidGlassIntensity(value: number): number {
  return Math.min(LG_INTENSITY_MAX, Math.max(LG_INTENSITY_MIN, Math.round(value)));
}

/** Dev-only warning when more than LG_MAX_VISIBLE_NODES glass roots are mounted. */
export function warnIfGlassBudgetExceeded(count: number, context = "viewport"): void {
  if (process.env.NODE_ENV === "production") return;
  if (count > LG_MAX_VISIBLE_NODES) {
    console.warn(
      `[LiquidGlass] ${count} visible glass nodes in ${context} exceeds budget of ${LG_MAX_VISIBLE_NODES}.`,
    );
  }
}
