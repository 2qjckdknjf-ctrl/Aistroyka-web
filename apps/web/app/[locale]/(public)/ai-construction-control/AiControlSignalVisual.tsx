import { GlassHeroCard } from "@/components/design/liquid-glass";
import { PublicGlassInlineChip } from "@/components/public";

type AiControlSignal = {
  label: string;
  detail: string;
};

type AiControlSignalVisualProps = {
  label: string;
  title: string;
  caption?: string;
  signals: AiControlSignal[];
};

/** AI control hero signal panel — not homepage lens. */
export function AiControlSignalVisual({ label, title, caption, signals }: AiControlSignalVisualProps) {
  return (
    <div className="flex justify-center [perspective:1200px]">
      <GlassHeroCard contentClassName="p-5 sm:p-6" aria-hidden="true">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-aistroyka-accent">{label}</p>
        <p className="mt-2 font-heading text-xl font-semibold text-aistroyka-text-primary">{title}</p>
        {caption ? <p className="mt-2 text-sm text-aistroyka-text-secondary">{caption}</p> : null}
        <ul className="mt-5 space-y-3">
          {signals.map((signal) => (
            <li key={signal.label}>
              <PublicGlassInlineChip label={signal.label} detail={signal.detail} />
            </li>
          ))}
        </ul>
      </GlassHeroCard>
    </div>
  );
}
