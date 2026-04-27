"use client";

/**
 * Billing readiness overview surface (Step 12).
 * Internal-safe. Shows selected plan, billing status, honest messaging.
 * No fake "Pay now" or misleading "Start trial".
 */

import { useQuery } from "@tanstack/react-query";
import { Card, Skeleton } from "@/components/ui";

interface BillingOverview {
  selectedPlan: {
    canonicalPlanCode: string;
    sourceKind: string;
    selectedAt?: string;
  };
  billingSubscription: {
    status: string;
    billingProvider: string;
    canonicalPlanCode?: string;
    currentPeriodEnd?: string | null;
  } | null;
  trialState: { status: string; endsAt?: string; trialPlanCode?: string } | null;
  readinessFlags: {
    checkoutEnabled: boolean;
    sandboxMode?: boolean;
    billingConnected: boolean;
    hasActiveSubscription: boolean;
  };
  allowedActions: string[];
  planSurfaceSummary?: {
    currentPlanCode: string;
    humanReadablePlanName: string;
  };
}

async function fetchBillingOverview(): Promise<BillingOverview> {
  const res = await fetch("/api/v1/billing/overview");
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Failed to load billing overview");
  }
  return res.json();
}

function getBillingStatusLabel(overview: BillingOverview): string {
  if (overview.readinessFlags.hasActiveSubscription && overview.billingSubscription) {
    return `Active (${overview.billingSubscription.billingProvider})`;
  }
  if (overview.readinessFlags.billingConnected) {
    return "Manual / legacy";
  }
  return "Not yet connected";
}

export function BillingOverviewSurface() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["billing-overview"],
    queryFn: fetchBillingOverview,
    staleTime: 60 * 1000,
  });

  if (isLoading) {
    return (
      <Card className="mb-aistroyka-8">
        <Skeleton className="h-24 w-full rounded-[var(--aistroyka-radius-md)]" />
      </Card>
    );
  }

  if (isError || !data) {
    return (
      <Card className="mb-aistroyka-8 border-l-4 border-l-aistroyka-error">
        <p className="text-aistroyka-subheadline text-aistroyka-text-secondary">
          {error instanceof Error ? error.message : "Failed to load billing status"}
        </p>
      </Card>
    );
  }

  const statusLabel = getBillingStatusLabel(data);
  const checkoutAvailable = data.readinessFlags.checkoutEnabled;
  const sandboxMode = data.readinessFlags.sandboxMode ?? false;

  return (
    <Card className="mb-aistroyka-8 border-l-4 border-l-aistroyka-border-subtle">
      <h3 className="text-aistroyka-subheadline font-semibold text-aistroyka-text-primary">
        Billing status
      </h3>
      <dl className="mt-2 space-y-1">
        <div>
          <dt className="text-aistroyka-caption text-aistroyka-text-tertiary">Current plan</dt>
          <dd className="text-aistroyka-subheadline font-medium text-aistroyka-text-primary">
            {data.planSurfaceSummary?.humanReadablePlanName ?? data.selectedPlan.canonicalPlanCode}
          </dd>
        </div>
        <div>
          <dt className="text-aistroyka-caption text-aistroyka-text-tertiary">Billing status</dt>
          <dd className="text-aistroyka-subheadline font-medium text-aistroyka-text-primary">
            {statusLabel}
          </dd>
        </div>
        <div>
          <dt className="text-aistroyka-caption text-aistroyka-text-tertiary">Checkout</dt>
          <dd className="text-aistroyka-subheadline font-medium text-aistroyka-text-primary">
            {checkoutAvailable ? "Available" : sandboxMode ? "Sandbox simulation" : "Not yet enabled"}
          </dd>
        </div>
      </dl>
      <p className="mt-3 text-aistroyka-caption text-aistroyka-text-tertiary">
        {sandboxMode
          ? "Sandbox mode: simulate checkout flow. No live payment."
          : "Billing architecture is ready for future integration. No payment capture in production."}
      </p>
    </Card>
  );
}
