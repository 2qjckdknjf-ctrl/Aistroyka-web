import { Link } from "@/i18n/navigation";
import { CountUpText } from "./CountUpText";
import { PublicRevealGlassCard } from "./PublicRevealGlassCard";

export type PublicProofStat = {
  value: string;
  label: string;
};

export type PublicProofCaseSnippet = {
  title: string;
  href: string;
  description?: string;
};

export type PublicProofSectionVariant = "trust-line" | "stat-row" | "case-snippet";

export type PublicProofSectionProps = {
  variant: PublicProofSectionVariant;
  trustLine?: string;
  stats?: PublicProofStat[];
  cases?: PublicProofCaseSnippet[];
  className?: string;
  headingLevel?: "h2" | "h3" | "p";
};

export function PublicProofSection({
  variant,
  trustLine,
  stats,
  cases,
  className = "",
  headingLevel = "p",
}: PublicProofSectionProps) {
  if (variant === "trust-line" && trustLine) {
    const Tag = headingLevel;
    return (
      <section className={`py-2 ${className}`.trim()} aria-label={trustLine}>
        <PublicRevealGlassCard intensity="subtle">
          <Tag className="text-center text-[var(--aistroyka-font-subheadline)] text-aistroyka-text-secondary">
            {trustLine}
          </Tag>
        </PublicRevealGlassCard>
      </section>
    );
  }

  if (variant === "stat-row" && stats?.length) {
    const visible = stats.slice(0, 3);
    return (
      <section className={`min-w-0 ${className}`.trim()} aria-label="Proof metrics">
        <dl className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-3">
          {visible.map((stat) => (
            <div key={`${stat.value}-${stat.label}`}>
              <PublicRevealGlassCard interactive intensity="subtle">
                <dt className="sr-only">{stat.label}</dt>
                <dd className="text-center font-heading text-[var(--aistroyka-font-title2)] font-bold text-aistroyka-accent">
                  <CountUpText value={stat.value} />
                </dd>
                <dd className="mt-1 text-center text-[var(--aistroyka-font-footnote)] text-aistroyka-text-secondary">
                  {stat.label}
                </dd>
              </PublicRevealGlassCard>
            </div>
          ))}
        </dl>
      </section>
    );
  }

  if (variant === "case-snippet" && cases?.length) {
    const visible = cases.slice(0, 2);
    return (
      <section className={`min-w-0 ${className}`.trim()} aria-label="Case highlights">
        <ul className="grid min-w-0 gap-4 sm:grid-cols-2">
          {visible.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="block rounded-[var(--aistroyka-radius-card)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--aistroyka-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
              >
                <PublicRevealGlassCard interactive>
                  <span className="text-[var(--aistroyka-font-headline)] font-semibold text-aistroyka-text-primary">
                    {item.title}
                  </span>
                  {item.description ? (
                    <span className="mt-2 block text-[var(--aistroyka-font-footnote)] text-aistroyka-text-secondary">
                      {item.description}
                    </span>
                  ) : null}
                </PublicRevealGlassCard>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  return null;
}
