import { GlassHeroCard } from "@/components/design/liquid-glass";
import { PublicGlassInlineChip } from "@/components/public";

type AboutTrustPillar = {
  label: string;
  detail: string;
};

type AboutTrustVisualProps = {
  label: string;
  title: string;
  pillars: AboutTrustPillar[];
};

/** About hero trust pillars — not homepage lens. */
export function AboutTrustVisual({ label, title, pillars }: AboutTrustVisualProps) {
  return (
    <div className="flex justify-center [perspective:1200px]">
      <GlassHeroCard contentClassName="p-5 sm:p-6" aria-hidden="true">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-aistroyka-accent">{label}</p>
        <p className="mt-2 font-heading text-xl font-semibold text-aistroyka-text-primary">{title}</p>
        <ul className="mt-5 space-y-3">
          {pillars.map((pillar) => (
            <li key={pillar.label}>
              <PublicGlassInlineChip label={pillar.label} detail={pillar.detail} />
            </li>
          ))}
        </ul>
      </GlassHeroCard>
    </div>
  );
}
