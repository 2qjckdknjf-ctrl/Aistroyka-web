"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
/** Display row from GET /stakeholder-activity (read model JSON). */
export type StakeholderActivityDisplayItem = {
  id: string;
  eventType: string;
  occurredAt: string;
  title: string;
  description: string | null;
  projectId: string;
  targetUrl: string | null;
  actionNeeded: boolean;
  actorId?: string | null;
};

type Item = StakeholderActivityDisplayItem;

interface StakeholderActivityBlockProps {
  items: Item[];
  title?: string;
  emptyMessage?: string;
  maxItems?: number;
}

function formatRelativeTime(iso: string, tDetail: ReturnType<typeof useTranslations>): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return tDetail("justNow");
  if (diffMins < 60) return `${diffMins}${tDetail("minutesAgoShort")}`;
  if (diffHours < 24) return `${diffHours}${tDetail("hoursAgoShort")}`;
  if (diffDays < 7) return `${diffDays}${tDetail("daysAgoShort")}`;
  return d.toLocaleDateString();
}

export function StakeholderActivityBlock({
  items,
  title,
  emptyMessage,
  maxItems,
}: StakeholderActivityBlockProps) {
  const tDetail = useTranslations("dashboardDetail");
  const resolvedTitle = title ?? tDetail("clientPortalActivity");
  const resolvedEmptyMessage = emptyMessage ?? tDetail("noClientPortalActivityYet");
  const displayed = maxItems ? items.slice(0, maxItems) : items;

  if (displayed.length === 0) {
    return (
      <div className="rounded-lg border border-aistroyka-border-subtle bg-aistroyka-surface p-4">
        <h3 className="text-aistroyka-subheadline font-semibold text-aistroyka-text-primary">{resolvedTitle}</h3>
        <p className="mt-2 text-sm text-aistroyka-text-secondary">{resolvedEmptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-aistroyka-border-subtle bg-aistroyka-surface overflow-hidden">
      <h3 className="text-aistroyka-subheadline font-semibold text-aistroyka-text-primary p-4 pb-2">{resolvedTitle}</h3>
      <p className="px-4 pb-2 text-xs text-aistroyka-text-tertiary">
        {tDetail("requestsResponsesPortalAccessHint")}
      </p>
      <ul className="divide-y divide-aistroyka-border-subtle">
        {displayed.map((item) => (
          <li key={item.id}>
            <Link
              href={item.targetUrl ?? `/dashboard/projects/${item.projectId}/client`}
              className={`block p-4 hover:bg-aistroyka-surface-raised transition-colors ${
                item.actionNeeded ? "border-l-4 border-l-amber-500 bg-amber-500/5" : ""
              }`}
            >
              <p className="text-sm font-medium text-aistroyka-text-primary">{item.title}</p>
              {item.description ? (
                <p className="mt-0.5 text-xs text-aistroyka-text-secondary">{item.description}</p>
              ) : null}
              {item.actionNeeded ? (
                <p className="mt-1 text-xs font-medium text-amber-700 dark:text-amber-400">{tDetail("actionNeeded")}</p>
              ) : null}
              <p className="mt-1 text-xs text-aistroyka-text-tertiary">{formatRelativeTime(item.occurredAt, tDetail)}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
