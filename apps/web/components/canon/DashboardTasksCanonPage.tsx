"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { DashboardTasksClient } from "@/app/[locale]/(dashboard)/dashboard/tasks/DashboardTasksClient";
import { CanonPageHeader, CanonTasksAiPanel } from "@/components/canon";

export function DashboardTasksCanonPage() {
  const t = useTranslations("canon");
  const tNav = useTranslations("nav");

  return (
    <div className="space-y-6">
      <CanonPageHeader
        title={tNav("tasks")}
        subtitle={t("screen04Label")}
        actions={
          <button type="button" className="canon-gold-btn">
            <Plus size={18} aria-hidden />
            {t("createTask")}
          </button>
        }
      />

      <div className="canon-scroll-x flex flex-wrap gap-2 pb-1">
        {["project", "assignee", "priority", "deadline"].map((key) => (
          <button key={key} type="button" className="canon-ghost-btn !text-xs">
            {t(`taskFilter_${key}`)} ▾
          </button>
        ))}
        <button type="button" className="text-xs font-medium text-[var(--canon-text-muted)]">
          {t("resetFilters")}
        </button>
      </div>

      <div className="canon-scroll-x flex flex-wrap gap-2 border-b border-[var(--canon-border-glass)] pb-2">
        {[
          { key: "all", label: t("taskTabAll") },
          { key: "mine", label: t("taskTabMine") },
          { key: "overdue", label: t("taskTabOverdue", { count: 4 }) },
          { key: "review", label: t("taskTabReview", { count: 6 }) },
        ].map((tab, i) => (
          <button
            key={tab.key}
            type="button"
            className={`px-3 py-1.5 text-sm font-medium ${
              i === 0
                ? "text-[var(--canon-gold)] border-b-2 border-[var(--canon-gold)]"
                : "text-[var(--canon-text-muted)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
        <span className="ml-auto text-xs text-[var(--canon-text-muted)]">{t("viewKanban")} ▾</span>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_300px]">
        <DashboardTasksClient skin="canon" />
        <CanonTasksAiPanel />
      </div>
    </div>
  );
}
