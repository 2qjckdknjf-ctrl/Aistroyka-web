"use client";

import { Card, Badge } from "@/components/ui";
import {
  PLATFORM_ADMIN_TESTING_READONLY_SNAPSHOT,
  levelBadgeVariant,
  type ReadonlyStatusCard,
} from "@/lib/platform-admin/testing-readonly-snapshot";

function StatusCard({ card }: { card: ReadonlyStatusCard }) {
  return (
    <Card className="p-aistroyka-5">
      <div className="mb-aistroyka-3 flex flex-wrap items-center justify-between gap-aistroyka-2">
        <h2 className="text-aistroyka-headline font-semibold text-aistroyka-text-primary">{card.title}</h2>
        <Badge variant={levelBadgeVariant(card.level)}>{card.level.replace("_", " ")}</Badge>
      </div>
      <p className="text-aistroyka-subheadline text-aistroyka-text-secondary">{card.summary}</p>
      <ul className="mt-aistroyka-3 list-disc space-y-aistroyka-1 pl-aistroyka-5 text-aistroyka-subheadline text-aistroyka-text-secondary">
        {card.bullets.map((bullet) => (
          <li key={bullet}>{bullet}</li>
        ))}
      </ul>
    </Card>
  );
}

export function PlatformAdminTestingClient() {
  const snapshot = PLATFORM_ADMIN_TESTING_READONLY_SNAPSHOT;

  return (
    <section className="space-y-aistroyka-6" aria-label="ROMA testing read-only center">
      <Card className="border-l-4 border-l-aistroyka-accent p-aistroyka-5">
        <h1 className="text-aistroyka-title2 font-bold tracking-tight text-aistroyka-text-primary sm:text-aistroyka-title">
          ROMA Testing — read-only center
        </h1>
        <p className="mt-aistroyka-2 text-aistroyka-subheadline text-aistroyka-text-secondary">
          Platform testing and ROMA readiness snapshot. This page is <strong>read-only</strong>: test execution
          from the UI is not enabled. ROMA cannot mutate production from here. Tenant company admins cannot
          access this surface — platform owner grant required.
        </p>
        <p className="mt-aistroyka-2 text-aistroyka-footnote text-aistroyka-text-tertiary">
          Full admin host <code className="rounded bg-aistroyka-surface-raised px-1">{snapshot.preferredHost}</code>{" "}
          is pending deployment. Current safe route:{" "}
          <code className="rounded bg-aistroyka-surface-raised px-1">{snapshot.routePath}</code> (locale-prefixed).
          Snapshot date: {snapshot.updatedAt}.
        </p>
      </Card>

      <div className="grid gap-aistroyka-4 lg:grid-cols-2">
        <StatusCard card={snapshot.overallTesting} />
        <StatusCard card={snapshot.platformAdminSecurity} />
        <StatusCard card={snapshot.romaFramework} />
        <StatusCard card={snapshot.releaseReadiness} />
      </div>

      <Card className="p-aistroyka-5">
        <h2 className="text-aistroyka-headline font-semibold text-aistroyka-text-primary">
          Latest evidence / reports
        </h2>
        <p className="mt-aistroyka-1 text-aistroyka-subheadline text-aistroyka-text-secondary">
          References only — no live CI or filesystem reads from this page.
        </p>
        <ul className="mt-aistroyka-4 space-y-aistroyka-3">
          {snapshot.evidenceReports.map((report) => (
            <li
              key={report.path}
              className="rounded-card border border-aistroyka-border-subtle px-aistroyka-4 py-aistroyka-3"
            >
              <p className="font-medium text-aistroyka-text-primary">{report.label}</p>
              <p className="font-mono text-aistroyka-caption text-aistroyka-text-tertiary">{report.path}</p>
              <p className="mt-aistroyka-1 text-aistroyka-subheadline text-aistroyka-text-secondary">
                {report.note}
              </p>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="p-aistroyka-5">
        <h2 className="text-aistroyka-headline font-semibold text-aistroyka-text-primary">Known blockers</h2>
        <ul className="mt-aistroyka-3 list-disc space-y-aistroyka-1 pl-aistroyka-5 text-aistroyka-subheadline text-aistroyka-text-secondary">
          {snapshot.knownBlockers.map((blocker) => (
            <li key={blocker}>{blocker}</li>
          ))}
        </ul>
      </Card>

      <Card className="border-l-4 border-l-aistroyka-accent p-aistroyka-5">
        <h2 className="text-aistroyka-headline font-semibold text-aistroyka-text-primary">Next safe action</h2>
        <p className="mt-aistroyka-2 text-aistroyka-subheadline text-aistroyka-text-secondary">
          {snapshot.nextSafeAction}
        </p>
      </Card>
    </section>
  );
}
