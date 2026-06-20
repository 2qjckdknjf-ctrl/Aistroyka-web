"use client";

import { GlassLink } from "@/components/design/liquid-glass";

/** Canonical public marketing CTA routes — aligned with `public.cta.*Href` i18n keys. */
export const PUBLIC_CTA_HREFS = {
  launchPilot: "/dashboard",
  contact: "/contact",
  presentation: "/contact",
} as const;

export type PublicCtaLabels = {
  primaryLabel: string;
  secondaryLabel: string;
  presentationLabel?: string;
};

export type PublicHeroCTAProps = PublicCtaLabels & {
  className?: string;
  showPresentation?: boolean;
  showSecondary?: boolean;
  primaryHref?: string;
  secondaryHref?: string;
  presentationHref?: string;
  testIdPrefix?: string;
};

export function PublicHeroCTA({
  primaryLabel,
  secondaryLabel,
  presentationLabel,
  className = "mt-8",
  showPresentation = true,
  showSecondary = true,
  primaryHref = PUBLIC_CTA_HREFS.launchPilot,
  secondaryHref = PUBLIC_CTA_HREFS.contact,
  presentationHref = PUBLIC_CTA_HREFS.presentation,
  testIdPrefix = "cta.public",
}: PublicHeroCTAProps) {
  return (
    <div
      className={`flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center ${className}`.trim()}
    >
      <GlassLink
        href={primaryHref}
        className="min-w-0 flex-1 sm:flex-none"
        linkClassName="text-center"
        data-testid={`${testIdPrefix}.launch-pilot`}
      >
        {primaryLabel}
      </GlassLink>
      {showSecondary ? (
        <GlassLink
          href={secondaryHref}
          intensity="subtle"
          className="min-w-0 flex-1 sm:flex-none"
          linkClassName="text-center text-aistroyka-text-secondary"
          data-testid={`${testIdPrefix}.contact`}
        >
          {secondaryLabel}
        </GlassLink>
      ) : null}
      {showPresentation && presentationLabel ? (
        <GlassLink
          href={presentationHref}
          intensity="subtle"
          pill
          className="sm:ml-1"
          linkClassName="text-center text-sm font-medium text-aistroyka-text-secondary"
          data-testid={`${testIdPrefix}.presentation`}
        >
          {presentationLabel}
        </GlassLink>
      ) : null}
    </div>
  );
}
