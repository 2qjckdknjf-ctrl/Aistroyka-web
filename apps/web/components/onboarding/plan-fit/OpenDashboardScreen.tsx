"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Card, Button } from "@/components/ui";

export function OpenDashboardScreen() {
  const t = useTranslations("planFitOnboarding");

  return (
    <Card className="mx-auto max-w-xl p-6">
      <h2 className="text-aistroyka-headline font-semibold text-aistroyka-text-primary">
        {t("openDashboard")}
      </h2>
      <p className="mt-2 text-aistroyka-subheadline text-aistroyka-text-secondary">
        {t("openDashboardReadyBody")}
      </p>
      <Link href="/dashboard" className="mt-6 inline-block">
        <Button variant="primary">{t("openDashboard")}</Button>
      </Link>
    </Card>
  );
}
