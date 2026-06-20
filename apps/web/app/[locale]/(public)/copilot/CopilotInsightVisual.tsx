import { GlassSurface, GlassHeroCard } from "@/components/design/liquid-glass";
import { PublicGlassInlineChip } from "@/components/public";

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
    <div className="flex justify-center [perspective:1200px]">
      <GlassHeroCard contentClassName="p-5 sm:p-6" aria-hidden="true">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-aistroyka-accent">{label}</p>
        <p className="mt-2 font-heading text-xl font-semibold text-aistroyka-text-primary">{title}</p>
        <ul className="mt-5 space-y-3">
          {signals.map((signal) => (
            <li key={signal.label}>
              <PublicGlassInlineChip label={signal.label} detail={signal.detail} />
            </li>
          ))}
        </ul>
        <GlassSurface intensity="subtle" padding="sm" className="mt-5">
          <p className="text-[var(--aistroyka-font-footnote)] italic text-aistroyka-text-secondary">{prompt}</p>
        </GlassSurface>
      </GlassHeroCard>
    </div>
  );
}
