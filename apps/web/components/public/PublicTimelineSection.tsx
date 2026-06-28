import { PublicCTASection, type PublicCTASectionProps } from "./PublicCTASection";
import { PublicRevealGlassCard } from "./PublicRevealGlassCard";

export type PublicTimelineStep = {
  title: string;
  description: string;
  status?: string;
};

export type PublicTimelineSectionProps = {
  title?: string;
  subtitle?: string;
  steps: PublicTimelineStep[];
  cta?: PublicCTASectionProps | false;
  className?: string;
  headingLevel?: "h2" | "h3";
};

export function PublicTimelineSection({
  title,
  subtitle,
  steps,
  cta = false,
  className = "",
  headingLevel = "h2",
}: PublicTimelineSectionProps) {
  const HeadingTag = headingLevel;

  return (
    <section className={`min-w-0 ${className}`.trim()} aria-label={title}>
      {title ? (
        <HeadingTag className="text-[var(--aistroyka-font-title2)] font-semibold text-aistroyka-text-primary">
          {title}
        </HeadingTag>
      ) : null}
      {subtitle ? (
        <p className="mt-3 max-w-3xl text-[var(--aistroyka-font-body)] text-aistroyka-text-secondary">{subtitle}</p>
      ) : null}

      <ol className="mt-8 space-y-4">
        {steps.map((step, index) => (
          <li key={`${step.title}-${index}`}>
            <PublicRevealGlassCard>
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="text-[var(--aistroyka-font-caption)] font-semibold uppercase tracking-[0.12em] text-aistroyka-accent">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="text-[var(--aistroyka-font-title3)] font-semibold text-aistroyka-text-primary">
                  {step.title}
                </h3>
                {step.status ? (
                  <span className="text-[var(--aistroyka-font-footnote)] font-medium text-aistroyka-text-secondary">
                    {step.status}
                  </span>
                ) : null}
              </div>
              <p className="mt-3 text-[var(--aistroyka-font-body)] text-aistroyka-text-secondary">{step.description}</p>
            </PublicRevealGlassCard>
          </li>
        ))}
      </ol>

      {cta !== false ? (
        <div className="mt-10">
          <PublicCTASection variant="inline" {...cta} />
        </div>
      ) : null}
    </section>
  );
}
