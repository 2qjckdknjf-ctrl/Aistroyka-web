"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { CanonPageHeader } from "@/components/canon";
import { resolveTasksReturnHref } from "../tasks-workspace.utils";
import { DashboardTaskDetailClient } from "./DashboardTaskDetailClient";

export function TaskDetailCanonPage({ taskId }: { taskId: string }) {
  const t = useTranslations("nav");
  const tPage = useTranslations("dashboardPageMeta");
  const searchParams = useSearchParams();
  const backHref = resolveTasksReturnHref(searchParams?.get("returnTo"));

  return (
    <div className="space-y-6">
      <CanonPageHeader
        title={t("tasks")}
        subtitle={tPage("taskDetailSubtitle")}
        showFavorite={false}
        actions={
          <Link href={backHref} className="canon-ghost-btn text-sm">
            {tPage("backToTasks")}
          </Link>
        }
      />
      <DashboardTaskDetailClient taskId={taskId} skin="canon" />
    </div>
  );
}
