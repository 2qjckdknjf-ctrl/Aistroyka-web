import { Link } from "@/i18n/navigation";

export type PublicRelatedLinkItem = {
  href: string;
  title: string;
  description: string;
  linkLabel: string;
};

const linkFocusClass =
  "font-medium text-aistroyka-accent underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-[var(--aistroyka-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent";

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
      <ul className={`mt-8 grid min-w-0 gap-4 ${gridClass}`}>
        {links.map(({ href, title: linkTitle, description, linkLabel }) => (
          <li
            key={href}
            className="rounded-[var(--aistroyka-radius-card)] border border-aistroyka-border-subtle bg-aistroyka-surface p-5 shadow-[var(--aistroyka-shadow-e1)]"
          >
            <h3 className="font-semibold text-aistroyka-text-primary">{linkTitle}</h3>
            <p className="mt-2 text-[var(--aistroyka-font-footnote)] text-aistroyka-text-secondary">
              {description}
            </p>
            <Link href={href} className={`mt-4 inline-flex text-sm ${linkFocusClass}`}>
              {linkLabel}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
