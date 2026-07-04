"use client";

import { Card, Badge } from "@/components/ui";
import {
  analyzeChangeImpact,
  getGraphSummary,
  getNodesByType,
  getQualityGraph,
  ROMA_QUALITY_GRAPH_EXAMPLE_CHANGES,
} from "@/lib/platform-admin/roma-quality-graph";
import type { RomaQualityGraphNode } from "@/lib/platform-admin/roma-quality-graph.types";

function criticalityBadge(c?: RomaQualityGraphNode["criticality"]) {
  switch (c) {
    case "critical":
      return "danger" as const;
    case "high":
      return "warning" as const;
    case "medium":
      return "neutral" as const;
    case "low":
      return "neutral" as const;
    default:
      return "neutral" as const;
  }
}

function NodeTable({ title, nodes }: { title: string; nodes: readonly RomaQualityGraphNode[] }) {
  if (nodes.length === 0) return null;
  return (
    <Card className="p-aistroyka-5">
      <h2 className="text-aistroyka-headline font-semibold text-aistroyka-text-primary">{title}</h2>
      <div className="mt-aistroyka-4 overflow-x-auto">
        <table className="w-full min-w-[32rem] text-left text-aistroyka-footnote">
          <thead>
            <tr className="border-b border-aistroyka-border-subtle text-aistroyka-caption uppercase text-aistroyka-text-tertiary">
              <th className="py-aistroyka-2 pr-aistroyka-3 font-semibold">Label</th>
              <th className="py-aistroyka-2 pr-aistroyka-3 font-semibold">ID</th>
              <th className="py-aistroyka-2 font-semibold">Criticality</th>
            </tr>
          </thead>
          <tbody>
            {nodes.map((node) => (
              <tr key={node.id} className="border-b border-aistroyka-border-subtle/60">
                <td className="py-aistroyka-2 pr-aistroyka-3 text-aistroyka-text-primary">{node.label}</td>
                <td className="py-aistroyka-2 pr-aistroyka-3 font-mono text-aistroyka-caption text-aistroyka-text-tertiary">
                  {node.id}
                </td>
                <td className="py-aistroyka-2">
                  {node.criticality ? (
                    <Badge variant={criticalityBadge(node.criticality)}>{node.criticality}</Badge>
                  ) : (
                    <span className="text-aistroyka-text-tertiary">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function CountGrid({ counts }: { counts: Record<string, number> }) {
  return (
    <div className="grid gap-aistroyka-3 sm:grid-cols-2 lg:grid-cols-3">
      {Object.entries(counts)
        .filter(([, count]) => count > 0)
        .map(([type, count]) => (
          <div
            key={type}
            className="rounded-card border border-aistroyka-border-subtle bg-aistroyka-surface-raised px-aistroyka-3 py-aistroyka-2"
          >
            <p className="text-aistroyka-caption font-semibold uppercase text-aistroyka-text-tertiary">
              {type.replace(/_/g, " ")}
            </p>
            <p className="mt-aistroyka-1 text-aistroyka-title3 font-bold text-aistroyka-text-primary">{count}</p>
          </div>
        ))}
    </div>
  );
}

export function RomaQualityGraphClient() {
  const graph = getQualityGraph();
  const summary = getGraphSummary();
  const appSurfaces = getNodesByType("app_surface");
  const roles = getNodesByType("role");
  const testDomains = getNodesByType("test_domain");
  const risks = getNodesByType("risk");

  return (
    <section className="space-y-aistroyka-5" aria-label="ROMA Quality Graph">
      <Card className="p-aistroyka-5">
        <div className="flex flex-wrap items-start justify-between gap-aistroyka-3">
          <div>
            <h1 className="text-aistroyka-title2 font-bold tracking-tight text-aistroyka-text-primary">
              Quality Graph
            </h1>
            <p className="mt-aistroyka-2 max-w-3xl text-aistroyka-subheadline text-aistroyka-text-secondary">
              Deterministic dependency and quality model for AISTROYKA — product areas, APIs, mobile apps, risks, and
              required test domains. V1 is read-only; no automated execution.
            </p>
          </div>
          <div className="flex flex-wrap gap-aistroyka-2">
            <Badge variant="neutral">Read-only</Badge>
            <Badge variant="neutral">v1</Badge>
            <Badge variant="neutral">No execution</Badge>
          </div>
        </div>
        <dl className="mt-aistroyka-5 grid gap-aistroyka-4 sm:grid-cols-3">
          <div>
            <dt className="text-aistroyka-caption font-semibold uppercase text-aistroyka-text-tertiary">Nodes</dt>
            <dd className="mt-aistroyka-1 text-aistroyka-title3 font-bold text-aistroyka-text-primary">
              {summary.nodeCount}
            </dd>
          </div>
          <div>
            <dt className="text-aistroyka-caption font-semibold uppercase text-aistroyka-text-tertiary">Edges</dt>
            <dd className="mt-aistroyka-1 text-aistroyka-title3 font-bold text-aistroyka-text-primary">
              {summary.edgeCount}
            </dd>
          </div>
          <div>
            <dt className="text-aistroyka-caption font-semibold uppercase text-aistroyka-text-tertiary">Edge types</dt>
            <dd className="mt-aistroyka-1 text-aistroyka-subheadline text-aistroyka-text-secondary">10</dd>
          </div>
        </dl>
      </Card>

      <Card className="p-aistroyka-5">
        <h2 className="text-aistroyka-headline font-semibold text-aistroyka-text-primary">Nodes by type</h2>
        <div className="mt-aistroyka-4">
          <CountGrid counts={summary.countsByType} />
        </div>
      </Card>

      <NodeTable title="Critical product areas" nodes={summary.criticalProductAreas} />
      <NodeTable title="High-severity risks" nodes={summary.highRisks} />
      <NodeTable title="App surfaces" nodes={appSurfaces} />
      <NodeTable title="Roles" nodes={roles} />
      <NodeTable title="Test domain map" nodes={testDomains} />
      <NodeTable title="Risk map" nodes={risks} />

      <Card className="p-aistroyka-5">
        <h2 className="text-aistroyka-headline font-semibold text-aistroyka-text-primary">
          Example impact analysis
        </h2>
        <p className="mt-aistroyka-1 text-aistroyka-footnote text-aistroyka-text-tertiary">
          Static V1 examples — not live git diff. Demonstrates change → affected areas → tests → risks → release impact.
        </p>
        <div className="mt-aistroyka-4 space-y-aistroyka-4">
          {ROMA_QUALITY_GRAPH_EXAMPLE_CHANGES.map((example, index) => {
            const impact = analyzeChangeImpact(example);
            return (
              <div
                key={index}
                className="rounded-card border border-aistroyka-border-subtle bg-aistroyka-surface-raised px-aistroyka-4 py-aistroyka-3"
              >
                <p className="text-aistroyka-caption font-semibold uppercase text-aistroyka-text-tertiary">
                  Example {index + 1}
                </p>
                <p className="mt-aistroyka-1 font-mono text-aistroyka-footnote text-aistroyka-text-secondary">
                  {example.changedPaths.join(", ")}
                </p>
                <p className="mt-aistroyka-2 text-aistroyka-subheadline text-aistroyka-text-primary">
                  {impact.summary}
                </p>
                <dl className="mt-aistroyka-3 grid gap-aistroyka-2 sm:grid-cols-2 text-aistroyka-footnote">
                  <div>
                    <dt className="text-aistroyka-text-tertiary">Product areas</dt>
                    <dd className="text-aistroyka-text-secondary">{impact.productAreaIds.join(", ") || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-aistroyka-text-tertiary">Test domains</dt>
                    <dd className="text-aistroyka-text-secondary">{impact.testDomainIds.join(", ") || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-aistroyka-text-tertiary">Risks</dt>
                    <dd className="text-aistroyka-text-secondary">{impact.riskIds.join(", ") || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-aistroyka-text-tertiary">Release confidence</dt>
                    <dd>
                      <Badge
                        variant={
                          impact.releaseConfidenceImpact === "high"
                            ? "danger"
                            : impact.releaseConfidenceImpact === "medium"
                              ? "warning"
                              : "neutral"
                        }
                      >
                        {impact.releaseConfidenceImpact}
                      </Badge>
                    </dd>
                  </div>
                </dl>
              </div>
            );
          })}
        </div>
      </Card>

      <p className="text-aistroyka-footnote text-aistroyka-text-tertiary">
        Graph generated at {graph.generatedAt}. Execution disabled ({String(graph.executionEnabled)}).
      </p>
    </section>
  );
}
