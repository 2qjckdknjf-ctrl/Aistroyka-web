"use client";

import { useQuery } from "@tanstack/react-query";
import { Link } from "@/i18n/navigation";
import { fetchPlanSurface } from "@/lib/plan-fit/api-client";
import { getPlanBadgeLabel } from "@/lib/platform/plan-fit/plan-surface";

/** Small plan badge for dashboard topbar. Links to billing. */
export function PlanBadge() {
  const { data } = useQuery({
    queryKey: ["plan-surface"],
    queryFn: fetchPlanSurface,
    staleTime: 60 * 1000,
  });

  const planName = getPlanBadgeLabel(data?.surface);

  return (
    <Link
      href="/billing"
      className="rounded-[var(--aistroyka-radius-md)] border border-aistroyka-border-subtle bg-aistroyka-surface-raised px-2 py-1 text-aistroyka-caption font-medium text-aistroyka-text-secondary transition-colors hover:bg-aistroyka-surface hover:text-aistroyka-text-primary"
      title="View plan and limits"
    >
      {planName}
    </Link>
  );
}
