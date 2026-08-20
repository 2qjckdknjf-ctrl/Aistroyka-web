"use client";

import { useQuery } from "@tanstack/react-query";
import { Link } from "@/i18n/navigation";

import { Skeleton } from "@/components/ui";
import { fetchPlanSurface } from "@/lib/plan-fit/api-client";
import { getAvailableWithHigherPlansItems } from "@/lib/platform/plan-fit/upgrade-prompt-presentation";
import { DashboardGlassCard } from "@/components/dashboard/DashboardGlassCard";

/**
 * "Available with higher plans" section for billing page.
 * Step 11: lists disabled capabilities with soft upgrade prompts.
 */
export function AvailableWithHigherPlans() {
  const { data, isLoading } = useQuery({
    queryKey: ["plan-surface"],
    queryFn: fetchPlanSurface,
    staleTime: 60 * 1000,
  });

  if (isLoading) {
    return (
      <DashboardGlassCard className="mb-aistroyka-8">
        <Skeleton className="h-24 w-full rounded-[var(--aistroyka-radius-md)]" />
      </DashboardGlassCard>
    );
  }

  const items = getAvailableWithHigherPlansItems(data?.surface);
  if (items.length === 0) return null;

  return (
    <DashboardGlassCard className="mb-aistroyka-8">
      <h3 className="text-aistroyka-subheadline font-semibold text-aistroyka-text-primary">
        Available with higher plans
      </h3>
      <p className="mt-1 text-aistroyka-caption text-aistroyka-text-secondary">
        These capabilities are available when you move to a higher plan.
      </p>
      <ul className="mt-4 space-y-3">
        {items.map((item) => (
          <li
            key={item.capabilityKey}
            className="flex flex-wrap items-start justify-between gap-2 rounded-[var(--aistroyka-radius-md)] border border-aistroyka-border-subtle bg-aistroyka-surface-raised px-4 py-3"
          >
            <div>
              <p className="text-aistroyka-subheadline font-medium text-aistroyka-text-primary">{item.title}</p>
              <p className="mt-0.5 text-aistroyka-caption text-aistroyka-text-secondary">{item.description}</p>
            </div>
            <Link
              href={item.ctaTargetRoute}
              className="shrink-0 text-aistroyka-caption font-medium text-aistroyka-accent hover:underline"
            >
              {item.ctaLabel}
            </Link>
          </li>
        ))}
      </ul>
    </DashboardGlassCard>
  );
}
