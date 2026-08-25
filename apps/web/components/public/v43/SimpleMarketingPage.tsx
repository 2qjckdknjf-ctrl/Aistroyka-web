import type { ReactNode } from "react";
import { InternalPageHero } from "./InternalPageHero";

export function SimpleMarketingPage({
  eyebrow,
  title,
  lead,
  primaryLabel,
  primaryHref,
  secondaryLabel,
  secondaryHref,
  children,
}: {
  eyebrow?: string;
  title: string;
  lead: string;
  primaryLabel?: string;
  primaryHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
  children?: ReactNode;
}) {
  return (
    <>
      <InternalPageHero
        eyebrow={eyebrow ?? title}
        title={title}
        lead={lead}
        primaryLabel={primaryLabel}
        primaryHref={primaryHref}
        secondaryLabel={secondaryLabel}
        secondaryHref={secondaryHref}
      />
      {children}
    </>
  );
}
