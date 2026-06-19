"use client";

import {
  GlassButton,
  GlassHeroCard,
  GlassIntensityControl,
  GlassNav,
  GlassPanel,
  GlassSurface,
  LiquidGlass,
  LiquidGlassFilter,
} from "@/components/design/liquid-glass";
import { LG_MAX_VISIBLE_NODES } from "@/lib/design/liquid-glass";

export function LiquidGlassPreviewClient() {
  return (
    <div className="lg-preview-field px-4 py-10 sm:px-8">
      <LiquidGlassFilter />
      <GlassIntensityControl preview />

      <div className="mx-auto max-w-5xl space-y-10">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-aistroyka-error">Dev preview only</p>
          <h1 className="font-heading text-3xl font-semibold text-aistroyka-text-primary">Liquid Glass LG-1</h1>
          <p className="max-w-2xl text-aistroyka-text-secondary">
            Canonical primitives for AISTROYKA — not linked from production navigation. Budget: max{" "}
            {LG_MAX_VISIBLE_NODES} glass nodes per viewport.
          </p>
        </header>

        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-aistroyka-text-secondary">Nav</h2>
          <GlassNav contentClassName="flex flex-wrap items-center gap-3 px-4 py-3">
            <span className="text-sm font-semibold text-aistroyka-accent">AISTROYKA</span>
            <span className="text-sm text-aistroyka-text-secondary">Platform</span>
            <span className="text-sm text-aistroyka-text-secondary">AI Control</span>
          </GlassNav>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <GlassHeroCard contentClassName="p-6">
            <p className="text-xs uppercase tracking-[0.14em] text-aistroyka-accent">Hero variant</p>
            <p className="mt-2 text-lg font-semibold text-aistroyka-text-primary">AI lens over the site</p>
            <p className="mt-2 text-sm text-aistroyka-text-secondary">Transparent operational control.</p>
          </GlassHeroCard>

          <GlassPanel title="Panel" intensity="subtle">
            <p className="text-sm text-aistroyka-text-secondary">Short operational summary — not for dense tables.</p>
          </GlassPanel>
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          {(["subtle", "medium", "strong"] as const).map((intensity) => (
            <GlassSurface key={intensity} intensity={intensity} padding="sm" motion={["interactive"]}>
              <p className="text-xs uppercase tracking-[0.12em] text-aistroyka-text-secondary">{intensity}</p>
              <p className="mt-1 text-sm font-medium text-aistroyka-text-primary">Surface</p>
            </GlassSurface>
          ))}
        </section>

        <section className="flex flex-wrap gap-4">
          <GlassButton type="button">Glass control</GlassButton>
          <LiquidGlass variant="control" intensity="medium" motion={["interactive"]} contentClassName="px-4 py-2">
            <span className="text-sm text-aistroyka-text-primary">Raw primitive</span>
          </LiquidGlass>
        </section>
      </div>
    </div>
  );
}
