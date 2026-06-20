import { GlassLink } from "@/components/design/liquid-glass";
import { PublicRevealGlassCard } from "./PublicRevealGlassCard";

export type PublicRelatedLinkItem = {
  href: string;
  title: string;
  description: string;
  linkLabel: string;
};

type PublicRelatedLinksSectionProps = {
  headingId: string;
  title: string;
  subtitle: string;
  links: readonly PublicRelatedLinkItem[];
  columns?: 3 | 4 | 5;
};

export function PublicRelatedLinksSection({
  headingId,
  title,
  subtitle,
  links,
  columns = 4,
}: PublicRelatedLinksSectionProps) {
  const gridClass =
    columns === 5
      ? "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
      : columns === 3
        ? "sm:grid-cols-2 lg:grid-cols-3"
        : "sm:grid-cols-2 lg:grid-cols-4";

  return (
    <section aria-labelledby={headingId}>
      <h2
        id={headingId}
        className="text-[var(--aistroyka-font-title2)] font-semibold text-aistroyka-text-primary"
      >
        {title}
      </h2>
      <p className="mt-3 max-w-3xl text-[var(--aistroyka-font-body)] text-aistroyka-text-secondary">
        {subtitle}
      </p>
      <ul className={`mt-8 grid min-w-0 grid-cols-1 gap-4 ${gridClass}`}>
        {links.map(({ href, title: linkTitle, description, linkLabel }) => (
          <li key={href}>
            <PublicRevealGlassCard interactive>
              <h3 className="font-semibold text-aistroyka-text-primary">{linkTitle}</h3>
              <p className="mt-2 text-[var(--aistroyka-font-footnote)] text-aistroyka-text-secondary">
                {description}
              </p>
              <GlassLink href={href} intensity="subtle" pill className="mt-4 inline-block" linkClassName="text-sm">
                {linkLabel}
              </GlassLink>
            </PublicRevealGlassCard>
          </li>
        ))}
      </ul>
    </section>
  );
}
