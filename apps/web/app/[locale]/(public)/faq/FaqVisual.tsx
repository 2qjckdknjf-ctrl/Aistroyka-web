import { GlassHeroCard } from "@/components/design/liquid-glass";

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
    <GlassHeroCard contentClassName="p-5 sm:p-6" aria-hidden="true">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-aistroyka-accent">{label}</p>
      <p className="mt-2 font-heading text-xl font-semibold text-aistroyka-text-primary">{title}</p>
      <ul className="mt-5 space-y-3">
        {topics.map((topic) => (
          <li
            key={topic.label}
            className="rounded-[var(--aistroyka-radius-lg)] border border-aistroyka-border-subtle bg-aistroyka-bg-primary/60 px-3 py-2.5"
          >
            <p className="text-[var(--aistroyka-font-subheadline)] font-semibold text-aistroyka-text-primary">
              {topic.label}
            </p>
            <p className="mt-0.5 text-[var(--aistroyka-font-footnote)] text-aistroyka-text-secondary">
              {topic.detail}
            </p>
          </li>
        ))}
      </ul>
    </GlassHeroCard>
  );
}
