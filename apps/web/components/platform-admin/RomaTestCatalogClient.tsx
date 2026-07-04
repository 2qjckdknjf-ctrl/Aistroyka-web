"use client";

import { useMemo, useState } from "react";
import { Card, Badge } from "@/components/ui";
import {
  getCatalogSummary,
  getReleaseCriticalTests,
  getTestCatalog,
  getTestsByDomain,
  ROMA_TEST_CATALOG_DOMAINS,
} from "@/lib/platform-admin/roma-test-catalog";
import type {
  RomaTestCatalogDomain,
  RomaTestCatalogItem,
  RomaTestCatalogPriority,
} from "@/lib/platform-admin/roma-test-catalog.types";

function priorityBadge(priority: RomaTestCatalogPriority): "danger" | "warning" | "neutral" {
  switch (priority) {
    case "p0":
      return "danger";
    case "p1":
      return "warning";
    default:
      return "neutral";
  }
}

function CatalogTable({ items }: { items: readonly RomaTestCatalogItem[] }) {
  if (items.length === 0) {
    return <p className="text-aistroyka-footnote text-aistroyka-text-tertiary">No entries for this filter.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[48rem] text-left text-aistroyka-footnote">
        <thead>
          <tr className="border-b border-aistroyka-border-subtle text-aistroyka-caption uppercase text-aistroyka-text-tertiary">
            <th className="py-aistroyka-2 pr-aistroyka-3 font-semibold">Test ID</th>
            <th className="py-aistroyka-2 pr-aistroyka-3 font-semibold">Title</th>
            <th className="py-aistroyka-2 pr-aistroyka-3 font-semibold">Category</th>
            <th className="py-aistroyka-2 pr-aistroyka-3 font-semibold">Priority</th>
            <th className="py-aistroyka-2 pr-aistroyka-3 font-semibold">Platforms</th>
            <th className="py-aistroyka-2 pr-aistroyka-3 font-semibold">Maturity</th>
            <th className="py-aistroyka-2 font-semibold">State</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.testId} className="border-b border-aistroyka-border-subtle/60 align-top">
              <td className="py-aistroyka-2 pr-aistroyka-3 font-mono text-aistroyka-caption text-aistroyka-text-tertiary">
                {item.testId}
              </td>
              <td className="py-aistroyka-2 pr-aistroyka-3">
                <p className="font-medium text-aistroyka-text-primary">{item.title}</p>
                <p className="mt-aistroyka-1 text-aistroyka-caption text-aistroyka-text-secondary">
                  {item.description}
                </p>
                {item.releaseCritical ? (
                  <Badge variant="danger" className="mt-aistroyka-1">
                    Release critical
                  </Badge>
                ) : null}
              </td>
              <td className="py-aistroyka-2 pr-aistroyka-3 text-aistroyka-text-secondary">{item.category}</td>
              <td className="py-aistroyka-2 pr-aistroyka-3">
                <Badge variant={priorityBadge(item.priority)}>{item.priority}</Badge>
              </td>
              <td className="py-aistroyka-2 pr-aistroyka-3 text-aistroyka-caption text-aistroyka-text-secondary">
                {item.supportedPlatforms.join(", ")}
              </td>
              <td className="py-aistroyka-2 pr-aistroyka-3">
                <Badge variant="neutral">{item.maturity}</Badge>
              </td>
              <td className="py-aistroyka-2">
                <Badge variant="neutral">{item.enabled ? "Enabled" : "Disabled"}</Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function RomaTestCatalogClient() {
  const catalog = getTestCatalog();
  const summary = getCatalogSummary();
  const releaseCritical = getReleaseCriticalTests();
  const [selectedDomain, setSelectedDomain] = useState<RomaTestCatalogDomain | "all">("all");

  const filteredItems = useMemo(() => {
    if (selectedDomain === "all") return catalog.items;
    return getTestsByDomain(selectedDomain);
  }, [catalog.items, selectedDomain]);

  return (
    <section className="space-y-aistroyka-5" aria-label="ROMA Test Catalog">
      <Card className="p-aistroyka-5">
        <div className="flex flex-wrap items-start justify-between gap-aistroyka-3">
          <div>
            <h1 className="text-aistroyka-title2 font-bold tracking-tight text-aistroyka-text-primary">
              Test Catalog
            </h1>
            <p className="mt-aistroyka-2 max-w-3xl text-aistroyka-subheadline text-aistroyka-text-secondary">
              Canonical registry of every test ROMA will know about — domains, priorities, graph links, and release
              gates. V1 registry only; all entries disabled; no execution controls.
            </p>
          </div>
          <div className="flex flex-wrap gap-aistroyka-2">
            <Badge variant="neutral">Read-only</Badge>
            <Badge variant="neutral">Execution disabled</Badge>
            <Badge variant="neutral">v1</Badge>
          </div>
        </div>

        <dl className="mt-aistroyka-5 grid gap-aistroyka-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-aistroyka-caption font-semibold uppercase text-aistroyka-text-tertiary">Total tests</dt>
            <dd className="mt-aistroyka-1 text-aistroyka-title3 font-bold text-aistroyka-text-primary">
              {summary.total}
            </dd>
          </div>
          <div>
            <dt className="text-aistroyka-caption font-semibold uppercase text-aistroyka-text-tertiary">
              Release critical
            </dt>
            <dd className="mt-aistroyka-1 text-aistroyka-title3 font-bold text-aistroyka-text-primary">
              {summary.releaseCriticalCount}
            </dd>
          </div>
          <div>
            <dt className="text-aistroyka-caption font-semibold uppercase text-aistroyka-text-tertiary">Enabled</dt>
            <dd className="mt-aistroyka-1 text-aistroyka-title3 font-bold text-aistroyka-text-primary">
              {summary.enabledCount}
            </dd>
          </div>
          <div>
            <dt className="text-aistroyka-caption font-semibold uppercase text-aistroyka-text-tertiary">Domains</dt>
            <dd className="mt-aistroyka-1 text-aistroyka-title3 font-bold text-aistroyka-text-primary">
              {ROMA_TEST_CATALOG_DOMAINS.length}
            </dd>
          </div>
        </dl>
      </Card>

      <Card className="p-aistroyka-5">
        <h2 className="text-aistroyka-headline font-semibold text-aistroyka-text-primary">Domains</h2>
        <div className="mt-aistroyka-4 grid gap-aistroyka-3 sm:grid-cols-2 lg:grid-cols-3">
          {ROMA_TEST_CATALOG_DOMAINS.map((domain) => (
            <button
              key={domain}
              type="button"
              onClick={() => setSelectedDomain(domain)}
              className={`rounded-card border px-aistroyka-3 py-aistroyka-2 text-left transition-colors ${
                selectedDomain === domain
                  ? "border-aistroyka-accent bg-aistroyka-accent/10"
                  : "border-aistroyka-border-subtle bg-aistroyka-surface-raised hover:border-aistroyka-accent/50"
              }`}
            >
              <p className="text-aistroyka-caption font-semibold uppercase text-aistroyka-text-tertiary">
                {domain.replace(/_/g, " ")}
              </p>
              <p className="mt-aistroyka-1 text-aistroyka-title3 font-bold text-aistroyka-text-primary">
                {summary.countsByDomain[domain]}
              </p>
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setSelectedDomain("all")}
          className={`mt-aistroyka-3 text-aistroyka-footnote font-medium ${
            selectedDomain === "all" ? "text-aistroyka-accent" : "text-aistroyka-text-secondary hover:text-aistroyka-accent"
          }`}
        >
          Show all domains ({summary.total})
        </button>
      </Card>

      <Card className="p-aistroyka-5">
        <h2 className="text-aistroyka-headline font-semibold text-aistroyka-text-primary">
          {selectedDomain === "all" ? "All catalog entries" : `Domain: ${selectedDomain.replace(/_/g, " ")}`}
        </h2>
        <div className="mt-aistroyka-4">
          <CatalogTable items={filteredItems} />
        </div>
      </Card>

      <Card className="p-aistroyka-5">
        <h2 className="text-aistroyka-headline font-semibold text-aistroyka-text-primary">Release-critical tests</h2>
        <p className="mt-aistroyka-1 text-aistroyka-footnote text-aistroyka-text-tertiary">
          Subset required for release readiness evaluation — still disabled for execution in V1.
        </p>
        <div className="mt-aistroyka-4">
          <CatalogTable items={releaseCritical} />
        </div>
      </Card>

      <p className="text-aistroyka-footnote text-aistroyka-text-tertiary">
        Catalog generated at {catalog.generatedAt}. Execution: {String(catalog.executionEnabled)}.
      </p>
    </section>
  );
}
