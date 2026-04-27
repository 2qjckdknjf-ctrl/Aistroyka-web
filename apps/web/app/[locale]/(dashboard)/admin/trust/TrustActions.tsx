"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Card } from "@/components/ui";

export function TrustActions() {
  const tDetail = useTranslations("dashboardDetail");
  return (
    <Card>
      <h2 className="text-aistroyka-headline font-semibold text-aistroyka-text-primary">{tDetail("actions")}</h2>
      <ul className="mt-aistroyka-3 flex flex-wrap gap-aistroyka-3">
        <li>
          <Link
            href="/admin/governance"
            className="text-aistroyka-subheadline font-medium text-aistroyka-accent hover:underline"
          >
            {tDetail("openGovernance")}
          </Link>
        </li>
        <li>
          <Link
            href="/portfolio"
            className="text-aistroyka-subheadline font-medium text-aistroyka-accent hover:underline"
          >
            {tDetail("openOrgPortfolioDashboard")}
          </Link>
        </li>
      </ul>
      <p className="mt-aistroyka-2 text-aistroyka-caption text-aistroyka-text-tertiary">
        {tDetail("trustFreshnessHint")}
      </p>
    </Card>
  )
}
