"use client";

import { useEffect } from "react";

export type ToastVariant = "neutral" | "success" | "warning" | "error";

const variantClasses: Record<ToastVariant, string> = {
  neutral: "bg-aistroyka-surface border-aistroyka-border-subtle text-aistroyka-text-primary",
  success: "bg-[var(--aistroyka-badge-success-bg)] border-aistroyka-success/30 text-[var(--aistroyka-badge-success-text)]",
  warning: "bg-[var(--aistroyka-badge-warning-bg)] border-aistroyka-warning/30 text-[var(--aistroyka-badge-warning-text)]",
  error: "bg-[var(--aistroyka-badge-error-bg)] border-aistroyka-error/30 text-[var(--aistroyka-badge-error-text)]",
};

export interface ToastProps {
  message: string;
  variant?: ToastVariant;
  duration?: number;
  onClose: () => void;
}

export function Toast({ message, variant = "neutral", duration = 5000, onClose }: ToastProps) {
  useEffect(() => {
    if (duration <= 0) return;
    const t = setTimeout(onClose, duration);
    return () => clearTimeout(t);
  }, [duration, onClose]);

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-[var(--aistroyka-radius-lg)] border px-4 py-3 shadow-[var(--aistroyka-shadow-e3)] ${variantClasses[variant]}`}
    >
      <p className="text-[var(--aistroyka-font-subheadline)] font-medium">{message}</p>
    </div>
  );
}
