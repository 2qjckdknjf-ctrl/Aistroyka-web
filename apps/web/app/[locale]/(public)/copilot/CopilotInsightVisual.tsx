import { GlassHeroCard } from "@/components/design/liquid-glass";

type CopilotInsightSignal = {
  label: string;
  detail: string;
};

type CopilotInsightVisualProps = {
  label: string;
  title: string;
  prompt: string;
  signals: CopilotInsightSignal[];
};

/** Copilot hero insight panel — not a chat mock or homepage lens. */
export function CopilotInsightVisual({ label, title, prompt, signals }: CopilotInsightVisualProps) {
  return (
    <GlassHeroCard contentClassName="p-5 sm:p-6" aria-hidden="true">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-aistroyka-accent">{label}</p>
      <p className="mt-2 font-heading text-xl font-semibold text-aistroyka-text-primary">{title}</p>
      <ul className="mt-5 space-y-3">
        {signals.map((signal) => (
          <li
            key={signal.label}
            className="rounded-[var(--aistroyka-radius-lg)] border border-aistroyka-border-subtle bg-aistroyka-bg-primary/60 px-3 py-2.5"
          >
            <p className="text-[var(--aistroyka-font-subheadline)] font-semibold text-aistroyka-text-primary">
              {signal.label}
            </p>
            <p className="mt-0.5 text-[var(--aistroyka-font-footnote)] text-aistroyka-text-secondary">
              {signal.detail}
            </p>
          </li>
        ))}
      </ul>
      <p className="mt-5 rounded-[var(--aistroyka-radius-lg)] border border-dashed border-aistroyka-border-subtle bg-aistroyka-bg-primary/40 px-3 py-2.5 text-[var(--aistroyka-font-footnote)] italic text-aistroyka-text-secondary">
        {prompt}
      </p>
    </GlassHeroCard>
  );
}
