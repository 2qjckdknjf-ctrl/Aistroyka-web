"use client";

import { Link } from "@/i18n/navigation";
import { Card } from "@/components/ui";

/** Demo dataset for display when user has no projects. */
export const DEMO_PROJECT = {
  id: "demo",
  name: "Demo project",
  tasks: [
    { id: "t1", title: "Foundation inspection", status: "completed", due_date: "2025-03-10" },
    { id: "t2", title: "Safety briefing", status: "in_progress", due_date: "2025-03-12" },
    { id: "t3", title: "Material delivery", status: "pending", due_date: "2025-03-15" },
  ],
  reports: [
    { id: "r1", date: "2025-03-11", summary: "Day 1 progress — foundation formwork" },
    { id: "r2", date: "2025-03-10", summary: "Site setup and safety check" },
  ],
  photos: 12,
  alerts: [
    { id: "a1", severity: "medium", text: "Missing photo evidence for Task T-102" },
    { id: "a2", severity: "low", text: "Recommend scheduling next inspection" },
  ],
  aiInsights: {
    summary: "Project is on track. Foundation phase at 85% completion. One task pending evidence.",
    risks: ["Delayed material delivery may impact schedule"],
    recommendations: ["Upload before/after photos for completed tasks", "Confirm delivery date with supplier"],
  },
};

export function DemoProjectCard() {
  const d = DEMO_PROJECT;
  return (
    <Card className="overflow-hidden p-0">
      <div className="border-b border-aistroyka-border-subtle bg-aistroyka-surface-raised px-4 py-3">
        <div className="flex items-center justify-between">
          <h3 className="text-aistroyka-headline font-semibold text-aistroyka-text-primary">
            {d.name}
          </h3>
          <span className="rounded-full bg-aistroyka-accent-light px-2 py-0.5 text-aistroyka-caption font-medium text-aistroyka-accent">
            Demo
          </span>
        </div>
        <p className="mt-1 text-aistroyka-caption text-aistroyka-text-tertiary">
          Sample data. Create your first project to see your own tasks, reports, and AI insights.
        </p>
      </div>
      <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <h4 className="text-aistroyka-caption font-semibold uppercase tracking-wide text-aistroyka-text-tertiary">
            Tasks
          </h4>
          <ul className="mt-2 space-y-1 text-aistroyka-subheadline text-aistroyka-text-secondary">
            {d.tasks.map((t) => (
              <li key={t.id}>• {t.title}</li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-aistroyka-caption font-semibold uppercase tracking-wide text-aistroyka-text-tertiary">
            Reports &amp; photos
          </h4>
          <p className="mt-2 text-aistroyka-subheadline text-aistroyka-text-secondary">
            {d.reports.length} reports, {d.photos} photos
          </p>
        </div>
        <div>
          <h4 className="text-aistroyka-caption font-semibold uppercase tracking-wide text-aistroyka-text-tertiary">
            AI insights
          </h4>
          <p className="mt-2 text-aistroyka-subheadline text-aistroyka-text-secondary line-clamp-2">
            {d.aiInsights.summary}
          </p>
        </div>
      </div>
      <div className="border-t border-aistroyka-border-subtle bg-aistroyka-surface-muted/50 px-4 py-3">
        <Link
          href="/projects/new"
          className="text-aistroyka-caption font-medium text-aistroyka-accent hover:underline"
        >
          Create your first project →
        </Link>
      </div>
    </Card>
  );
}
