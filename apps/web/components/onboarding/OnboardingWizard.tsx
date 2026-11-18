"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui";
import { Button } from "@/components/ui";
import { DashboardGlassCard } from "@/components/dashboard/DashboardGlassCard";

const STEPS = ["persona", "company"] as const;
const PERSONA_OPTIONS = [
  "developer",
  "contractor",
  "customer",
  "supervisor",
  "other",
  "invited_worker_manager",
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
  const [persona, setPersona] = useState<string>("");
  const [companyName, setCompanyName] = useState("");
  const [companyType, setCompanyType] = useState<"developer" | "contractor" | "supervisor" | "other" | "customer">(
    "contractor"
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const step = STEPS[stepIndex];
  const isLast = stepIndex === STEPS.length - 1;
  const requiresCompanyDetails = useMemo(
    () => persona !== "invited_worker_manager" && persona !== "customer",
    [persona]
  );

  async function finish() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          persona,
          companyName: requiresCompanyDetails ? companyName.trim() : null,
          companyType: requiresCompanyDetails ? companyType : "customer",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? t("defaultError"));
        return;
      }
      onComplete?.();
      router.replace("/dashboard");
      router.refresh();
    } catch {
      setError(t("defaultError"));
    } finally {
      setLoading(false);
    }
  }

  function next() {
    if (step === "persona" && !persona) return;
    if (isLast) {
      void finish();
      return;
    }
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
  }

  function back() {
    setStepIndex((i) => Math.max(0, i - 1));
  }

  return (
    <DashboardGlassCard className="mx-auto max-w-xl p-6">
      <div className="mb-6 flex items-center gap-2 text-aistroyka-caption text-aistroyka-text-tertiary">
        <span>{t("step")}</span>
        <span>{stepIndex + 1} / {STEPS.length}</span>
      </div>
      <h2 className="text-aistroyka-headline font-semibold text-aistroyka-text-primary">
        {t(step)}
      </h2>

      {step === "persona" && (
        <div className="mt-4 space-y-3">
          <p className="text-aistroyka-subheadline text-aistroyka-text-secondary">
            {t("personaDescription")}
          </p>
          <div className="flex flex-wrap gap-2">
            {PERSONA_OPTIONS.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setPersona(type)}
                className={`rounded-[var(--aistroyka-radius-md)] border px-4 py-2 text-sm font-medium transition-colors ${
                  persona === type
                    ? "border-aistroyka-accent bg-aistroyka-accent-light text-aistroyka-accent"
                    : "border-aistroyka-border-subtle text-aistroyka-text-secondary hover:bg-aistroyka-surface-raised"
                }`}
              >
                {t(`persona_${type}`)}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === "company" && (
        <div className="mt-4 space-y-4">
          {requiresCompanyDetails ? (
            <>
              <p className="text-aistroyka-subheadline text-aistroyka-text-secondary">
                {t("companySetupDescription")}
              </p>
              <Input
                id="company-name"
                label={t("companyName")}
                value={companyName}
                onChange={(event) => setCompanyName(event.target.value)}
                placeholder={t("companyNamePlaceholder")}
                required
              />
              <div className="space-y-2">
                <p className="text-sm font-medium text-aistroyka-text-primary">{t("companyType")}</p>
                <div className="flex flex-wrap gap-2">
                  {(["contractor", "developer", "supervisor", "other", "customer"] as const).map((type) => (
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
            </>
          ) : (
            <p className="text-aistroyka-subheadline text-aistroyka-text-secondary">
              {t("invitedFlowDescription")}
            </p>
          )}
        </div>
      )}

      {error ? <p className="mt-4 text-sm text-aistroyka-error">{error}</p> : null}

      <div className="mt-8 flex justify-between">
        <Button variant="secondary" onClick={back} disabled={stepIndex === 0}>
          {t("back")}
        </Button>
        <Button
          variant="primary"
          onClick={next}
          disabled={
            loading ||
            (step === "persona" && !persona) ||
            (step === "company" && requiresCompanyDetails && companyName.trim().length < 2)
          }
        >
          {loading ? t("saving") : isLast ? t("finish") : t("next")}
        </Button>
      </div>
    </DashboardGlassCard>
  );
}
