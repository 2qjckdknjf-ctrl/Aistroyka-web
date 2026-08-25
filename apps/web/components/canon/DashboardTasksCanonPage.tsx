"use client";

import { useRef } from "react";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { DashboardTasksClient } from "@/app/[locale]/(dashboard)/dashboard/tasks/DashboardTasksClient";
import { CanonPageHeader, CanonTasksAiPanel } from "@/components/canon";

export function DashboardTasksCanonPage() {
  const t = useTranslations("canon");
  const tNav = useTranslations("nav");
  const openCreateRef = useRef<(() => void) | null>(null);

  return (
    <div className="space-y-6">
      <CanonPageHeader
        title={tNav("tasks")}
        subtitle={t("screen04Label")}
        actions={
          <button
            type="button"
            className="canon-gold-btn"
            onClick={() => openCreateRef.current?.()}
          >
            <Plus size={18} aria-hidden />
            {t("createTask")}
          </button>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_300px]">
        <DashboardTasksClient
          skin="canon"
          onRegisterCreateHandler={(open) => {
            openCreateRef.current = open;
          }}
        />
        <CanonTasksAiPanel />
      </div>
    </div>
  );
}
