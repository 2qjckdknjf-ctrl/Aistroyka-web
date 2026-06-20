"use client";

import type { ReactNode } from "react";
import { GlassButton } from "@/components/design/liquid-glass";

type Variant = "primary" | "secondary" | "ghost" | "destructive" | "icon";
type Size = "sm" | "md";

const variantClasses: Record<Exclude<Variant, "primary" | "secondary">, string> = {
  ghost:
    "text-aistroyka-accent hover:bg-aistroyka-surface-raised disabled:text-aistroyka-text-tertiary",
  destructive:
    "bg-aistroyka-error text-aistroyka-text-inverse hover:opacity-90 disabled:opacity-50",
  icon:
    "text-aistroyka-text-primary hover:bg-aistroyka-surface-raised disabled:text-aistroyka-text-tertiary min-w-[var(--aistroyka-touch-min)] min-h-[var(--aistroyka-touch-min)] p-0",
};

const sizeClasses: Record<Size, string> = {
  sm: "min-h-[36px] px-3 py-1.5 text-[var(--aistroyka-font-caption)]",
  md: "min-h-[var(--aistroyka-touch-min)] px-[var(--aistroyka-space-4)] py-2.5 text-[var(--aistroyka-font-headline)] font-semibold",
};

export function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  type = "button",
  className = "",
  onClick,
  "aria-label": ariaLabel,
  ...rest
}: {
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  className?: string;
  onClick?: () => void;
  "aria-label"?: string;
  [key: string]: unknown;
}) {
  const isDisabled = disabled || loading;
  const isIcon = variant === "icon";

  const content = loading ? (
    <span
      className="inline-block h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent opacity-90"
      aria-hidden
    />
  ) : (
    children
  );

  if (variant === "primary" || variant === "secondary") {
    return (
      <GlassButton
        type={type}
        disabled={isDisabled}
        intensity={variant === "primary" ? "strong" : "subtle"}
        className={["inline-block max-w-full", isIcon ? "" : "w-auto", className].filter(Boolean).join(" ")}
        aria-busy={loading}
        aria-label={ariaLabel}
        onClick={onClick}
        {...rest}
      >
        <span
          className={[
            "inline-flex w-full items-center justify-center whitespace-normal break-words text-center",
            isIcon ? "" : sizeClasses[size],
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {content}
        </span>
      </GlassButton>
    );
  }

  return (
    <button
      type={type}
      disabled={isDisabled}
      onClick={onClick}
      className={`inline-flex items-center justify-center rounded-[var(--aistroyka-radius-lg)] transition-[transform,opacity] duration-[var(--aistroyka-duration-button)] motion-reduce:transition-none active:scale-[0.97] active:opacity-[var(--aistroyka-opacity-pressed)] motion-reduce:active:scale-100 motion-reduce:active:opacity-100 disabled:pointer-events-none ${isIcon ? "" : "max-w-full whitespace-normal break-words text-center"} ${variantClasses[variant]} ${isIcon ? "" : sizeClasses[size]} ${className}`.trim()}
      aria-busy={loading}
      aria-label={ariaLabel}
      {...rest}
    >
      {content}
    </button>
  );
}
