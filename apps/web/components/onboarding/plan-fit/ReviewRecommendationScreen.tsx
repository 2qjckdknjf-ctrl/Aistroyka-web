"use client";

import { useTranslations } from "next-intl";
import { Card, Button } from "@/components/ui";
import type { PlanCode } from "@aistroyka/contracts";
import type { OrchestrationRecommendationSummary } from "@/lib/platform/plan-fit/orchestration/orchestration.types";

export function ReviewRecommendationScreen({
  recommendation,
  onSelectRecommended,
  onSelectAlternative,
  selecting,
  disabled,
}: {
  recommendation: OrchestrationRecommendationSummary;
  onSelectRecommended: () => void | Promise<void>;
  onSelectAlternative?: (planCode: PlanCode) => void | Promise<void>;
  selecting?: boolean;
  disabled?: boolean;
}) {
  const t = useTranslations("planFitOnboarding");
  const recommendedLabel = t(`planCode_${recommendation.recommendedPlanCode}`);
  const alternatives = recommendation.alternativePlanCodes.filter(
    (c) => c !== recommendation.recommendedPlanCode
  );

  return (
    <Card className="mx-auto max-w-xl p-6">
      <h2 className="text-aistroyka-headline font-semibold text-aistroyka-text-primary">
        {t("reviewTitle")}
      </h2>
      <p className="mt-2 text-aistroyka-subheadline text-aistroyka-text-secondary">
        {t("reviewSubtitle")}
      </p>

      <div className="mt-6 surface-glass rounded-lg-muted/50 p-4">
        <p className="font-medium text-aistroyka-text-primary">{recommendedLabel}</p>
        {recommendation.reasoningCodes.length > 0 && (
          <p className="mt-2 text-sm text-aistroyka-text-secondary">
            {t("basedOn")}: {recommendation.reasoningCodes.join(", ")}
          </p>
        )}
      </div>

      <div className="mt-6 flex flex-col gap-3">
        <Button
          variant="primary"
          onClick={() => onSelectRecommended()}
          loading={selecting}
          disabled={disabled || selecting}
        >
          {t("selectRecommended")}
        </Button>

        {alternatives.length > 0 && onSelectAlternative && (
          <div className="space-y-2">
            <p className="text-sm text-aistroyka-text-secondary">{t("selectAlternative")}</p>
            <div className="flex flex-wrap gap-2">
              {alternatives.slice(0, 2).map((code) => (
                <Button
                  key={code}
                  variant="secondary"
                  onClick={() => onSelectAlternative(code as PlanCode)}
                  disabled={disabled || selecting}
                >
                  {t(`planCode_${code}`)}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
