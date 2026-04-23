"use client";

import { Link } from "@/i18n/navigation";
import type { ProjectAttentionSummary } from "@/lib/domain/projects/project-attention.types";

interface ProjectAttentionBlockProps {
  summary: ProjectAttentionSummary;
  title: string;
  emptyMessage?: string;
}

export function ProjectAttentionBlock({
  summary,
  title,
  emptyMessage = "Nothing requiring attention right now.",
}: ProjectAttentionBlockProps) {
  if (summary.totalCount === 0) {
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
    <div className="rounded-lg border-l-4 border-l-aistroyka-warning border border-aistroyka-border-subtle bg-aistroyka-surface overflow-hidden">
      <h3 className="text-aistroyka-subheadline font-semibold text-aistroyka-text-primary p-4 pb-2">
        {title}
      </h3>
      <div className="p-4 pt-0">
        {summary.sections.map((section) => (
          <div key={section.type} className="mb-4 last:mb-0">
            <p
              className={`text-xs font-medium uppercase tracking-wide mb-2 ${
                section.severity === "critical"
                  ? "text-aistroyka-error"
                  : section.severity === "warning"
                    ? "text-aistroyka-warning"
                    : "text-aistroyka-text-tertiary"
              }`}
            >
              {section.label}
            </p>
            <ul className="space-y-1.5">
              {section.items.map((item) => (
                <li key={item.id}>
                  <Link
                    href={item.route}
                    className="flex items-center justify-between gap-2 rounded border border-aistroyka-border-subtle p-2.5 text-left hover:border-aistroyka-accent hover:bg-aistroyka-surface-raised transition-colors text-sm"
                  >
                    <span className="font-medium text-aistroyka-text-primary truncate">
                      {item.title}
                    </span>
                    <span className="text-xs text-aistroyka-text-tertiary shrink-0">
                      {item.reason}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
