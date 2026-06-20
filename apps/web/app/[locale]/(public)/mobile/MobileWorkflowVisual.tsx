import { GlassHeroCard } from "@/components/design/liquid-glass";
import { PublicGlassInlineChip } from "@/components/public";

type MobileWorkflowStep = {
  label: string;
  detail: string;
};

type MobileWorkflowVisualProps = {
  label: string;
  title: string;
  steps: MobileWorkflowStep[];
};

/** Mobile hero workflow summary — not homepage lens. */
export function MobileWorkflowVisual({ label, title, steps }: MobileWorkflowVisualProps) {
  return (
    <div className="flex justify-center [perspective:1200px]">
      <GlassHeroCard contentClassName="p-5 sm:p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-aistroyka-accent">{label}</p>
        <p className="mt-2 font-heading text-xl font-semibold text-aistroyka-text-primary">{title}</p>
        <ul className="mt-5 space-y-3" aria-label={title}>
          {steps.map((step) => (
            <li key={step.label}>
              <PublicGlassInlineChip label={step.label} detail={step.detail} />
            </li>
          ))}
        </ul>
      </GlassHeroCard>
    </div>
  );
}
