"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function ProjectMoreActionsMenu({ projectId }: { projectId: string }) {
  const t = useTranslations("canon");
  const tDetail = useTranslations("dashboardDetail");

  return (
    <details className="relative">
      <summary
        className="canon-ghost-btn list-none cursor-pointer [&::-webkit-details-marker]:hidden"
        aria-label={t("moreActions")}
      >
        ⋯
      </summary>
      <div
        className="absolute right-0 z-20 mt-2 min-w-[12rem] rounded-xl border border-[var(--canon-border-glass)] bg-[var(--canon-surface-elevated,rgba(12,18,28,0.96))] p-1 shadow-lg"
        role="menu"
      >
        <Link
          href={`/dashboard/projects/${projectId}/client`}
          className="block rounded-lg px-3 py-2 text-sm text-[var(--canon-text-primary)] hover:bg-[rgba(255,255,255,0.06)]"
          role="menuitem"
        >
          {tDetail("openClientPortalHome")}
        </Link>
        <Link
          href={`/dashboard/projects/${projectId}?tab=documents`}
          className="block rounded-lg px-3 py-2 text-sm text-[var(--canon-text-primary)] hover:bg-[rgba(255,255,255,0.06)]"
          role="menuitem"
        >
          {t("projectTabDocuments")}
        </Link>
        <Link
          href={`/dashboard/projects/${projectId}?tab=handover`}
          className="block rounded-lg px-3 py-2 text-sm text-[var(--canon-text-primary)] hover:bg-[rgba(255,255,255,0.06)]"
          role="menuitem"
        >
          {t("projectTabHandover")}
        </Link>
        <Link
          href={`/dashboard/projects/${projectId}?tab=service-requests`}
          className="block rounded-lg px-3 py-2 text-sm text-[var(--canon-text-primary)] hover:bg-[rgba(255,255,255,0.06)]"
          role="menuitem"
        >
          {t("projectTabServiceRequests")}
        </Link>
        <Link
          href={`/dashboard/projects/${projectId}?tab=stakeholders`}
          className="block rounded-lg px-3 py-2 text-sm text-[var(--canon-text-primary)] hover:bg-[rgba(255,255,255,0.06)]"
          role="menuitem"
        >
          {t("projectTabStakeholders")}
        </Link>
        <Link
          href={`/dashboard/projects/${projectId}/handover/pack`}
          className="block rounded-lg px-3 py-2 text-sm text-[var(--canon-text-primary)] hover:bg-[rgba(255,255,255,0.06)]"
          role="menuitem"
        >
          {tDetail("handoverPackPageTitle")}
        </Link>
      </div>
    </details>
  );
}
