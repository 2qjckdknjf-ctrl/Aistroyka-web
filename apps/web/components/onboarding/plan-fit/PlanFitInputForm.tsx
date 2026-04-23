"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card, Button } from "@/components/ui";
import { PlanFitRecommendRequestSchema } from "@/lib/platform/plan-fit/plan-fit-api.schema";
import type { PlanFitRecommendRequest } from "@/lib/platform/plan-fit/plan-fit-api.schema";
import type { PersonaType, ExpectedUsersRange, ExpectedProjectsRange, Priority, StartMode } from "@/lib/platform/plan-fit/recommend.types";

const PERSONA_OPTIONS: PersonaType[] = ["client", "contractor", "developer_owner", "supervisor", "other"];
const USERS_OPTIONS: ExpectedUsersRange[] = ["1", "2_5", "6_20", "21_100", "100_plus"];
const PROJECTS_OPTIONS: ExpectedProjectsRange[] = ["1", "2_5", "6_20", "20_plus"];
const PRIORITY_OPTIONS: Priority[] = [
  "execution_control",
  "reports_photo",
  "schedule_control",
  "approvals_documents",
  "quality_defects",
  "owner_visibility",
  "ai_insights",
];
const START_MODE_OPTIONS: StartMode[] = ["self_serve", "guided_setup", "demo"];

export function PlanFitInputForm({
  onSubmit,
  disabled,
}: {
  onSubmit: (input: PlanFitRecommendRequest) => void | Promise<void>;
  disabled?: boolean;
}) {
  const t = useTranslations("planFitOnboarding");
  const [personaType, setPersonaType] = useState<PersonaType>("contractor");
  const [expectedUsersRange, setExpectedUsersRange] = useState<ExpectedUsersRange>("1");
  const [expectedProjectsRange, setExpectedProjectsRange] = useState<ExpectedProjectsRange>("1");
  const [priorities, setPriorities] = useState<Priority[]>(["reports_photo"]);
  const [needsMobileWorkforce, setNeedsMobileWorkforce] = useState(false);
  const [needsFormalProcesses, setNeedsFormalProcesses] = useState(false);
  const [startMode, setStartMode] = useState<StartMode>("self_serve");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function togglePriority(p: Priority) {
    setPriorities((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setValidationError(null);
    const input = {
      personaType,
      expectedUsersRange,
      expectedProjectsRange,
      priorities,
      needsMobileWorkforce,
      needsFormalProcesses,
      startMode,
    };
    const parsed = PlanFitRecommendRequestSchema.safeParse(input);
    if (!parsed.success) {
      setValidationError(parsed.error.errors[0]?.message ?? t("validationInvalidInput"));
      return;
    }
    setIsSubmitting(true);
    try {
      await onSubmit(parsed.data);
    } catch {
      setIsSubmitting(false);
      setValidationError(t("submitErrorGeneric"));
    }
  }

  return (
    <Card className="mx-auto max-w-xl p-6">
      <h2 className="text-aistroyka-headline font-semibold text-aistroyka-text-primary">
        {t("title")}
      </h2>
      <p className="mt-2 text-aistroyka-subheadline text-aistroyka-text-secondary">
        {t("subtitle")}
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        <div>
          <label className="mb-2 block text-sm font-medium text-aistroyka-text-primary">
            {t("personaType")}
          </label>
          <div className="flex flex-wrap gap-2">
            {PERSONA_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setPersonaType(opt)}
                className={`rounded-[var(--aistroyka-radius-md)] border px-4 py-2 text-sm font-medium transition-colors ${
                  personaType === opt
                    ? "border-aistroyka-accent bg-aistroyka-accent-light text-aistroyka-accent"
                    : "border-aistroyka-border-subtle text-aistroyka-text-secondary hover:bg-aistroyka-surface-raised"
                }`}
              >
                {t(`personaType_${opt}`)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-aistroyka-text-primary">
            {t("expectedUsersRange")}
          </label>
          <select
            value={expectedUsersRange}
            onChange={(e) => setExpectedUsersRange(e.target.value as ExpectedUsersRange)}
            className="min-h-[var(--aistroyka-touch-min)] w-full rounded-[var(--aistroyka-input-radius)] border border-[var(--aistroyka-input-border)] bg-[var(--aistroyka-input-bg)] px-4 py-2.5 text-aistroyka-text-primary"
          >
            {USERS_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {t(`expectedUsersRange_${opt}`)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-aistroyka-text-primary">
            {t("expectedProjectsRange")}
          </label>
          <select
            value={expectedProjectsRange}
            onChange={(e) => setExpectedProjectsRange(e.target.value as ExpectedProjectsRange)}
            className="min-h-[var(--aistroyka-touch-min)] w-full rounded-[var(--aistroyka-input-radius)] border border-[var(--aistroyka-input-border)] bg-[var(--aistroyka-input-bg)] px-4 py-2.5 text-aistroyka-text-primary"
          >
            {PROJECTS_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {t(`expectedProjectsRange_${opt}`)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-aistroyka-text-primary">
            {t("priorities")}
          </label>
          <div className="flex flex-wrap gap-2">
            {PRIORITY_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => togglePriority(opt)}
                className={`rounded-[var(--aistroyka-radius-md)] border px-3 py-1.5 text-sm transition-colors ${
                  priorities.includes(opt)
                    ? "border-aistroyka-accent bg-aistroyka-accent-light text-aistroyka-accent"
                    : "border-aistroyka-border-subtle text-aistroyka-text-secondary hover:bg-aistroyka-surface-raised"
                }`}
              >
                {t(`priority_${opt}`)}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-6">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={needsMobileWorkforce}
              onChange={(e) => setNeedsMobileWorkforce(e.target.checked)}
              className="h-4 w-4 rounded border-aistroyka-border-subtle"
            />
            <span className="text-sm text-aistroyka-text-primary">{t("needsMobileWorkforce")}</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={needsFormalProcesses}
              onChange={(e) => setNeedsFormalProcesses(e.target.checked)}
              className="h-4 w-4 rounded border-aistroyka-border-subtle"
            />
            <span className="text-sm text-aistroyka-text-primary">{t("needsFormalProcesses")}</span>
          </label>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-aistroyka-text-primary">
            {t("startMode")}
          </label>
          <div className="flex flex-wrap gap-2">
            {START_MODE_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setStartMode(opt)}
                className={`rounded-[var(--aistroyka-radius-md)] border px-4 py-2 text-sm font-medium transition-colors ${
                  startMode === opt
                    ? "border-aistroyka-accent bg-aistroyka-accent-light text-aistroyka-accent"
                    : "border-aistroyka-border-subtle text-aistroyka-text-secondary hover:bg-aistroyka-surface-raised"
                }`}
              >
                {t(`startMode_${opt}`)}
              </button>
            ))}
          </div>
        </div>

        {validationError && (
          <p className="text-sm text-aistroyka-error" role="alert">
            {validationError}
          </p>
        )}

        <Button
          type="submit"
          variant="primary"
          loading={isSubmitting}
          disabled={disabled || isSubmitting || priorities.length === 0}
        >
          {isSubmitting ? t("submitting") : t("submit")}
        </Button>
      </form>
    </Card>
  );
}
