"use client";

import type { ReactNode } from "react";

type ChipVariant = "neutral" | "success" | "warning" | "danger" | "info";

const variantClasses: Record<ChipVariant, string> = {
  neutral: "bg-[var(--aistroyka-badge-neutral-bg)] text-[var(--aistroyka-badge-neutral-text)]",
  success: "bg-[var(--aistroyka-badge-success-bg)] text-[var(--aistroyka-badge-success-text)]",
  warning: "bg-[var(--aistroyka-badge-warning-bg)] text-[var(--aistroyka-badge-warning-text)]",
  danger: "bg-[var(--aistroyka-badge-error-bg)] text-[var(--aistroyka-badge-error-text)]",
  info: "bg-[rgba(0,122,255,0.2)] text-[var(--aistroyka-info)]",
};

export function Chip({
  children,
  variant = "neutral",
  onRemove,
  className = "",
  "aria-label": ariaLabel,
}: {
  children: ReactNode;
  variant?: ChipVariant;
  onRemove?: () => void;
  className?: string;
  "aria-label"?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-[var(--aistroyka-space-3)] py-[var(--aistroyka-space-2)] text-[var(--aistroyka-font-caption)] font-medium ${variantClasses[variant]} ${className}`.trim()}
      role={onRemove ? "listitem" : undefined}
      aria-label={ariaLabel}
    >
      {children}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="ml-0.5 rounded p-0.5 hover:bg-black/10 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-aistroyka-accent"
          aria-label="Remove"
        >
          <span aria-hidden>×</span>
        </button>
      )}
    </span>
  );
}
