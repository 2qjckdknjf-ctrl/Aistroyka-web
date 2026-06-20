"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { getProjectSubnavItems, type ProjectSubnavItem } from "./project-subnav.items";

export function ProjectSubnav({
  projectId,
  activeTab,
  onSelect,
}: {
  projectId: string;
  activeTab: string;
  onSelect?: (tab: string) => void;
}) {
  const t = useTranslations("dashboardDetail");
  const items = getProjectSubnavItems(projectId);

  const isItemActive = (item: ProjectSubnavItem) => {
    if (item.tab === null) {
      return !items.some((candidate) => candidate.tab === activeTab);
    }
    return activeTab === item.tab;
  };

  return (
    <nav
      aria-label={t("projectSubnavAria")}
      className="mb-4 flex flex-wrap gap-2 rounded-[var(--aistroyka-radius-xl)] border border-aistroyka-border-subtle bg-aistroyka-surface px-3 py-3"
      data-testid="project-subnav"
    >
      {items.map((item) => {
        const active = isItemActive(item);
        return (
          <Link
            key={item.key}
            href={item.href}
            onClick={() => onSelect?.(item.tab ?? "workers")}
            data-testid={`project-subnav.${item.key}`}
            aria-current={active ? "page" : undefined}
            className={`rounded-[var(--aistroyka-radius-lg)] px-3 py-2 text-aistroyka-subheadline font-medium transition-colors ${
              active
                ? "bg-aistroyka-accent-light text-aistroyka-accent"
                : "text-aistroyka-text-secondary hover:bg-aistroyka-surface-raised hover:text-aistroyka-text-primary"
            }`}
          >
            {t(item.labelKey)}
          </Link>
        );
      })}
    </nav>
  );
}
