"use client";

import { Link } from "@/i18n/navigation";
import type { TraceItem } from "@/lib/domain/traceability/traceability.types";

interface ProjectTraceabilityBlockProps {
  items: TraceItem[];
  truncated?: boolean;
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

function pointerLabel(p: TraceItem["linkedPointers"][0]): string {
  const t = p.entityType.replace(/_/g, " ");
  return `${t} · ${p.entityId.slice(0, 8)}…`;
}

export function ProjectTraceabilityBlock({
  items,
  truncated,
  title = "Audit & traceability",
  emptyMessage = "No recorded transitions or governance events for this project yet.",
  maxItems,
}: ProjectTraceabilityBlockProps) {
  const displayed = maxItems ? items.slice(0, maxItems) : items;

  if (displayed.length === 0) {
    return (
      <div className="rounded-lg border border-aistroyka-border-subtle bg-aistroyka-surface p-4">
        <h3 className="text-aistroyka-subheadline font-semibold text-aistroyka-text-primary">
          {title}
        </h3>
        <p className="mt-2 text-sm text-aistroyka-text-secondary">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-aistroyka-border-subtle bg-aistroyka-surface overflow-hidden">
      <div className="p-4 pb-2">
        <h3 className="text-aistroyka-subheadline font-semibold text-aistroyka-text-primary">
          {title}
        </h3>
        <p className="mt-1 text-xs text-aistroyka-text-tertiary">
          Append-only workflow history and linked context (who, when, state change, and FK-backed links).
        </p>
      </div>
      <ul className="divide-y divide-aistroyka-border-subtle">
        {displayed.map((item) => (
          <li key={item.id}>
            <Link
              href={item.targetUrl ?? "#"}
              className="block p-4 hover:bg-aistroyka-surface-raised transition-colors"
            >
              <p className="text-sm font-medium text-aistroyka-text-primary">{item.title}</p>
              {item.summary ? (
                <p className="mt-0.5 text-xs text-aistroyka-text-secondary">{item.summary}</p>
              ) : null}
              {item.reasonNote ? (
                <p className="mt-1 text-xs text-aistroyka-text-secondary italic">
                  Note: {item.reasonNote}
                </p>
              ) : null}
              {item.linkedPointers.length > 0 ? (
                <ul className="mt-2 flex flex-wrap gap-2">
                  {item.linkedPointers.map((p, i) => (
                    <li
                      key={`${item.id}-lp-${i}`}
                      className="rounded border border-aistroyka-border-subtle px-2 py-0.5 text-[10px] uppercase tracking-wide text-aistroyka-text-tertiary"
                    >
                      {pointerLabel(p)}
                    </li>
                  ))}
                </ul>
              ) : null}
              <p className="mt-2 text-xs text-aistroyka-text-tertiary">
                {formatRelativeTime(item.occurredAt)}
                {item.actorId ? (
                  <span className="ml-2">
                    {item.actorLabel ? (
                      <span className="text-aistroyka-text-secondary">{item.actorLabel}</span>
                    ) : (
                      <span className="font-mono">actor {item.actorId.slice(0, 8)}…</span>
                    )}
                  </span>
                ) : null}
              </p>
            </Link>
          </li>
        ))}
      </ul>
      {truncated ? (
        <p className="p-4 pt-0 text-xs text-aistroyka-text-tertiary">
          List truncated — oldest items omitted. Increase limit via API if needed.
        </p>
      ) : null}
    </div>
  );
}
