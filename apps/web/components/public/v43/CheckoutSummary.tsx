import { Check, Lock } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { formatCheckoutTotal, type SelfServePlan } from "@/lib/public/pricing-catalog";

export function CheckoutSummary({
  plan,
  locale,
  title,
  changeLabel,
  features,
  periodLabel,
  periodValue,
  totalLabel,
  payLabel,
  terms,
  onPay,
  loading,
  disabled,
}: {
  plan: SelfServePlan;
  locale: string;
  title: string;
  changeLabel: string;
  features: string[];
  periodLabel: string;
  periodValue: string;
  totalLabel: string;
  payLabel: string;
  terms: string;
  onPay: () => void;
  loading: boolean;
  disabled: boolean;
}) {
  const total = formatCheckoutTotal(plan, locale);
  return (
    <aside className="v43-summary v41-glass">
      <p className="v41-eyebrow">{title}</p>
      <h2>{plan.name}</h2>
      <Link href="/pricing">{changeLabel}</Link>
      <ul>
        {features.map((feature) => (
          <li key={feature}>
            <Check size={16} /> {feature}
          </li>
        ))}
      </ul>
      <p>
        {periodLabel}: {periodValue}
      </p>
      <p className="v43-total">
        {totalLabel}: {total}
      </p>
      <button className="v41-btn v41-btn-primary" type="button" onClick={onPay} disabled={disabled || loading}>
        <Lock size={16} /> {payLabel} {total}
      </button>
      <p>{terms}</p>
    </aside>
  );
}
