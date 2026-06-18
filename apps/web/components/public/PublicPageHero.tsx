import type { ReactNode } from "react";
import { PublicHeroCTA, type PublicCtaLabels } from "./PublicHeroCTA";

export type PublicPageHeroVariant = "compact" | "centered" | "split-visual" | "conversion";

export type PublicPageHeroProps = {
  title: string;
  subtitle: string;
  variant?: PublicPageHeroVariant;
  eyebrow?: string;
  eyebrowGlass?: boolean;
  headingLevel?: "h1" | "h2";
  visual?: ReactNode;
  proofSlot?: ReactNode;
  ctas?: PublicCtaLabels | false;
  showPresentation?: boolean;
  className?: string;
};

function PageHeroEyebrow({ eyebrow, glass }: { eyebrow: string; glass?: boolean }) {
  if (glass) {
    return (
      <div className="public-badge mb-5 inline-flex max-w-full flex-wrap rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] sm:px-4 sm:tracking-[0.16em]">
        {eyebrow}
      </div>
    );
  }

  return (
    <p className="mb-4 text-[var(--aistroyka-font-caption)] font-semibold uppercase tracking-[0.12em] text-aistroyka-accent">
      {eyebrow}
    </p>
  );
}

function PageHeroCopy({
  eyebrow,
  eyebrowGlass,
  title,
  subtitle,
  headingLevel,
  align,
  ctas,
  showPresentation,
  proofSlot,
}: {
  eyebrow?: string;
  eyebrowGlass?: boolean;
  title: string;
  subtitle: string;
  headingLevel: "h1" | "h2";
  align: "left" | "center";
  ctas?: PublicCtaLabels | false;
  showPresentation?: boolean;
  proofSlot?: ReactNode;
}) {
  const HeadingTag = headingLevel;
  const alignClass = align === "center" ? "text-center mx-auto" : "text-left";

  return (
    <div className={`min-w-0 max-w-xl ${align === "center" ? "max-w-3xl" : ""} ${alignClass}`.trim()}>
      {eyebrow ? <PageHeroEyebrow eyebrow={eyebrow} glass={eyebrowGlass} /> : null}
      <HeadingTag
        className={
          align === "center"
            ? "text-balance text-[var(--aistroyka-font-title)] font-bold text-aistroyka-text-primary"
            : "text-balance text-[var(--aistroyka-font-title)] font-bold text-aistroyka-text-primary"
        }
      >
        {title}
      </HeadingTag>
      <p
        className={`mt-4 text-pretty text-[var(--aistroyka-font-body)] text-aistroyka-text-secondary sm:text-lg ${
          align === "center" ? "mx-auto max-w-2xl" : "max-w-xl"
        }`}
      >
        {subtitle}
      </p>
      {proofSlot ? <div className="mt-6">{proofSlot}</div> : null}
      {ctas !== false && ctas ? (
        <PublicHeroCTA {...ctas} showPresentation={showPresentation} testIdPrefix="cta.public.page-hero" />
      ) : null}
    </div>
  );
}

export function PublicPageHero({
  title,
  subtitle,
  variant = "compact",
  eyebrow,
  eyebrowGlass = false,
  headingLevel = "h1",
  visual,
  proofSlot,
  ctas,
  showPresentation = true,
  className = "",
}: PublicPageHeroProps) {
  const shellClass = "relative mx-auto min-w-0 max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8";

  if (variant === "split-visual") {
    return (
      <header className={`${shellClass} ${className}`.trim()}>
        <div className="grid min-w-0 gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,22rem)] lg:items-center lg:gap-12">
          <PageHeroCopy
            eyebrow={eyebrow}
            eyebrowGlass={eyebrowGlass}
            title={title}
            subtitle={subtitle}
            headingLevel={headingLevel}
            align="left"
            ctas={ctas}
            showPresentation={showPresentation}
            proofSlot={proofSlot}
          />
          {visual ? <div className="min-w-0 lg:justify-self-end">{visual}</div> : null}
        </div>
      </header>
    );
  }

  if (variant === "centered") {
    return (
      <header className={`${shellClass} ${className}`.trim()}>
        <PageHeroCopy
          eyebrow={eyebrow}
          eyebrowGlass={eyebrowGlass}
          title={title}
          subtitle={subtitle}
          headingLevel={headingLevel}
          align="center"
          ctas={ctas}
          showPresentation={showPresentation}
          proofSlot={proofSlot}
        />
        {visual ? <div className="mx-auto mt-10 min-w-0 max-w-2xl">{visual}</div> : null}
      </header>
    );
  }

  if (variant === "conversion") {
    return (
      <header className={`${shellClass} ${className}`.trim()}>
        <PageHeroCopy
          eyebrow={eyebrow}
          eyebrowGlass={false}
          title={title}
          subtitle={subtitle}
          headingLevel={headingLevel}
          align="left"
          ctas={false}
          proofSlot={proofSlot}
        />
      </header>
    );
  }

  return (
    <header className={`mx-auto min-w-0 max-w-4xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 ${className}`.trim()}>
      <PageHeroCopy
        eyebrow={eyebrow}
        eyebrowGlass={eyebrowGlass}
        title={title}
        subtitle={subtitle}
        headingLevel={headingLevel}
        align="left"
        ctas={ctas}
        showPresentation={showPresentation}
        proofSlot={proofSlot}
      />
    </header>
  );
}
