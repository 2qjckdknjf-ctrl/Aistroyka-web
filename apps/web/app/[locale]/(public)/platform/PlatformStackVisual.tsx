import { GlassHeroCard } from "@/components/design/liquid-glass";

type PlatformStackLayer = {
  label: string;
  detail: string;
};

type PlatformStackVisualProps = {
  label: string;
  title: string;
  layers: PlatformStackLayer[];
};

/** Platform hero stack diagram — not the homepage site lens. */
export function PlatformStackVisual({ label, title, layers }: PlatformStackVisualProps) {
  return (
    <GlassHeroCard contentClassName="p-5 sm:p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-aistroyka-accent">{label}</p>
      <p className="mt-2 font-heading text-xl font-semibold text-aistroyka-text-primary">{title}</p>
      <ul className="mt-5 space-y-3" aria-label={title}>
        {layers.map((layer) => (
          <li
            key={layer.label}
            className="rounded-[var(--aistroyka-radius-lg)] border border-aistroyka-border-subtle bg-aistroyka-bg-primary/60 px-3 py-2.5"
          >
            <p className="text-[var(--aistroyka-font-subheadline)] font-semibold text-aistroyka-text-primary">
              {layer.label}
            </p>
            <p className="mt-0.5 text-[var(--aistroyka-font-footnote)] text-aistroyka-text-secondary">
              {layer.detail}
            </p>
          </li>
        ))}
      </ul>
    </GlassHeroCard>
  );
}
