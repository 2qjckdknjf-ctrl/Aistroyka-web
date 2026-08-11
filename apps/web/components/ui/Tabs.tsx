"use client";

import type { KeyboardEvent, ReactNode } from "react";
import {
  getDirectTabElements,
  resolveHorizontalTabKeyboardIndex,
} from "./tabs-keyboard";

export function Tabs({
  children,
  "aria-label": ariaLabel,
  className = "",
  "data-testid": dataTestId,
}: {
  children: ReactNode;
  "aria-label"?: string;
  className?: string;
  "data-testid"?: string;
}) {
  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const tablist = event.currentTarget;
    const tabs = getDirectTabElements(tablist);
    const active = document.activeElement;
    if (!(active instanceof HTMLElement) || !tabs.includes(active)) {
      return;
    }

    const currentIndex = tabs.indexOf(active);
    const nextIndex = resolveHorizontalTabKeyboardIndex({
      key: event.key,
      currentIndex,
      tabCount: tabs.length,
    });
    if (nextIndex === null) {
      return;
    }

    event.preventDefault();
    const nextTab = tabs[nextIndex];
    if (!nextTab) {
      return;
    }

    // Automatic activation: focus + existing controlled onSelect via click.
    nextTab.focus();
    nextTab.click();
  }

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      aria-orientation="horizontal"
      data-testid={dataTestId}
      onKeyDown={handleKeyDown}
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
