import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { V41PilotButton } from "../v41/V41PilotButton";

export type InternalPageHeroProps = {
  eyebrow: string;
  title: string;
  lead: string;
  primaryLabel?: string;
  primaryHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
  visual?: ReactNode;
  kicker?: ReactNode;
  pilotPlan?: string;
};

export function InternalPageHero({
  eyebrow,
  title,
  lead,
  primaryLabel,
  primaryHref,
  secondaryLabel,
  secondaryHref,
  visual,
  kicker,
  pilotPlan,
}: InternalPageHeroProps) {
  return (
    <header className="v43-hero v41-page">
      <div className={visual ? "v43-hero-grid" : undefined}>
        <div>
          <p className="v41-eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p className="v41-lead">{lead}</p>
          {kicker}
          {primaryLabel ? (
            <div className="v41-hero-actions">
              {primaryHref ? (
                primaryHref.startsWith("#") ? (
                  <a className="v41-btn v41-btn-primary" href={primaryHref}>
                    {primaryLabel} <ArrowRight size={18} />
                  </a>
                ) : (
                  <Link className="v41-btn v41-btn-primary" href={primaryHref}>
                    {primaryLabel} <ArrowRight size={18} />
                  </Link>
                )
              ) : (
                <V41PilotButton plan={pilotPlan}>
                  {primaryLabel} <ArrowRight size={18} />
                </V41PilotButton>
              )}
              {secondaryHref && secondaryLabel ? (
                <Link className="v41-btn v41-btn-secondary" href={secondaryHref}>
                  {secondaryLabel}
                </Link>
              ) : null}
            </div>
          ) : null}
        </div>
        {visual}
      </div>
    </header>
  );
}
