"use client";

import type { ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "destructive" | "icon";
type Size = "sm" | "md";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-[var(--aistroyka-button-primary-bg)] text-[var(--aistroyka-button-primary-text)] hover:bg-[var(--aistroyka-button-primary-hover-bg)] active:bg-[var(--aistroyka-button-primary-pressed-bg)] disabled:bg-[var(--aistroyka-button-primary-disabled-bg)]",
  secondary:
    "border border-[var(--aistroyka-button-secondary-border)] bg-[var(--aistroyka-button-secondary-bg)] text-[var(--aistroyka-button-secondary-text)] hover:bg-aistroyka-surface-raised disabled:text-[var(--aistroyka-button-secondary-text-disabled)] disabled:opacity-50",
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
  return (
    <button
      type={type}
      disabled={isDisabled}
      onClick={onClick}
      className={`inline-flex items-center justify-center rounded-[var(--aistroyka-radius-lg)] transition-[transform,opacity] duration-[var(--aistroyka-duration-button)] motion-reduce:transition-none active:scale-[0.97] active:opacity-[var(--aistroyka-opacity-pressed)] motion-reduce:active:scale-100 motion-reduce:active:opacity-100 disabled:pointer-events-none ${variantClasses[variant]} ${isIcon ? "" : sizeClasses[size]} ${className}`.trim()}
      aria-busy={loading}
      aria-label={ariaLabel}
      {...rest}
    >
      {loading ? (
        <span
          className="inline-block h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent opacity-90"
          aria-hidden
        />
      ) : (
        children
      )}
    </button>
  );
}
