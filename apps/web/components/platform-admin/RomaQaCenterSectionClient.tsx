"use client";

import { Card, Badge } from "@/components/ui";
import type { RomaQaCenterSection } from "@/lib/platform-admin/roma-qa-center.types";

function statusBadgeVariant(
  status: RomaQaCenterSection["status"]
): "success" | "warning" | "danger" | "neutral" {
  switch (status) {
    case "available":
      return "success";
    case "coming_soon":
      return "warning";
    case "unknown":
      return "neutral";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

function statusLabel(status: RomaQaCenterSection["status"]): string {
  switch (status) {
    case "available":
      return "Available";
    case "coming_soon":
      return "Coming soon";
    case "unknown":
      return "Unknown";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

function maturityLabel(maturity: RomaQaCenterSection["maturity"]): string {
  switch (maturity) {
    case "live":
      return "Live";
    case "partial":
      return "Partial";
    case "planned":
      return "Planned";
    default: {
      const _exhaustive: never = maturity;
      return _exhaustive;
    }
  }
}

type Props = {
  section: RomaQaCenterSection;
};

export function RomaQaCenterSectionClient({ section }: Props) {
  return (
    <section className="space-y-aistroyka-5" aria-label={section.title}>
      <Card className="p-aistroyka-5">
        <div className="flex flex-wrap items-start justify-between gap-aistroyka-3">
          <div>
            <h1 className="text-aistroyka-title2 font-bold tracking-tight text-aistroyka-text-primary">
              {section.title}
            </h1>
            <p className="mt-aistroyka-2 max-w-3xl text-aistroyka-subheadline text-aistroyka-text-secondary">
              {section.description}
            </p>
          </div>
          <div className="flex flex-wrap gap-aistroyka-2">
            <Badge variant={statusBadgeVariant(section.status)}>{statusLabel(section.status)}</Badge>
            <Badge variant="neutral">{maturityLabel(section.maturity)}</Badge>
            <Badge variant="neutral">Read-only</Badge>
          </div>
        </div>

        <dl className="mt-aistroyka-5 grid gap-aistroyka-4 sm:grid-cols-2">
          <div>
            <dt className="text-aistroyka-caption font-semibold uppercase text-aistroyka-text-tertiary">
              Source availability
            </dt>
            <dd className="mt-aistroyka-1 text-aistroyka-subheadline text-aistroyka-text-primary">
              {section.sourceAvailability}
            </dd>
          </div>
          <div>
            <dt className="text-aistroyka-caption font-semibold uppercase text-aistroyka-text-tertiary">
              Current capability
            </dt>
            <dd className="mt-aistroyka-1 text-aistroyka-subheadline text-aistroyka-text-secondary">
              {section.currentCapability}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-aistroyka-caption font-semibold uppercase text-aistroyka-text-tertiary">
              Future capability
            </dt>
            <dd className="mt-aistroyka-1 text-aistroyka-subheadline text-aistroyka-text-secondary">
              {section.futureCapability}
            </dd>
          </div>
        </dl>

        {section.blockers.length > 0 ? (
          <div className="mt-aistroyka-5">
            <p className="text-aistroyka-caption font-semibold uppercase text-aistroyka-text-tertiary">Blockers</p>
            <ul className="mt-aistroyka-2 list-disc space-y-aistroyka-1 pl-aistroyka-5 text-aistroyka-footnote text-aistroyka-text-secondary">
              {section.blockers.map((blocker) => (
                <li key={blocker}>{blocker}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <p className="mt-aistroyka-5 text-aistroyka-footnote text-aistroyka-text-tertiary">
          Test execution, Run Full Audit, CI triggers, and production mutation are intentionally disabled in V1.
        </p>
      </Card>

      {section.subAreas && section.subAreas.length > 0 ? (
        <Card className="p-aistroyka-5">
          <h2 className="text-aistroyka-headline font-semibold text-aistroyka-text-primary">Sub-areas</h2>
          <div className="mt-aistroyka-4 grid gap-aistroyka-3 sm:grid-cols-2">
            {section.subAreas.map((area) => (
              <div
                key={area.id}
                className="rounded-card border border-aistroyka-border-subtle px-aistroyka-4 py-aistroyka-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-aistroyka-2">
                  <p className="font-medium text-aistroyka-text-primary">{area.label}</p>
                  <Badge variant={statusBadgeVariant(area.status)}>{statusLabel(area.status)}</Badge>
                </div>
                <p className="mt-aistroyka-2 text-aistroyka-footnote text-aistroyka-text-secondary">{area.note}</p>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {section.relatedReports.length > 0 ? (
        <Card className="p-aistroyka-5">
          <h2 className="text-aistroyka-headline font-semibold text-aistroyka-text-primary">Related reports</h2>
          <p className="mt-aistroyka-1 text-aistroyka-footnote text-aistroyka-text-tertiary">
            Repo reference paths — not downloadable artifacts from this center yet.
          </p>
          <ul className="mt-aistroyka-4 space-y-aistroyka-2">
            {section.relatedReports.map((report) => (
              <li
                key={report.path}
                className="rounded-card border border-aistroyka-border-subtle px-aistroyka-3 py-aistroyka-2 text-aistroyka-footnote"
              >
                <span className="font-medium text-aistroyka-text-primary">{report.label}</span>
                <code className="mt-aistroyka-1 block text-aistroyka-caption text-aistroyka-text-tertiary">
                  {report.path}
                </code>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </section>
  );
}
