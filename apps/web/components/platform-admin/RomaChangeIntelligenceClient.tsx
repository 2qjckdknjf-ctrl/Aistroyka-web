"use client";

import { Card, Badge } from "@/components/ui";
import { getNodeById } from "@/lib/platform-admin/roma-quality-graph";
import {
  analyzeChangeSet,
  getChangeIntelligenceEngine,
  ROMA_CHANGE_INTELLIGENCE_EXAMPLES,
} from "@/lib/platform-admin/roma-change-intelligence";
import type { RomaChangeConfidence, RomaChangeReleaseImpact } from "@/lib/platform-admin/roma-change-intelligence.types";
import { getTestById } from "@/lib/platform-admin/roma-test-catalog";

function confidenceBadge(c: RomaChangeConfidence): "success" | "warning" | "danger" | "neutral" {
  switch (c) {
    case "high":
      return "success";
    case "medium":
      return "warning";
    case "low":
      return "neutral";
    case "unknown":
      return "danger";
    default: {
      const _exhaustive: never = c;
      return _exhaustive;
    }
  }
}

function releaseBadge(r: RomaChangeReleaseImpact): "success" | "warning" | "danger" | "neutral" {
  switch (r) {
    case "none":
      return "neutral";
    case "low":
      return "neutral";
    case "medium":
      return "warning";
    case "high":
      return "danger";
    default: {
      const _exhaustive: never = r;
      return _exhaustive;
    }
  }
}

function nodeLabel(id: string): string {
  return getNodeById(id)?.label ?? id;
}

export function RomaChangeIntelligenceClient() {
  const engine = getChangeIntelligenceEngine();

  return (
    <section className="space-y-aistroyka-5" aria-label="ROMA Change Intelligence">
      <Card className="p-aistroyka-5">
        <div className="flex flex-wrap items-start justify-between gap-aistroyka-3">
          <div>
            <h1 className="text-aistroyka-title2 font-bold tracking-tight text-aistroyka-text-primary">
              Change Intelligence
            </h1>
            <p className="mt-aistroyka-2 max-w-3xl text-aistroyka-subheadline text-aistroyka-text-secondary">
              Analyze code changes to determine affected areas, risks, required test domains, and release impact.
              V1 uses Quality Graph + Test Catalog — read-only simulation via example scenarios only.
            </p>
          </div>
          <div className="flex flex-wrap gap-aistroyka-2">
            <Badge variant="neutral">Read-only</Badge>
            <Badge variant="neutral">No execution</Badge>
            <Badge variant="neutral">v1</Badge>
          </div>
        </div>
        <p className="mt-aistroyka-4 text-aistroyka-footnote text-aistroyka-text-tertiary">
          Engine execution: {String(engine.executionEnabled)} — no CI, no production mutation, no Run controls.
        </p>
      </Card>

      <div className="space-y-aistroyka-5">
        {ROMA_CHANGE_INTELLIGENCE_EXAMPLES.map((example) => {
          const result = analyzeChangeSet(example.input);
          return (
            <Card key={example.label} className="p-aistroyka-5">
              <div className="flex flex-wrap items-start justify-between gap-aistroyka-2">
                <div>
                  <h2 className="text-aistroyka-headline font-semibold text-aistroyka-text-primary">
                    {example.label}
                  </h2>
                  <p className="mt-aistroyka-1 font-mono text-aistroyka-caption text-aistroyka-text-tertiary">
                    {example.input.changedPaths.join(", ")}
                  </p>
                </div>
                <div className="flex flex-wrap gap-aistroyka-2">
                  <Badge variant={confidenceBadge(result.confidence)}>Confidence: {result.confidence}</Badge>
                  <Badge variant={releaseBadge(result.releaseImpact)}>Release: {result.releaseImpact}</Badge>
                  <Badge variant="neutral">Risk: {result.riskLevel}</Badge>
                </div>
              </div>

              <p className="mt-aistroyka-4 text-aistroyka-subheadline text-aistroyka-text-primary">
                {result.explanation}
              </p>

              <dl className="mt-aistroyka-4 grid gap-aistroyka-3 sm:grid-cols-2 text-aistroyka-footnote">
                <div>
                  <dt className="font-semibold text-aistroyka-text-tertiary">Affected areas</dt>
                  <dd className="mt-aistroyka-1 text-aistroyka-text-secondary">
                    {result.affectedAreas.length > 0
                      ? result.affectedAreas.map(nodeLabel).join(", ")
                      : "Unknown / none mapped"}
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-aistroyka-text-tertiary">Affected roles</dt>
                  <dd className="mt-aistroyka-1 text-aistroyka-text-secondary">
                    {result.affectedRoles.map(nodeLabel).join(", ") || "—"}
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-aistroyka-text-tertiary">Affected surfaces</dt>
                  <dd className="mt-aistroyka-1 text-aistroyka-text-secondary">
                    {result.affectedSurfaces.map(nodeLabel).join(", ") || "—"}
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-aistroyka-text-tertiary">Affected APIs</dt>
                  <dd className="mt-aistroyka-1 text-aistroyka-text-secondary">
                    {result.affectedApis.map(nodeLabel).join(", ") || "—"}
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-aistroyka-text-tertiary">Affected mobile apps</dt>
                  <dd className="mt-aistroyka-1 text-aistroyka-text-secondary">
                    {result.affectedMobileApps.map(nodeLabel).join(", ") || "—"}
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-aistroyka-text-tertiary">Affected risks</dt>
                  <dd className="mt-aistroyka-1 text-aistroyka-text-secondary">
                    {result.affectedRisks.map(nodeLabel).join(", ") || "—"}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="font-semibold text-aistroyka-text-tertiary">Required test domains</dt>
                  <dd className="mt-aistroyka-1 flex flex-wrap gap-aistroyka-1">
                    {result.requiredTestDomains.length > 0 ? (
                      result.requiredTestDomains.map((d) => (
                        <Badge key={d} variant="neutral">
                          {d}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-aistroyka-text-secondary">None / low impact</span>
                    )}
                  </dd>
                </div>
              </dl>

              {result.recommendedCatalogTests.length > 0 ? (
                <div className="mt-aistroyka-4">
                  <p className="text-aistroyka-caption font-semibold uppercase text-aistroyka-text-tertiary">
                    Recommended catalog tests (disabled)
                  </p>
                  <ul className="mt-aistroyka-2 space-y-aistroyka-1 text-aistroyka-footnote">
                    {result.recommendedCatalogTests.slice(0, 8).map((testId) => {
                      const test = getTestById(testId);
                      return (
                        <li key={testId} className="text-aistroyka-text-secondary">
                          <span className="font-mono text-aistroyka-caption">{testId}</span>
                          {test ? ` — ${test.title}` : null}
                          {test?.releaseCritical ? (
                            <Badge variant="danger" className="ml-aistroyka-2">
                              Release critical
                            </Badge>
                          ) : null}
                        </li>
                      );
                    })}
                    {result.recommendedCatalogTests.length > 8 ? (
                      <li className="text-aistroyka-text-tertiary">
                        +{result.recommendedCatalogTests.length - 8} more…
                      </li>
                    ) : null}
                  </ul>
                </div>
              ) : null}
            </Card>
          );
        })}
      </div>
    </section>
  );
}
