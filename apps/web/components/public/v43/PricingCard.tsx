import { Check } from "lucide-react";
import { Link } from "@/i18n/navigation";
import {
  buildPaidPlanCtaText,
  formatPlanPrice,
  getPublicPlan,
  type PublicPlanId,
} from "@/lib/public/pricing-catalog";

export type PricingCardCopy = {
  name: string;
  description: string;
  features: string[];
  cta: string;
  priceLabel?: string;
  recommendedLabel?: string;
};

export function PricingCard({
  planId,
  copy,
  locale,
  chooseLabel,
  perUnit,
}: {
  planId: PublicPlanId;
  copy: PricingCardCopy;
  locale: string;
  chooseLabel: string;
  perUnit: string;
}) {
  const plan = getPublicPlan(planId);
  const formatted = plan.checkoutEnabled ? formatPlanPrice(plan, locale) : null;
  const href = plan.checkoutEnabled
    ? `/subscribe?plan=${plan.id}`
    : planId === "enterprise"
      ? "/pricing/enterprise"
      : "/contact?plan=business";
  const cta = formatted
    ? buildPaidPlanCtaText({
        chooseLabel,
        planName: plan.name,
        formattedPrice: formatted,
        perUnit,
      })
    : copy.cta;

  return (
    <article className={`v43-plan-card v41-glass${plan.recommended ? " is-recommended" : ""}`}>
      {plan.recommended && copy.recommendedLabel ? (
        <p className="v41-eyebrow">{copy.recommendedLabel}</p>
      ) : null}
      <h2>{copy.name}</h2>
      <p>{copy.description}</p>
      {formatted ? (
        <p className="v43-plan-price">
          {formatted}
          <span>/{perUnit}</span>
        </p>
      ) : (
        <p className="v43-plan-price">{copy.priceLabel}</p>
      )}
      <ul>
        {copy.features.map((feature) => (
          <li key={feature}>
            <Check size={16} /> {feature}
          </li>
        ))}
      </ul>
      <Link
        className={`v41-btn ${plan.checkoutEnabled ? "v41-btn-primary" : "v41-btn-secondary"}`}
        href={href}
        data-testid={`cta.public.pricing.${planId}`}
      >
        {cta}
      </Link>
    </article>
  );
}

export function PricingComparison({
  headers,
  rows,
}: {
  headers: string[];
  rows: Array<{ label: string; values: string[] }>;
}) {
  return (
    <div className="v43-compare v41-glass" role="table">
      <div className="v43-compare-row" role="row">
        {headers.map((header) => (
          <span key={header} role="columnheader">
            {header}
          </span>
        ))}
      </div>
      {rows.map((row) => (
        <div key={row.label} className="v43-compare-row" role="row">
          <span role="rowheader">{row.label}</span>
          {row.values.map((value, index) => (
            <span key={`${row.label}-${index}`} role="cell">
              {value}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}
