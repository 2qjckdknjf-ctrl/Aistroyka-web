import { Link } from "@/i18n/navigation";

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
  primaryHref = PUBLIC_CTA_HREFS.launchPilot,
  secondaryHref = PUBLIC_CTA_HREFS.contact,
  presentationHref = PUBLIC_CTA_HREFS.presentation,
  testIdPrefix = "cta.public",
}: PublicHeroCTAProps) {
  return (
    <div
      className={`flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center ${className}`.trim()}
    >
      <Link
        href={primaryHref}
        className="btn-primary min-w-0 flex-1 basis-[min(100%,14rem)] text-center sm:flex-none sm:basis-auto"
        data-testid={`${testIdPrefix}.launch-pilot`}
      >
        {primaryLabel}
      </Link>
      <Link
        href={secondaryHref}
        className="btn-secondary min-w-0 flex-1 basis-[min(100%,14rem)] text-center sm:flex-none sm:basis-auto"
        data-testid={`${testIdPrefix}.contact`}
      >
        {secondaryLabel}
      </Link>
      {showPresentation && presentationLabel ? (
        <Link
          href={presentationHref}
          className="rounded-[var(--aistroyka-radius-lg)] px-1 py-1 text-center text-sm font-medium text-aistroyka-text-secondary underline-offset-4 outline-none hover:text-aistroyka-accent hover:underline focus-visible:ring-2 focus-visible:ring-[var(--aistroyka-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent sm:ml-1"
          data-testid={`${testIdPrefix}.presentation`}
        >
          {presentationLabel}
        </Link>
      ) : null}
    </div>
  );
}
