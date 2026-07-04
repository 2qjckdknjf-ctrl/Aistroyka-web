"use client";

import { Card, Badge } from "@/components/ui";
import {
  createExecutionPlan,
  explainExecutionPlan,
  getExecutionPlannerMeta,
  ROMA_EXECUTION_PLANNER_EXAMPLES,
} from "@/lib/platform-admin/roma-execution-planner";
import type { RomaExecutionPlan } from "@/lib/platform-admin/roma-execution-planner.types";

function PlanCard({ label, plan }: { label: string; plan: RomaExecutionPlan }) {
  return (
    <Card className="p-aistroyka-5">
      <div className="flex flex-wrap items-start justify-between gap-aistroyka-2">
        <div>
          <h2 className="text-aistroyka-headline font-semibold text-aistroyka-text-primary">{label}</h2>
          <p className="mt-aistroyka-1 font-mono text-aistroyka-caption text-aistroyka-text-tertiary">
            {plan.planId}
          </p>
        </div>
        <div className="flex flex-wrap gap-aistroyka-2">
          {plan.manualReviewRequired ? <Badge variant="warning">Manual review</Badge> : null}
          <Badge variant="neutral">Confidence: {plan.confidence}</Badge>
          <Badge variant="neutral">Release: {plan.releaseImpact}</Badge>
        </div>
      </div>

      <p className="mt-aistroyka-4 text-aistroyka-subheadline text-aistroyka-text-primary">{plan.summary}</p>
      <p className="mt-aistroyka-2 text-aistroyka-footnote text-aistroyka-text-secondary">{explainExecutionPlan(plan)}</p>

      <dl className="mt-aistroyka-4 grid gap-aistroyka-3 sm:grid-cols-2 text-aistroyka-footnote">
        <div>
          <dt className="font-semibold text-aistroyka-text-tertiary">Estimated runtime</dt>
          <dd className="mt-aistroyka-1 text-aistroyka-text-primary">{plan.estimatedRuntime}</dd>
        </div>
        <div>
          <dt className="font-semibold text-aistroyka-text-tertiary">Required domains</dt>
          <dd className="mt-aistroyka-1 text-aistroyka-text-secondary">
            {plan.requiredTestDomains.join(", ") || "None"}
          </dd>
        </div>
        <div>
          <dt className="font-semibold text-aistroyka-text-tertiary">Environments</dt>
          <dd className="mt-aistroyka-1 text-aistroyka-text-secondary">{plan.requiredEnvironments.join(", ")}</dd>
        </div>
        <div>
          <dt className="font-semibold text-aistroyka-text-tertiary">Credentials needed</dt>
          <dd className="mt-aistroyka-1 text-aistroyka-text-secondary">
            {plan.requiredCredentials.length > 0 ? plan.requiredCredentials.join("; ") : "None identified"}
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="font-semibold text-aistroyka-text-tertiary">Devices needed</dt>
          <dd className="mt-aistroyka-1 text-aistroyka-text-secondary">
            {plan.requiredDevices.length > 0 ? plan.requiredDevices.join("; ") : "None identified"}
          </dd>
        </div>
      </dl>

      <div className="mt-aistroyka-5">
        <h3 className="text-aistroyka-subheadline font-semibold text-aistroyka-text-primary">Execution phases</h3>
        <div className="mt-aistroyka-3 space-y-aistroyka-2">
          {plan.executionPhases.length > 0 ? (
            plan.executionPhases.map((phase) => (
              <div
                key={phase.phaseId}
                className="rounded-card border border-aistroyka-border-subtle bg-aistroyka-surface-raised px-aistroyka-3 py-aistroyka-2"
              >
                <p className="font-medium text-aistroyka-text-primary">{phase.label}</p>
                <p className="text-aistroyka-caption text-aistroyka-text-tertiary">{phase.description}</p>
                <p className="mt-aistroyka-1 font-mono text-aistroyka-caption text-aistroyka-text-secondary">
                  {phase.testIds.join(", ") || "—"}
                </p>
              </div>
            ))
          ) : (
            <p className="text-aistroyka-footnote text-aistroyka-text-tertiary">No phases — minimal or unknown change.</p>
          )}
        </div>
      </div>

      <div className="mt-aistroyka-5 grid gap-aistroyka-4 lg:grid-cols-3">
        <div>
          <h3 className="text-aistroyka-caption font-semibold uppercase text-aistroyka-text-tertiary">
            Selected ({plan.selectedTests.length})
          </h3>
          <ul className="mt-aistroyka-2 max-h-48 space-y-aistroyka-1 overflow-y-auto text-aistroyka-footnote">
            {plan.selectedTests.map((t) => (
              <li key={t.testId} className="text-aistroyka-text-secondary">
                <span className="font-mono text-aistroyka-caption">{t.testId}</span>
                {!t.executable ? <span className="text-aistroyka-text-tertiary"> (non-executable)</span> : null}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-aistroyka-caption font-semibold uppercase text-aistroyka-text-tertiary">
            Blocked ({plan.blockedTests.length})
          </h3>
          <ul className="mt-aistroyka-2 max-h-48 space-y-aistroyka-1 overflow-y-auto text-aistroyka-footnote">
            {plan.blockedTests.map((t) => (
              <li key={t.testId} className="text-aistroyka-text-secondary">
                {t.testId}: {t.reason}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-aistroyka-caption font-semibold uppercase text-aistroyka-text-tertiary">
            Skipped ({plan.skippedTests.length})
          </h3>
          <ul className="mt-aistroyka-2 max-h-48 space-y-aistroyka-1 overflow-y-auto text-aistroyka-footnote">
            {plan.skippedTests.slice(0, 6).map((t) => (
              <li key={t.testId} className="text-aistroyka-text-secondary">
                {t.title}: {t.reason}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-aistroyka-5 rounded-card border border-aistroyka-border-subtle bg-aistroyka-surface-raised px-aistroyka-4 py-aistroyka-3">
        <p className="text-aistroyka-caption font-semibold uppercase text-aistroyka-text-tertiary">Next safe action</p>
        <p className="mt-aistroyka-1 text-aistroyka-subheadline text-aistroyka-text-primary">{plan.nextSafeAction}</p>
      </div>

      <div className="mt-aistroyka-4">
        <p className="text-aistroyka-caption font-semibold uppercase text-aistroyka-text-tertiary">Stop conditions</p>
        <ul className="mt-aistroyka-2 list-disc space-y-aistroyka-1 pl-aistroyka-5 text-aistroyka-footnote text-aistroyka-text-secondary">
          {plan.stopConditions.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      </div>
    </Card>
  );
}

export function RomaExecutionPlannerClient() {
  const meta = getExecutionPlannerMeta();

  return (
    <section className="space-y-aistroyka-5" aria-label="ROMA Execution Planner">
      <Card className="p-aistroyka-5">
        <div className="flex flex-wrap items-start justify-between gap-aistroyka-3">
          <div>
            <h1 className="text-aistroyka-title2 font-bold tracking-tight text-aistroyka-text-primary">
              Execution Planner
            </h1>
            <p className="mt-aistroyka-2 max-w-3xl text-aistroyka-subheadline text-aistroyka-text-secondary">
              Deterministic execution plans from Change Intelligence — phases, selected/blocked/skipped tests,
              credentials, devices, and stop conditions. Planning only; no runs, no CI, no Run controls.
            </p>
          </div>
          <div className="flex flex-wrap gap-aistroyka-2">
            <Badge variant="neutral">Planning only</Badge>
            <Badge variant="neutral">No execution</Badge>
            <Badge variant="neutral">v1</Badge>
          </div>
        </div>
        <p className="mt-aistroyka-4 text-aistroyka-footnote text-aistroyka-text-tertiary">
          Planner execution enabled: {String(meta.executionEnabled)} — catalog tests remain disabled.
        </p>
      </Card>

      {ROMA_EXECUTION_PLANNER_EXAMPLES.map((example) => (
        <PlanCard key={example.label} label={example.label} plan={createExecutionPlan(example.input)} />
      ))}
    </section>
  );
}
