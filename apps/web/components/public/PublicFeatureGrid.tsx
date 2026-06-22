import type { ReactNode } from "react";
import { PublicFeatureCard, type PublicFeatureCardProps } from "./PublicFeatureCard";

export type PublicFeatureGridColumns = 2 | 3 | 4;

const COLUMN_CLASS: Record<PublicFeatureGridColumns, string> = {
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-2 lg:grid-cols-3",
  4: "sm:grid-cols-2 lg:grid-cols-4",
};

export type PublicFeatureGridProps = {
  title?: string;
  subtitle?: string;
  columns?: PublicFeatureGridColumns;
  items?: PublicFeatureCardProps[];
  children?: ReactNode;
  className?: string;
  headingLevel?: "h2" | "h3";
};

export function PublicFeatureGrid({
  title,
  subtitle,
  columns = 2,
  items,
  children,
  className = "",
  headingLevel = "h2",
}: PublicFeatureGridProps) {
  const HeadingTag = headingLevel;
  const headingId = title ? `feature-grid-${HeadingTag}-${title.replace(/\s+/g, "-").slice(0, 48)}` : undefined;

  return (
    <section
      className={`min-w-0 ${className}`.trim()}
      {...(headingId ? { "aria-labelledby": headingId } : {})}
    >
      {title ? (
        <HeadingTag
          id={headingId}
          className="text-[var(--aistroyka-font-title2)] font-semibold text-aistroyka-text-primary"
        >
          {title}
        </HeadingTag>
      ) : null}
      {subtitle ? (
        <p className="mt-3 max-w-3xl text-[var(--aistroyka-font-body)] text-aistroyka-text-secondary">{subtitle}</p>
      ) : null}
      <div className={`mt-8 grid min-w-0 gap-6 ${COLUMN_CLASS[columns]}`}>
        {items
          ? items.map((item) => (
              <PublicFeatureCard key={`${item.title}-${item.href ?? "static"}`} {...item} />
            ))
          : children}
      </div>
    </section>
  );
}
