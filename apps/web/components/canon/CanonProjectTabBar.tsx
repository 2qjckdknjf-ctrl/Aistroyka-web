"use client";

import type { ProjectCommandTab } from "@/app/[locale]/(dashboard)/dashboard/projects/[id]/project-detail-tabs";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

type CanonProjectTabItem = {
  id: string;
  labelKey: string;
  commandTab?: ProjectCommandTab;
  href?: string;
};

export function getCanonProjectTabItems(projectId: string): CanonProjectTabItem[] {
  return [
    { id: "overview", labelKey: "projectTabOverview", commandTab: "overview" },
    {
      id: "tasks",
      labelKey: "projectTabTasks",
      href: `/dashboard/tasks?project_id=${encodeURIComponent(projectId)}&view=board`,
    },
    { id: "reports", labelKey: "projectTabReports", commandTab: "reports" },
    { id: "schedule", labelKey: "projectTabSchedule", commandTab: "schedule" },
    { id: "documents", labelKey: "projectTabDocuments", commandTab: "documents" },
    { id: "decisions", labelKey: "projectTabDecisions", commandTab: "decisions" },
    { id: "defects", labelKey: "projectTabDefects", commandTab: "defects" },
    {
      id: "change-orders",
      labelKey: "projectTabChangeOrders",
      commandTab: "change-orders",
    },
    { id: "costs", labelKey: "projectTabBudget", commandTab: "costs" },
    { id: "estimate", labelKey: "projectTabEstimate", commandTab: "estimate" },
    { id: "workers", labelKey: "projectTabTeam", commandTab: "workers" },
    { id: "contractors", labelKey: "projectTabContractors", commandTab: "contractors" },
    { id: "uploads", labelKey: "projectTabSite", commandTab: "uploads" },
    { id: "handover", labelKey: "projectTabHandover", commandTab: "handover" },
    { id: "review-pack", labelKey: "projectTabReviewPack", commandTab: "review-pack" },
    { id: "intelligence", labelKey: "projectTabIntelligence", commandTab: "intelligence" },
    { id: "ai", labelKey: "projectTabRisks", commandTab: "ai" },
  ];
}

type CanonProjectTabBarProps = {
  projectId: string;
  activeTab: ProjectCommandTab;
  onSelectTab: (tab: ProjectCommandTab) => void;
};

export function CanonProjectTabBar({ projectId, activeTab, onSelectTab }: CanonProjectTabBarProps) {
  const t = useTranslations("canon");
  const items = getCanonProjectTabItems(projectId);

  return (
    <nav
      className="canon-scroll-x flex gap-1 border-b border-[var(--canon-border-glass)]"
      aria-label={t("projectTabNav")}
    >
      {items.map((item) => {
        const isActive = item.commandTab != null && activeTab === item.commandTab;
        const className = `px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
          isActive
            ? "border-[var(--canon-gold)] text-[var(--canon-gold)]"
            : "border-transparent text-[var(--canon-text-muted)] hover:text-[var(--canon-text-primary)]"
        }`;

        if (item.href) {
          return (
            <Link key={item.id} href={item.href} className={className}>
              {t(item.labelKey)}
            </Link>
          );
        }

        if (!item.commandTab) return null;

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelectTab(item.commandTab!)}
            className={className}
            aria-current={isActive ? "page" : undefined}
          >
            {t(item.labelKey)}
          </button>
        );
      })}
    </nav>
  );
}
