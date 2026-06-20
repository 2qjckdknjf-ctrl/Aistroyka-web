import { GlassHeroCard } from "@/components/design/liquid-glass";
import { PublicGlassInlineChip } from "@/components/public";

type FaqTopic = {
  label: string;
  detail: string;
};

type FaqVisualProps = {
  label: string;
  title: string;
  topics: FaqTopic[];
};

/** FAQ hero topic summary — not homepage lens, platform map, or copilot visual. */
export function FaqVisual({ label, title, topics }: FaqVisualProps) {
  return (
    <div className="flex justify-center [perspective:1200px]">
      <GlassHeroCard contentClassName="p-5 sm:p-6" aria-hidden="true">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-aistroyka-accent">{label}</p>
        <p className="mt-2 font-heading text-xl font-semibold text-aistroyka-text-primary">{title}</p>
        <ul className="mt-5 space-y-3">
          {topics.map((topic) => (
            <li key={topic.label}>
              <PublicGlassInlineChip label={topic.label} detail={topic.detail} />
            </li>
          ))}
        </ul>
      </GlassHeroCard>
    </div>
  );
}
