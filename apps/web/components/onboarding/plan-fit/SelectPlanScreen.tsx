"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui";
import type { PlanCode } from "@aistroyka/contracts";
import type { OrchestrationRecommendationSummary } from "@/lib/platform/plan-fit/orchestration/orchestration.types";
import { DashboardGlassCard } from "@/components/dashboard/DashboardGlassCard";

export function SelectPlanScreen({
  recommendation,
  onSelect,
  selecting,
  disabled,
}: {
  recommendation: OrchestrationRecommendationSummary;
  onSelect: (planCode: PlanCode) => void | Promise<void>;
  selecting?: boolean;
  disabled?: boolean;
}) {
  const t = useTranslations("planFitOnboarding");
  const allPlans = [
    recommendation.recommendedPlanCode,
    ...recommendation.alternativePlanCodes.filter((c) => c !== recommendation.recommendedPlanCode),
  ];

  return (
    <DashboardGlassCard className="mx-auto max-w-xl p-6">
      <h2 className="text-aistroyka-headline font-semibold text-aistroyka-text-primary">
        {t("reviewTitle")}
      </h2>
      <p className="mt-2 text-aistroyka-subheadline text-aistroyka-text-secondary">
        {t("reviewSubtitle")}
      </p>

      <div className="mt-6 flex flex-col gap-2">
        {allPlans.map((code) => (
          <Button
            key={code}
            variant={code === recommendation.recommendedPlanCode ? "primary" : "secondary"}
            onClick={() => onSelect(code as PlanCode)}
            disabled={disabled || selecting}
            loading={selecting}
          >
            {t(`planCode_${code}`)}
          </Button>
        ))}
      </div>
    </DashboardGlassCard>
  );
}
