"use client";

import type { ReactNode } from "react";

export function Collapsible({
  summary,
  children,
  defaultOpen = false,
}: {
  summary: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details
      className="rounded-aistroyka-card border border-aistroyka-border-subtle bg-aistroyka-surface shadow-aistroyka-e1"
      open={defaultOpen}
    >
      <summary className="cursor-pointer list-none rounded-aistroyka-card px-4 py-3 font-medium text-aistroyka-text-primary hover:bg-aistroyka-surface-raised [&::-webkit-details-marker]:hidden">
        {summary}
      </summary>
      <div className="border-t border-aistroyka-border-subtle px-4 pb-4 pt-3">{children}</div>
    </details>
  );
}
