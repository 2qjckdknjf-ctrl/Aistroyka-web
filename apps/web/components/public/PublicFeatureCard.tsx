import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { PublicRevealGlassCard } from "./PublicRevealGlassCard";

export type PublicFeatureCardVariant = "solid" | "subtle" | "glass-highlight" | "faq";

export type PublicFeatureCardProps = {
  title: string;
  description: string;
  variant?: PublicFeatureCardVariant;
  href?: string;
  eyebrow?: string;
  metadata?: string;
  status?: string;
  icon?: ReactNode;
  className?: string;
};

const linkFocusClass =
  "outline-none focus-visible:ring-2 focus-visible:ring-[var(--aistroyka-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent";

function isInteractiveVariant(variant: PublicFeatureCardVariant): boolean {
  return variant === "glass-highlight" || variant === "solid";
}

function intensityForVariant(variant: PublicFeatureCardVariant): "subtle" | "medium" | "strong" {
  if (variant === "subtle" || variant === "faq") return "subtle";
  return "medium";
}

function CardShell({
  variant,
  className,
  children,
  href,
}: {
  variant: PublicFeatureCardVariant;
  className: string;
  children: ReactNode;
  href?: string;
}) {
  const card = (
    <PublicRevealGlassCard
      className={className}
      interactive={isInteractiveVariant(variant)}
      intensity={intensityForVariant(variant)}
    >
      {children}
    </PublicRevealGlassCard>
  );

  if (href) {
    return (
      <Link href={href} className={`block rounded-[var(--aistroyka-radius-card)] ${linkFocusClass}`}>
        {card}
      </Link>
    );
  }

  return card;
}

function CardContent({
  eyebrow,
  icon,
  title,
  description,
  metadata,
  status,
  titleAs,
}: {
  eyebrow?: string;
  icon?: ReactNode;
  title: string;
  description: string;
  metadata?: string;
  status?: string;
  titleAs: "h2" | "h3" | "dt";
}) {
  const TitleTag = titleAs;
  return (
    <>
      {eyebrow ? (
        <p className="text-[var(--aistroyka-font-caption)] font-semibold uppercase tracking-[0.12em] text-aistroyka-text-secondary">
          {eyebrow}
        </p>
      ) : null}
      {icon ? (
        <div className="mb-3 text-aistroyka-accent" aria-hidden>
          {icon}
        </div>
      ) : null}
      <TitleTag className="text-[var(--aistroyka-font-title3)] font-semibold text-aistroyka-text-primary">
        {title}
      </TitleTag>
      {titleAs === "dt" ? (
        <dd className="mt-2 text-[var(--aistroyka-font-body)] text-aistroyka-text-secondary">{description}</dd>
      ) : (
        <p className="mt-2 text-[var(--aistroyka-font-body)] text-aistroyka-text-secondary">{description}</p>
      )}
      {metadata ? (
        <p className="mt-3 text-[var(--aistroyka-font-footnote)] text-aistroyka-text-secondary">{metadata}</p>
      ) : null}
      {status ? (
        <p className="mt-2 text-[var(--aistroyka-font-footnote)] font-medium text-aistroyka-accent">{status}</p>
      ) : null}
    </>
  );
}

export function PublicFeatureCard({
  title,
  description,
  variant = "glass-highlight",
  href,
  eyebrow,
  metadata,
  status,
  icon,
  className = "",
}: PublicFeatureCardProps) {
  if (variant === "faq") {
    return (
      <CardShell variant="faq" className={className} href={href}>
        <dl className="m-0">
          <CardContent
            eyebrow={eyebrow}
            icon={icon}
            title={title}
            description={description}
            metadata={metadata}
            status={status}
            titleAs="dt"
          />
        </dl>
      </CardShell>
    );
  }

  return (
    <CardShell variant={variant} className={className} href={href}>
      <CardContent
        eyebrow={eyebrow}
        icon={icon}
        title={title}
        description={description}
        metadata={metadata}
        status={status}
        titleAs="h3"
      />
    </CardShell>
  );
}
