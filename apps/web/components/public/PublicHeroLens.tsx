import { GlassHeroCard } from "@/components/design/liquid-glass";

type LensStat = {
  label: string;
  value: string;
  tone?: "default" | "warning";
};

type PublicHeroLensProps = {
  label: string;
  title: string;
  stats: [LensStat, LensStat, LensStat];
  streamLines: [string, string, string];
};

/**
 * Signature “AI lens over the site” panel — single accent glass element per hero.
 */
export function PublicHeroLens({ label, title, stats, streamLines }: PublicHeroLensProps) {
  return (
    <GlassHeroCard float contentClassName="p-5 sm:p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-aistroyka-accent">{label}</p>
      <p className="mt-2 font-heading text-xl font-semibold text-aistroyka-text-primary">{title}</p>
      <dl className="mt-4 grid gap-2 text-sm">
        {stats.map(({ label: statLabel, value, tone = "default" }, index) => (
          <div
            key={statLabel}
            className={`flex items-center justify-between gap-3 ${index < stats.length - 1 ? "border-b border-aistroyka-border-subtle pb-2" : ""}`}
          >
            <dt className="text-aistroyka-text-secondary">{statLabel}</dt>
            <dd
              className={`font-medium ${tone === "warning" ? "text-aistroyka-warning" : "text-aistroyka-text-primary"}`}
            >
              {value}
            </dd>
          </div>
        ))}
      </dl>
      <div className="public-hero-lens-stream mt-5 space-y-1.5 border-t border-aistroyka-border-subtle pt-4" aria-hidden>
        {streamLines.map((line) => (
          <p key={line} className="truncate font-mono text-[11px] text-aistroyka-text-tertiary">
            {line}
          </p>
        ))}
      </div>
    </GlassHeroCard>
  );
}
