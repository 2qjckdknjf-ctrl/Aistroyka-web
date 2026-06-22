import type { ButtonHTMLAttributes, ReactNode } from "react";
import { LiquidGlass } from "./LiquidGlass";

type GlassButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  intensity?: "subtle" | "medium" | "strong";
};

/**
 * Glass-wrapped CTA/control — keyboard focus remains on the native button.
 */
export function GlassButton({
  children,
  className = "",
  intensity = "medium",
  disabled,
  type = "button",
  ...rest
}: GlassButtonProps) {
  return (
    <LiquidGlass
      variant="control"
      intensity={intensity}
      motion={disabled ? [] : ["interactive"]}
      className={["inline-block", disabled && "opacity-50", className].filter(Boolean).join(" ")}
      contentClassName="p-0"
    >
      <button
        type={type}
        disabled={disabled}
        className="min-h-[var(--aistroyka-touch-min)] w-full rounded-[inherit] px-5 py-2.5 text-sm font-semibold text-aistroyka-text-primary outline-none focus-visible:ring-2 focus-visible:ring-[var(--aistroyka-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:cursor-not-allowed"
        {...rest}
      >
        {children}
      </button>
    </LiquidGlass>
  );
}
