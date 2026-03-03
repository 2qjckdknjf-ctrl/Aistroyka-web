"use client";

import type { ReactNode } from "react";

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
    >
      <div
        className="absolute inset-0"
        style={{ backgroundColor: "rgba(0,0,0,var(--aistroyka-overlay-dim))" }}
        aria-hidden
        onClick={onClose}
      />
      <div className="relative w-full max-w-md rounded-[var(--aistroyka-radius-xxl)] border border-aistroyka-border-subtle bg-aistroyka-surface p-[var(--aistroyka-space-6)] shadow-[var(--aistroyka-shadow-e4)]">
        {title ? (
          <h2 id="modal-title" className="mb-[var(--aistroyka-space-4)] text-[var(--aistroyka-font-title3)] font-semibold text-aistroyka-text-primary">
            {title}
          </h2>
        ) : null}
        {children}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded p-1 text-aistroyka-text-secondary hover:bg-aistroyka-surface-raised focus:outline-none focus:ring-2 focus:ring-aistroyka-accent focus:ring-offset-2"
          aria-label="Close"
        >
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
}
