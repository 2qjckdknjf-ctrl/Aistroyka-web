"use client";

import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@/i18n/navigation";
import { Skeleton } from "@/components/ui";
import { fetchPlanSurface } from "@/lib/plan-fit/api-client";
import {
  getPlanCardTitle,
  getPlanSurfaceErrorMessage,
  getUpgradeCtaTargetRoute,
} from "@/lib/platform/plan-fit/plan-surface";
import type { PlanSurfaceViewModel } from "@/lib/platform/plan-fit/plan-surface.types";
import { DashboardGlassCard } from "@/components/dashboard/DashboardGlassCard";

function LimitsSummary({ limits }: { limits: PlanSurfaceViewModel["limitsSummary"] }) {
  const t = useTranslations("planFitSurface");
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
      <div>
        <dt className="text-aistroyka-caption text-aistroyka-text-tertiary">{t("limitsUsers")}</dt>
        <dd className="text-aistroyka-subheadline font-medium text-aistroyka-text-primary">{limits.maxUsers}</dd>
      </div>
      <div>
        <dt className="text-aistroyka-caption text-aistroyka-text-tertiary">{t("limitsProjects")}</dt>
        <dd className="text-aistroyka-subheadline font-medium text-aistroyka-text-primary">{limits.maxProjects}</dd>
      </div>
      <div>
        <dt className="text-aistroyka-caption text-aistroyka-text-tertiary">{t("limitsStorage")}</dt>
        <dd className="text-aistroyka-subheadline font-medium text-aistroyka-text-primary">{limits.maxStorageGb} GB</dd>
      </div>
      <div>
        <dt className="text-aistroyka-caption text-aistroyka-text-tertiary">{t("limitsMobileWorkers")}</dt>
        <dd className="text-aistroyka-subheadline font-medium text-aistroyka-text-primary">{limits.maxActiveMobileWorkers}</dd>
      </div>
      <div>
        <dt className="text-aistroyka-caption text-aistroyka-text-tertiary">{t("limitsAiRequests")}</dt>
        <dd className="text-aistroyka-subheadline font-medium text-aistroyka-text-primary">{limits.maxMonthlyAiRequests}</dd>
      </div>
    </dl>
  );
}

function CapabilityGroups({ groups }: { groups: PlanSurfaceViewModel["capabilityGroups"] }) {
  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <div key={group.key}>
          <h4 className="text-aistroyka-caption font-semibold uppercase tracking-wide text-aistroyka-text-tertiary">
            {group.label}
          </h4>
          <ul className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
            {group.items.map((item) => (
              <li
                key={item.key}
                className={`text-aistroyka-subheadline ${item.enabled ? "text-aistroyka-text-primary" : "text-aistroyka-text-tertiary line-through"}`}
              >
                {item.label}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function UpgradeCta({ suggestion }: { suggestion: PlanSurfaceViewModel["upgradeSuggestion"] }) {
  const t = useTranslations("planFitSurface");
  if (suggestion.ctaVariant === "none" || !suggestion.ctaCopy) return null;
  const targetRoute = getUpgradeCtaTargetRoute(suggestion.ctaVariant);
  return (
    <div className="mt-4 rounded-[var(--aistroyka-radius-md)] border border-aistroyka-border-subtle bg-aistroyka-surface-raised p-4">
      <p className="text-aistroyka-subheadline font-medium text-aistroyka-text-primary">{suggestion.ctaCopy}</p>
      {suggestion.learnMoreCopy && (
        <p className="mt-1 text-aistroyka-caption text-aistroyka-text-secondary">{suggestion.learnMoreCopy}</p>
      )}
      <Link
        href={targetRoute}
        className="mt-3 inline-block text-aistroyka-caption font-medium text-aistroyka-accent hover:underline"
      >
        {t("reviewPlansLink")}
      </Link>
    </div>
  );
}

export function CurrentPlanSurface() {
  const t = useTranslations("planFitSurface");
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["plan-surface"],
    queryFn: fetchPlanSurface,
    staleTime: 60 * 1000,
  });

  if (isLoading) {
    return (
      <DashboardGlassCard className="mb-aistroyka-8">
        <Skeleton className="h-48 w-full rounded-[var(--aistroyka-radius-md)]" />
      </DashboardGlassCard>
    );
  }

  if (isError || !data?.surface) {
    return (
      <DashboardGlassCard className="mb-aistroyka-8 border-l-4 border-l-aistroyka-error">
        <p className="text-aistroyka-subheadline text-aistroyka-text-secondary">
          {getPlanSurfaceErrorMessage(error instanceof Error ? error : null)}
        </p>
      </DashboardGlassCard>
    );
  }

  const surface = data.surface;

  return (
    <DashboardGlassCard className="mb-aistroyka-8 border-l-4 border-l-aistroyka-accent">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-aistroyka-title2 font-bold tracking-tight text-aistroyka-text-primary">
            {getPlanCardTitle(surface)}
          </h2>
          <p className="mt-1 text-aistroyka-caption text-aistroyka-text-tertiary">{surface.sourceLabel}</p>
          <p className="mt-2 text-aistroyka-subheadline text-aistroyka-text-secondary">{surface.planDescriptionShort}</p>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-aistroyka-subheadline font-semibold text-aistroyka-text-primary">{t("limitsHeading")}</h3>
        <div className="mt-2">
          <LimitsSummary limits={surface.limitsSummary} />
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-aistroyka-subheadline font-semibold text-aistroyka-text-primary">{t("capabilitiesHeading")}</h3>
        <div className="mt-2">
          <CapabilityGroups groups={surface.capabilityGroups} />
        </div>
      </div>

      <UpgradeCta suggestion={surface.upgradeSuggestion} />
    </DashboardGlassCard>
  );
}
