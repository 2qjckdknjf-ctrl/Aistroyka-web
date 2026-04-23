/**
 * Billing checkout success return (Step 16).
 * User-facing: "Checkout initiated / awaiting confirmation".
 * Success redirect ≠ subscription activation. Activation via webhook/event processor.
 */

import Link from "next/link";
import { Card } from "@/components/ui";
import { getReturnPageCopy } from "@/lib/platform/billing-readiness/billing-return-cancel-view";

export default function BillingReturnPage() {
  const copy = getReturnPageCopy();
  return (
    <Card className="max-w-lg mx-auto mt-aistroyka-12 border-l-4 border-l-aistroyka-success">
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
    </Card>
  );
}
