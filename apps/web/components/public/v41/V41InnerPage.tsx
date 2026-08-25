import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { V41PilotButton } from "./V41PilotButton";

export type V41InnerPageProps = {
  eyebrow?: string;
  title: string;
  lead: string;
  children?: ReactNode;
  visual?: ReactNode;
  ctaLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
};

export function V41InnerPage({
  eyebrow,
  title,
  lead,
  children,
  visual,
  ctaLabel,
  secondaryHref,
  secondaryLabel,
}: V41InnerPageProps) {
  return (
    <div className="v41-inner">
      <header className={visual ? "v41-inner-hero" : undefined}>
        <div>
          {eyebrow ? <p className="v41-eyebrow">{eyebrow}</p> : null}
          <h1>{title}</h1>
          <p className="v41-lead">{lead}</p>
          {ctaLabel ? (
            <div className="v41-hero-actions">
              <V41PilotButton>
                {ctaLabel} <ArrowRight size={18} />
              </V41PilotButton>
              {secondaryHref && secondaryLabel ? (
                <Link className="v41-btn v41-btn-secondary" href={secondaryHref}>
                  {secondaryLabel}
                </Link>
              ) : null}
            </div>
          ) : null}
        </div>
        {visual ? <div className="v41-inner-visual v41-glass">{visual}</div> : null}
      </header>
      {children}
    </div>
  );
}
