"use client";

import type { ReactNode } from "react";
import { GlassSurface } from "@/components/design/liquid-glass";
import { PublicRevealGlassCard } from "./PublicRevealGlassCard";

type PublicGlassInlineChipProps = {
  label: string;
  detail?: string;
};

/** Compact glass chip inside hero visuals (replaces solid border pills). */
export function PublicGlassInlineChip({ label, detail }: PublicGlassInlineChipProps) {
  return (
    <GlassSurface intensity="subtle" padding="sm" reveal>
      <p className="text-sm font-medium text-aistroyka-text-primary">{label}</p>
      {detail ? <p className="mt-0.5 text-[11px] text-aistroyka-text-secondary">{detail}</p> : null}
    </GlassSurface>
  );
}

type PublicGlassFormShellProps = {
  children: ReactNode;
  className?: string;
};

/** Glass wrapper for forms on public pages. */
export function PublicGlassFormShell({ children, className = "" }: PublicGlassFormShellProps) {
  return (
    <GlassSurface intensity="medium" padding="md" reveal className={className}>
      {children}
    </GlassSurface>
  );
}

type PublicGlassMatrixItem = {
  title: string;
  description: string;
};

/** Three-column matrix cards (integrations/security readiness blocks). */
export function PublicGlassMatrixGrid({ items }: { items: PublicGlassMatrixItem[] }) {
  return (
    <ul className="mt-8 grid min-w-0 gap-4 sm:grid-cols-3">
      {items.map((item) => (
        <li key={item.title}>
          <PublicRevealGlassCard>
            <h3 className="font-semibold text-aistroyka-text-primary">{item.title}</h3>
            <p className="mt-2 text-[var(--aistroyka-font-footnote)] text-aistroyka-text-secondary">
              {item.description}
            </p>
          </PublicRevealGlassCard>
        </li>
      ))}
    </ul>
  );
}
