"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Card, Button } from "@/components/ui";

const STEPS = [
  "companyType",
  "createProject",
  "inviteTeam",
  "enableAi",
] as const;

export function OnboardingWizard({
  onComplete,
  initialStep = 0,
}: {
  onComplete?: () => void;
  initialStep?: number;
}) {
  const t = useTranslations("onboarding");
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(initialStep);
  const [companyType, setCompanyType] = useState<string>("");
  const step = STEPS[stepIndex];
  const isLast = stepIndex === STEPS.length - 1;

  function next() {
    if (isLast) {
      onComplete?.();
      router.refresh();
      return;
    }
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
  }

  function back() {
    setStepIndex((i) => Math.max(0, i - 1));
  }

  return (
    <Card className="mx-auto max-w-xl p-6">
      <div className="mb-6 flex items-center gap-2 text-aistroyka-caption text-aistroyka-text-tertiary">
        <span>{t("step")}</span>
        <span>{stepIndex + 1} / {STEPS.length}</span>
      </div>
      <h2 className="text-aistroyka-headline font-semibold text-aistroyka-text-primary">
        {t(step)}
      </h2>

      {step === "companyType" && (
        <div className="mt-4 space-y-3">
          <p className="text-aistroyka-subheadline text-aistroyka-text-secondary">
            {t("companyTypeDescription")}
          </p>
          <div className="flex flex-wrap gap-2">
            {["contractor", "developer", "supervisor", "other"].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setCompanyType(type)}
                className={`rounded-[var(--aistroyka-radius-md)] border px-4 py-2 text-sm font-medium transition-colors ${
                  companyType === type
                    ? "border-aistroyka-accent bg-aistroyka-accent-light text-aistroyka-accent"
                    : "border-aistroyka-border-subtle text-aistroyka-text-secondary hover:bg-aistroyka-surface-raised"
                }`}
              >
                {t(`companyType_${type}`)}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === "createProject" && (
        <div className="mt-4">
          <p className="text-aistroyka-subheadline text-aistroyka-text-secondary">
            {t("createProjectDescription")}
          </p>
          <Link href="/projects/new" className="mt-4 inline-block">
            <Button variant="primary">{t("createProject")}</Button>
          </Link>
        </div>
      )}

      {step === "inviteTeam" && (
        <div className="mt-4">
          <p className="text-aistroyka-subheadline text-aistroyka-text-secondary">
            {t("inviteTeamDescription")}
          </p>
          <Link href="/team" className="mt-4 inline-block">
            <Button variant="primary">{t("inviteTeam")}</Button>
          </Link>
        </div>
      )}

      {step === "enableAi" && (
        <div className="mt-4">
          <p className="text-aistroyka-subheadline text-aistroyka-text-secondary">
            {t("enableAiDescription")}
          </p>
          <Link href="/dashboard/projects" className="mt-4 inline-block">
            <Button variant="primary">{t("openProjects")}</Button>
          </Link>
        </div>
      )}

      <div className="mt-8 flex justify-between">
        <Button variant="secondary" onClick={back} disabled={stepIndex === 0}>
          {t("back")}
        </Button>
        {step === "companyType" || step === "createProject" || step === "inviteTeam" ? (
          <Button variant="primary" onClick={next}>
            {t("next")}
          </Button>
        ) : (
          <Button variant="primary" onClick={next}>
            {t("finish")}
          </Button>
        )}
      </div>
    </Card>
  );
}
