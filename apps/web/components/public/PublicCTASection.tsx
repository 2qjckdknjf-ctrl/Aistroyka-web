"use client";

import { useTranslations } from "next-intl";
import { GlassPanel } from "@/components/design/liquid-glass";
import { PublicHeroCTA, type PublicCtaLabels } from "./PublicHeroCTA";

export type PublicCTASectionVariant = "band" | "floating" | "inline";

export type PublicCTASectionProps = Partial<PublicCtaLabels> & {
  variant?: PublicCTASectionVariant;
  title?: string;
  subtitle?: string;
  showPresentation?: boolean;
  showSecondary?: boolean;
  primaryHref?: string;
  secondaryHref?: string;
  presentationHref?: string;
  className?: string;
  testIdPrefix?: string;
};

export function PublicCTASection({
  variant = "floating",
  title,
  subtitle,
  primaryLabel,
  secondaryLabel,
  presentationLabel,
  showPresentation = true,
  showSecondary = true,
  primaryHref,
  secondaryHref,
  presentationHref,
  className = "",
  testIdPrefix = "cta.public.section",
}: PublicCTASectionProps) {
  const t = useTranslations("public.cta");

  const labels: PublicCtaLabels = {
    primaryLabel: primaryLabel ?? t("launchPilot"),
    secondaryLabel: secondaryLabel ?? t("contactUs"),
    presentationLabel: presentationLabel ?? t("getPresentation"),
  };

  const ctaBlock = (
    <PublicHeroCTA
      {...labels}
      showPresentation={showPresentation}
      showSecondary={showSecondary}
      primaryHref={primaryHref}
      secondaryHref={showSecondary ? secondaryHref : undefined}
      presentationHref={presentationHref}
      className={variant === "inline" ? "mt-6" : "mt-8"}
      testIdPrefix={testIdPrefix}
    />
  );

  const copyBlock =
    title || subtitle ? (
      <div className="mx-auto min-w-0 max-w-3xl text-center">
        {title ? (
          <h2
            id={`${testIdPrefix}-heading`}
            className="font-heading text-[var(--aistroyka-font-title2)] font-semibold text-aistroyka-text-primary"
          >
            {title}
          </h2>
        ) : null}
        {subtitle ? (
          <p className="mt-3 text-[var(--aistroyka-font-body)] text-aistroyka-text-secondary">{subtitle}</p>
        ) : null}
      </div>
    ) : null;

  if (variant === "inline") {
    return (
      <div className={`min-w-0 ${className}`.trim()}>
        {copyBlock}
        {ctaBlock}
      </div>
    );
  }

  if (variant === "floating") {
    return (
      <section
        className={`px-3 py-12 sm:px-6 lg:px-8 ${className}`.trim()}
        aria-labelledby={title ? `${testIdPrefix}-heading` : undefined}
        aria-label={title ? undefined : labels.primaryLabel}
      >
        <div className="mx-auto min-w-0 max-w-3xl">
          <GlassPanel intensity="strong" reveal contentClassName="px-6 py-12 text-center sm:px-10 sm:py-14">
            {copyBlock}
            {ctaBlock}
          </GlassPanel>
        </div>
      </section>
    );
  }

  return (
    <section
      className={`px-3 py-12 sm:px-6 lg:px-8 ${className}`.trim()}
      aria-labelledby={title ? `${testIdPrefix}-heading` : undefined}
      aria-label={title ? undefined : labels.primaryLabel}
    >
      <div className="mx-auto min-w-0 max-w-3xl">
        <GlassPanel intensity="strong" reveal contentClassName="px-6 py-12 text-center sm:px-10 sm:py-14">
          {copyBlock}
          {ctaBlock}
        </GlassPanel>
      </div>
    </section>
  );
}
