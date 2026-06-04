"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Card, Button } from "@/components/ui";

export function InconsistentStateScreen({ onRetry }: { onRetry: () => void }) {
  const t = useTranslations("planFitOnboarding");

  return (
    <Card className="mx-auto max-w-xl p-6">
      <h2 className="text-aistroyka-headline font-semibold text-aistroyka-text-primary">
        {t("inconsistentTitle")}
      </h2>
      <p className="mt-2 text-aistroyka-subheadline text-aistroyka-text-secondary">
        {t("inconsistentSubtitle")}
      </p>
      <div className="mt-6 flex gap-3">
        <Button variant="primary" onClick={onRetry}>
          {t("retry")}
        </Button>
        <Link
          href="/dashboard"
          className="inline-flex min-h-[var(--aistroyka-touch-min)] items-center justify-center rounded-[var(--aistroyka-radius-lg)] border border-[var(--aistroyka-button-secondary-border)] bg-[var(--aistroyka-button-secondary-bg)] px-4 py-2.5 text-sm font-semibold text-[var(--aistroyka-button-secondary-text)] hover:bg-aistroyka-surface-raised"
        >
          {t("openDashboard")}
        </Link>
      </div>
    </Card>
  );
}
