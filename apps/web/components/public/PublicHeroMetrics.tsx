"use client";

import { GlassSurface } from "@/components/design/liquid-glass";
import { CountUpText } from "./CountUpText";

type MetricChip = {
  value: string;
  label: string;
};

type PublicHeroMetricsProps = {
  chips: MetricChip[];
};

/** Compact status chips with count-up animation (demo metrics parity). */
export function PublicHeroMetrics({ chips }: PublicHeroMetricsProps) {
  return (
    <ul className="mt-8 grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-4" aria-label="Operational metrics">
      {chips.map(({ value, label }) => (
        <li key={label}>
          <GlassSurface intensity="subtle" padding="sm" motion={["interactive"]}>
            <p className="font-heading text-lg font-semibold text-aistroyka-accent">
              <CountUpText value={value} />
            </p>
            <p className="mt-0.5 text-[11px] font-medium uppercase tracking-[0.08em] text-aistroyka-text-secondary">
              {label}
            </p>
          </GlassSurface>
        </li>
      ))}
    </ul>
  );
}
