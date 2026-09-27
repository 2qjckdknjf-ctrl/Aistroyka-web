"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function CanonTasksAiPanel() {
  const t = useTranslations("canon");

  return (
    <aside className="canon-glass canon-ai-panel p-4">
      <div className="flex items-center gap-2">
        <p className="canon-section-title">{t("tasksAiPriorities")}</p>
      </div>
      <div className="mt-4 space-y-4 text-sm">
        <div>
          <p className="font-medium text-[var(--canon-text-primary)]">{t("tasksAiRec1Title")}</p>
          <p className="mt-1 text-[var(--canon-text-muted)]">{t("tasksAiRec1Impact")}</p>
          <Link href="/dashboard/tasks?scope=overdue" className="canon-ghost-btn mt-2 !text-xs inline-flex">
            {t("tasksAiShowTasks")}
          </Link>
        </div>
        <div>
          <p className="font-medium text-[var(--canon-text-primary)]">{t("tasksAiRec2Title")}</p>
          <p className="mt-1 text-[var(--canon-text-muted)]">{t("tasksAiRec2Impact")}</p>
          <Link href="/dashboard/tasks?scope=review&status=in_progress" className="canon-ghost-btn mt-2 !text-xs inline-flex">
            {t("tasksAiOpenTask")}
          </Link>
        </div>
      </div>
      <Link href="/dashboard/ai" className="canon-ai-panel-btn mt-4">
        {t("openAiCenter")} →
      </Link>
    </aside>
  );
}
