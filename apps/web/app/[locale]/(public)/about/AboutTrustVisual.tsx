import { GlassHeroCard } from "@/components/design/liquid-glass";

type AboutTrustPillar = {
  label: string;
  detail: string;
};

type AboutTrustVisualProps = {
  label: string;
  title: string;
  pillars: AboutTrustPillar[];
};

/** About hero trust visual — not homepage lens, mobile workflow, or copilot insights. */
export function AboutTrustVisual({ label, title, pillars }: AboutTrustVisualProps) {
  return (
    <GlassHeroCard contentClassName="p-5 sm:p-6" aria-hidden="true">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-aistroyka-accent">{label}</p>
      <p className="mt-2 font-heading text-xl font-semibold text-aistroyka-text-primary">{title}</p>
      <ul className="mt-5 space-y-3">
        {pillars.map((pillar) => (
          <li
            key={pillar.label}
            className="rounded-[var(--aistroyka-radius-lg)] border border-aistroyka-border-subtle bg-aistroyka-bg-primary/60 px-3 py-2.5"
          >
            <p className="text-[var(--aistroyka-font-subheadline)] font-semibold text-aistroyka-text-primary">
              {pillar.label}
            </p>
            <p className="mt-0.5 text-[var(--aistroyka-font-footnote)] text-aistroyka-text-secondary">
              {pillar.detail}
            </p>
          </li>
        ))}
      </ul>
    </GlassHeroCard>
  );
}
