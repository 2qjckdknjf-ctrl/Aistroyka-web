"use client";

import { Link } from "@/i18n/navigation";
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

function formatRelativeTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString();
}

export function StakeholderActivityBlock({
  items,
  title = "Client & portal activity",
  emptyMessage = "No client or portal activity yet.",
  maxItems,
}: StakeholderActivityBlockProps) {
  const displayed = maxItems ? items.slice(0, maxItems) : items;

  if (displayed.length === 0) {
    return (
      <div className="rounded-lg border border-aistroyka-border-subtle bg-aistroyka-surface p-4">
        <h3 className="text-aistroyka-subheadline font-semibold text-aistroyka-text-primary">{title}</h3>
        <p className="mt-2 text-sm text-aistroyka-text-secondary">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-aistroyka-border-subtle bg-aistroyka-surface overflow-hidden">
      <h3 className="text-aistroyka-subheadline font-semibold text-aistroyka-text-primary p-4 pb-2">{title}</h3>
      <p className="px-4 pb-2 text-xs text-aistroyka-text-tertiary">
        Requests, responses, and portal access — not internal team operations.
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
                <p className="mt-1 text-xs font-medium text-amber-700 dark:text-amber-400">Action needed</p>
              ) : null}
              <p className="mt-1 text-xs text-aistroyka-text-tertiary">{formatRelativeTime(item.occurredAt)}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
