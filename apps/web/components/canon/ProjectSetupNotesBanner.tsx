"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

const storageKey = (projectId: string) => `aistroyka.project.setup.${projectId}`;

export function ProjectSetupNotesBanner({ projectId }: { projectId: string }) {
  const t = useTranslations("projects");
  const [notes, setNotes] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const value = sessionStorage.getItem(storageKey(projectId));
      setNotes(value && value.trim() ? value.trim() : null);
    } catch {
      setNotes(null);
    }
  }, [projectId]);

  if (!notes) return null;

  function dismiss() {
    try {
      sessionStorage.removeItem(storageKey(projectId));
    } catch {
      /* ignore */
    }
    setNotes(null);
  }

  return (
    <div className="canon-glass flex flex-col gap-2 p-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <p className="text-sm font-medium text-[var(--canon-gold)]">{t("setupNotesBannerTitle")}</p>
        <p className="mt-1 whitespace-pre-wrap text-sm text-[var(--canon-text-secondary)]">{notes}</p>
      </div>
      <button type="button" className="canon-ghost-btn !text-xs shrink-0" onClick={dismiss}>
        {t("setupNotesDismiss")}
      </button>
    </div>
  );
}
