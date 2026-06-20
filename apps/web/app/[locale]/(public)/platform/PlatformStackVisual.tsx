import { GlassHeroCard } from "@/components/design/liquid-glass";
import { PublicGlassInlineChip } from "@/components/public";

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
    <div className="flex justify-center [perspective:1200px]">
      <GlassHeroCard contentClassName="p-5 sm:p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-aistroyka-accent">{label}</p>
        <p className="mt-2 font-heading text-xl font-semibold text-aistroyka-text-primary">{title}</p>
        <ul className="mt-5 space-y-3" aria-label={title}>
          {layers.map((layer) => (
            <li key={layer.label}>
              <PublicGlassInlineChip label={layer.label} detail={layer.detail} />
            </li>
          ))}
        </ul>
      </GlassHeroCard>
    </div>
  );
}
