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
      className="surface-glass rounded-aistroyka-card shadow-aistroyka-e1"
      open={defaultOpen}
    >
      <summary className="cursor-pointer list-none rounded-aistroyka-card px-4 py-3 font-medium text-aistroyka-text-primary hover:bg-[color-mix(in_srgb,var(--lg-tint)_24%,transparent)] [&::-webkit-details-marker]:hidden">
        {summary}
      </summary>
      <div className="border-t border-aistroyka-border-subtle px-4 pb-4 pt-3">{children}</div>
    </details>
  );
}
