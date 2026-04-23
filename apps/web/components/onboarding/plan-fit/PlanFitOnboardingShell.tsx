"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Skeleton } from "@/components/ui";
import type { PlanFitOrchestrationResponse } from "@/lib/platform/plan-fit/plan-fit-api.schema";
import type { PlanCode } from "@aistroyka/contracts";
import { submitRecommendation, selectPlan } from "@/lib/plan-fit/api-client";
import { PlanFitInputForm } from "./PlanFitInputForm";
import { ReviewRecommendationScreen } from "./ReviewRecommendationScreen";
import { ContinueWorkspaceSetupScreen } from "./ContinueWorkspaceSetupScreen";
import { OpenDashboardScreen } from "./OpenDashboardScreen";
import { InconsistentStateScreen } from "./InconsistentStateScreen";

const ORCHESTRATION_QUERY_KEY = ["plan-fit-orchestration"] as const;

export function PlanFitOnboardingShell({
  orchestration,
  refetch,
}: {
  orchestration: PlanFitOrchestrationResponse;
  refetch: () => void;
}) {
  const t = useTranslations("planFitOnboarding");
  const queryClient = useQueryClient();
  const [selecting, setSelecting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function doRefetch() {
    await queryClient.invalidateQueries({ queryKey: ORCHESTRATION_QUERY_KEY });
    refetch();
  }

  async function handleSubmitRecommendation(input: Parameters<typeof submitRecommendation>[0]) {
    setSubmitError(null);
    await submitRecommendation(input);
    await doRefetch();
  }

  async function handleSelectPlan(planCode: PlanCode) {
    setSelecting(true);
    setSubmitError(null);
    try {
      await selectPlan({
        canonicalPlanCode: planCode,
        sourceKind: "recommendation_selected",
      });
      await doRefetch();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : t("selectFailed"));
    } finally {
      setSelecting(false);
    }
  }

  const { nextStep, latestRecommendation, selectedPlanState } = orchestration;

  if (nextStep === "collect_plan_fit_input") {
    return (
      <section className="mx-auto max-w-2xl px-4 py-8" aria-label="Plan-fit onboarding">
        <div className="mb-8 text-center">
          <h1 className="text-aistroyka-title font-bold text-aistroyka-text-primary">
            {t("welcomeTitle")}
          </h1>
          <p className="mt-2 text-aistroyka-subheadline text-aistroyka-text-secondary">
            {t("subtitle")}
          </p>
        </div>
        {submitError && (
          <p className="mx-auto max-w-xl mb-4 text-sm text-aistroyka-error" role="alert">
            {submitError}
          </p>
        )}
        <PlanFitInputForm onSubmit={handleSubmitRecommendation} />
      </section>
    );
  }

  if (
    (nextStep === "review_recommendation" || nextStep === "select_plan") &&
    latestRecommendation
  ) {
    return (
      <section className="mx-auto max-w-2xl px-4 py-8" aria-label="Plan-fit onboarding">
        <div className="mb-8 text-center">
          <h1 className="text-aistroyka-title font-bold text-aistroyka-text-primary">
            {t("reviewTitle")}
          </h1>
          <p className="mt-2 text-aistroyka-subheadline text-aistroyka-text-secondary">
            {t("reviewSubtitle")}
          </p>
        </div>
        {submitError && (
          <p className="mx-auto max-w-xl mb-4 text-sm text-aistroyka-error" role="alert">
            {submitError}
          </p>
        )}
        <ReviewRecommendationScreen
          recommendation={latestRecommendation}
          onSelectRecommended={() => handleSelectPlan(latestRecommendation.recommendedPlanCode as PlanCode)}
          onSelectAlternative={(code) => handleSelectPlan(code)}
          selecting={selecting}
        />
      </section>
    );
  }

  if (nextStep === "continue_workspace_setup" && selectedPlanState) {
    return (
      <section className="mx-auto max-w-2xl px-4 py-8" aria-label="Plan-fit onboarding">
        <div className="mb-8 text-center">
          <h1 className="text-aistroyka-title font-bold text-aistroyka-text-primary">
            {t("continueSetupTitle")}
          </h1>
        </div>
        <ContinueWorkspaceSetupScreen
          selectedPlanCode={selectedPlanState.canonicalPlanCode as PlanCode}
          setup={orchestration.setup}
        />
      </section>
    );
  }

  if (nextStep === "open_dashboard") {
    return (
      <section className="mx-auto max-w-2xl px-4 py-8" aria-label="Plan-fit onboarding">
        <div className="mb-8 text-center">
          <h1 className="text-aistroyka-title font-bold text-aistroyka-text-primary">
            {t("openDashboard")}
          </h1>
        </div>
        <OpenDashboardScreen />
      </section>
    );
  }

  if (nextStep === "resolve_inconsistent_state") {
    return (
      <section className="mx-auto max-w-2xl px-4 py-8" aria-label="Plan-fit onboarding">
        <InconsistentStateScreen onRetry={doRefetch} />
      </section>
    );
  }

  return (
    <div className="mx-auto max-w-xl p-6">
      <Skeleton className="h-64 w-full rounded-[var(--aistroyka-radius-card)]" />
    </div>
  );
}

export { ORCHESTRATION_QUERY_KEY };
