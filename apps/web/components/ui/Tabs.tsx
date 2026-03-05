"use client";

import type { ReactNode } from "react";

export function Tabs({
  children,
  "aria-label": ariaLabel,
  className = "",
}: {
  children: ReactNode;
  "aria-label"?: string;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={`flex gap-0 border-b border-aistroyka-border-subtle ${className}`.trim()}
    >
      {children}
    </div>
  );
}

export function Tab({
  id,
  selected,
  onSelect,
  children,
  "aria-controls": ariaControls,
}: {
  id: string;
  selected: boolean;
  onSelect: () => void;
  children: ReactNode;
  "aria-controls"?: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      id={id}
      aria-selected={selected}
      aria-controls={ariaControls}
      tabIndex={selected ? 0 : -1}
      onClick={onSelect}
      className={`min-h-aistroyka-touch px-[var(--aistroyka-space-4)] py-[var(--aistroyka-space-3)] text-[var(--aistroyka-font-subheadline)] font-medium transition-colors border-b-2 -mb-px focus:outline-none focus:ring-2 focus:ring-aistroyka-accent focus:ring-offset-2 rounded-t ${
        selected
          ? "border-aistroyka-accent text-aistroyka-accent"
          : "border-transparent text-aistroyka-text-secondary hover:text-aistroyka-text-primary hover:border-aistroyka-border-subtle"
      }`}
    >
      {children}
    </button>
  );
}

export function TabPanel({
  id,
  selected,
  children,
  "aria-labelledby": ariaLabelledby,
  className = "",
}: {
  id: string;
  selected: boolean;
  children: ReactNode;
  "aria-labelledby"?: string;
  className?: string;
}) {
  if (!selected) return null;
  return (
    <div
      role="tabpanel"
      id={id}
      aria-labelledby={ariaLabelledby}
      className={`pt-[var(--aistroyka-space-4)] ${className}`.trim()}
    >
      {children}
    </div>
  );
}
