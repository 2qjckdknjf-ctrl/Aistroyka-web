/**
 * Billing checkout cancel return (Step 16).
 * User-facing: "Checkout cancelled".
 */

import Link from "next/link";

import { getCancelPageCopy } from "@/lib/platform/billing-readiness/billing-return-cancel-view";
import { DashboardGlassCard } from "@/components/dashboard/DashboardGlassCard";

export default function BillingCancelPage() {
  const copy = getCancelPageCopy();
  return (
    <DashboardGlassCard className="max-w-lg mx-auto mt-aistroyka-12 border-l-4 border-l-aistroyka-border-subtle">
      <h2 className="text-aistroyka-title2 font-semibold text-aistroyka-text-primary">
        {copy.title}
      </h2>
      <p className="mt-2 text-aistroyka-subheadline text-aistroyka-text-secondary">
        {copy.message}
      </p>
      <Link
        href={copy.backHref}
        className="mt-4 inline-block text-aistroyka-subheadline font-medium text-aistroyka-accent hover:underline"
      >
        ← Back to Billing
      </Link>
    </DashboardGlassCard>
  );
}
