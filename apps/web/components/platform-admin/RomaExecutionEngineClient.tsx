"use client";

import { Card, Badge } from "@/components/ui";
import {
  evaluateExecutionPolicyForInput,
  explainPolicyDecision,
  getExecutionEngineMeta,
  ROMA_EXECUTION_ACTIVATION_CHECKLIST,
  ROMA_EXECUTION_ENGINE_EXAMPLES,
  ROMA_EXECUTION_MODE_DEFINITIONS,
} from "@/lib/platform-admin/roma-execution-engine-policy";
import type { RomaExecutionPolicyDecision } from "@/lib/platform-admin/roma-execution-engine.types";

function PolicyDecisionCard({ label, decision }: { label: string; decision: RomaExecutionPolicyDecision }) {
  return (
    <Card className="p-aistroyka-5">
      <div className="flex flex-wrap items-start justify-between gap-aistroyka-2">
        <div>
          <h2 className="text-aistroyka-headline font-semibold text-aistroyka-text-primary">{label}</h2>
          <p className="mt-aistroyka-1 font-mono text-aistroyka-caption text-aistroyka-text-tertiary">
            {decision.planId}
          </p>
        </div>
        <div className="flex flex-wrap gap-aistroyka-2">
          <Badge variant="neutral">Recommended: {decision.recommendedMode}</Badge>
          <Badge variant={decision.policyGatesPassed ? "success" : "warning"}>
            Gates: {decision.policyGatesPassed ? "pass" : "blocked"}
          </Badge>
        </div>
      </div>

      <p className="mt-aistroyka-4 text-aistroyka-subheadline text-aistroyka-text-primary">{decision.summary}</p>
      <p className="mt-aistroyka-2 text-aistroyka-footnote text-aistroyka-text-secondary">
        {explainPolicyDecision(decision)}
      </p>

      <dl className="mt-aistroyka-4 grid gap-aistroyka-3 sm:grid-cols-2 text-aistroyka-footnote">
        <div>
          <dt className="font-semibold text-aistroyka-text-tertiary">Allowed modes</dt>
          <dd className="mt-aistroyka-1 font-mono text-aistroyka-caption text-aistroyka-text-secondary">
            {decision.allowedModes.join(", ")}
          </dd>
        </div>
        <div>
          <dt className="font-semibold text-aistroyka-text-tertiary">Required approvals</dt>
          <dd className="mt-aistroyka-1 text-aistroyka-text-secondary">
            {decision.requiredApprovals.length > 0 ? decision.requiredApprovals.join(", ") : "None"}
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="font-semibold text-aistroyka-text-tertiary">Blocked reasons ({decision.blockedReasons.length})</dt>
          <dd className="mt-aistroyka-1 text-aistroyka-text-secondary">
            <ul className="list-disc space-y-aistroyka-1 pl-aistroyka-5">
              {decision.blockedReasons.slice(0, 6).map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </dd>
        </div>
      </dl>

      <div className="mt-aistroyka-4">
        <p className="text-aistroyka-caption font-semibold uppercase text-aistroyka-text-tertiary">Safety warnings</p>
        <ul className="mt-aistroyka-2 list-disc space-y-aistroyka-1 pl-aistroyka-5 text-aistroyka-footnote text-aistroyka-text-secondary">
          {decision.safetyWarnings.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      </div>
    </Card>
  );
}

export function RomaExecutionEngineClient() {
  const meta = getExecutionEngineMeta();

  return (
    <section className="space-y-aistroyka-5" aria-label="ROMA Execution Engine">
      <Card className="p-aistroyka-5">
        <div className="flex flex-wrap items-start justify-between gap-aistroyka-3">
          <div>
            <h1 className="text-aistroyka-title2 font-bold tracking-tight text-aistroyka-text-primary">
              Execution Engine
            </h1>
            <p className="mt-aistroyka-2 max-w-3xl text-aistroyka-subheadline text-aistroyka-text-secondary">
              V1 safety policy and execution modes — design only. Defines how plans will execute in the future
              (staging-first, read-only default, manual approval gates). No runners, no Run controls, no CI triggers.
            </p>
          </div>
          <div className="flex flex-wrap gap-aistroyka-2">
            <Badge variant="neutral">Design only</Badge>
            <Badge variant="neutral">No execution</Badge>
            <Badge variant="neutral">v1</Badge>
          </div>
        </div>
        <p className="mt-aistroyka-4 text-aistroyka-footnote text-aistroyka-text-tertiary">
          Engine execution enabled: {String(meta.executionEnabled)} — activation checklist must be satisfied before
          any future enablement.
        </p>
      </Card>

      <Card className="p-aistroyka-5">
        <h2 className="text-aistroyka-headline font-semibold text-aistroyka-text-primary">Why execution is disabled</h2>
        <ul className="mt-aistroyka-3 list-disc space-y-aistroyka-2 pl-aistroyka-5 text-aistroyka-footnote text-aistroyka-text-secondary">
          <li>Global engine activation flag is false (V1 design artifact)</li>
          <li>All catalog tests remain enabled: false</li>
          <li>No evidence sink, run-history store, or staging credential vault wired</li>
          <li>Production mutation, deploy, auto-fix, and DB mutation are forbidden in every mode</li>
          <li>P0/security/RBAC/platform-admin plans require owner + security approval before any staging run</li>
        </ul>
      </Card>

      <Card className="p-aistroyka-5">
        <h2 className="text-aistroyka-headline font-semibold text-aistroyka-text-primary">Execution modes</h2>
        <div className="mt-aistroyka-4 space-y-aistroyka-3">
          {ROMA_EXECUTION_MODE_DEFINITIONS.map((mode) => (
            <div
              key={mode.mode}
              className="rounded-card border border-aistroyka-border-subtle bg-aistroyka-surface-raised px-aistroyka-4 py-aistroyka-3"
            >
              <div className="flex flex-wrap items-center gap-aistroyka-2">
                <p className="font-medium text-aistroyka-text-primary">{mode.label}</p>
                <Badge variant="neutral">{mode.mode}</Badge>
                {mode.readOnly ? <Badge variant="neutral">Read-only</Badge> : null}
                {mode.stagingFirst ? <Badge variant="neutral">Staging-first</Badge> : null}
              </div>
              <p className="mt-aistroyka-1 text-aistroyka-footnote text-aistroyka-text-secondary">{mode.description}</p>
            </div>
          ))}
        </div>
        <p className="mt-aistroyka-4 text-aistroyka-caption text-aistroyka-text-tertiary">
          No LIVE_MUTATION mode in V1. Production targets are read-only audit probes only.
        </p>
      </Card>

      <Card className="p-aistroyka-5">
        <h2 className="text-aistroyka-headline font-semibold text-aistroyka-text-primary">
          Before execution can be enabled
        </h2>
        <ul className="mt-aistroyka-3 list-disc space-y-aistroyka-2 pl-aistroyka-5 text-aistroyka-footnote text-aistroyka-text-secondary">
          {ROMA_EXECUTION_ACTIVATION_CHECKLIST.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </Card>

      <div>
        <h2 className="text-aistroyka-headline font-semibold text-aistroyka-text-primary">
          Example policy decisions
        </h2>
        <p className="mt-aistroyka-2 text-aistroyka-footnote text-aistroyka-text-tertiary">
          Derived from Execution Planner example inputs — deterministic, no live git or external calls.
        </p>
        <div className="mt-aistroyka-4 space-y-aistroyka-5">
          {ROMA_EXECUTION_ENGINE_EXAMPLES.map((example) => (
            <PolicyDecisionCard key={example.label} label={example.label} decision={example.decision} />
          ))}
        </div>
      </div>
    </section>
  );
}
