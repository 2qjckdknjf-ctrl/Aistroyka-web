"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, Skeleton, EmptyState, Button, Input } from "@/components/ui";

interface BudgetSummary {
  planned_total: number;
  actual_total: number;
  variance_amount: number;
  currency: string;
  over_budget: boolean;
  item_count: number;
}

interface EstimateResult {
  id: string;
  source_type: string;
  work_categories: string[] | null;
  rough_range_min: number | null;
  rough_range_max: number | null;
  currency_hint: string | null;
  confidence: string;
  missing_data_reasons: string[] | null;
  assumption_notes: string | null;
  status: string;
  created_at: string;
}

interface SourceDocument {
  id: string;
  title: string;
  type: string;
  status: string;
}

interface EstimateSummary {
  project_id: string;
  tenant_id: string;
  budget_summary: BudgetSummary | null;
  latest_estimate_result: EstimateResult | null;
  estimate_results: EstimateResult[];
  source_documents: SourceDocument[];
}

async function fetchEstimateSummary(projectId: string): Promise<EstimateSummary> {
  const res = await fetch(`/api/v1/projects/${projectId}/estimate`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load estimate summary");
  const json = await res.json();
  return json.data;
}

async function runEstimateFromImage(
  projectId: string,
  imageUrl: string
): Promise<{ result: EstimateResult; summary: EstimateSummary }> {
  const res = await fetch(`/api/v1/projects/${projectId}/estimate/from-image`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ image_url: imageUrl }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error((json as { error?: string }).error ?? "Estimate failed");
  return json.data;
}

export function ProjectEstimatePanel({ projectId }: { projectId: string }) {
  const queryClient = useQueryClient();
  const [imageUrl, setImageUrl] = useState("");

  const { data: summary, isPending, isError, error } = useQuery({
    queryKey: ["project-estimate", projectId],
    queryFn: () => fetchEstimateSummary(projectId),
    enabled: !!projectId,
  });

  const fromImageMutation = useMutation({
    mutationFn: () => runEstimateFromImage(projectId, imageUrl),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-estimate", projectId] });
      setImageUrl("");
    },
  });

  if (isPending && !summary) {
    return (
      <div className="p-4">
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4">
        <p className="text-aistroyka-text-secondary">
          {error instanceof Error ? error.message : "Failed to load cost intelligence."}
        </p>
      </div>
    );
  }

  const budget = summary?.budget_summary ?? null;
  const latest = summary?.latest_estimate_result ?? null;
  const docs = summary?.source_documents ?? [];

  return (
    <div className="p-4 space-y-6">
      <p className="text-aistroyka-text-secondary text-sm">
        Rough cost intelligence from images and recorded budget. Not a precise or legally binding estimate.
      </p>

      {budget && (
        <Card className="border-l-4 border-l-aistroyka-info">
          <h3 className="font-medium text-aistroyka-text-primary">Recorded budget</h3>
          <p className="text-aistroyka-caption text-aistroyka-text-tertiary mt-1">
            From cost items (planned vs actual)
          </p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <span>
              Planned: {budget.planned_total.toLocaleString()} {budget.currency}
            </span>
            <span>
              Actual: {budget.actual_total.toLocaleString()} {budget.currency}
            </span>
            {budget.variance_amount !== 0 && (
              <span>
                Variance: {budget.variance_amount > 0 ? "+" : ""}
                {budget.variance_amount.toLocaleString()} {budget.currency}
              </span>
            )}
            <span>{budget.over_budget ? "Over budget" : "On budget"}</span>
          </div>
        </Card>
      )}

      {!budget && (
        <Card className="border-l-4 border-l-aistroyka-warning">
          <p className="text-aistroyka-text-secondary">
            No recorded budget yet. Add cost items in the Costs tab to compare with AI estimates.
          </p>
        </Card>
      )}

      {latest && (
        <Card className="border-l-4 border-l-aistroyka-accent">
          <h3 className="font-medium text-aistroyka-text-primary">Latest estimate (AI)</h3>
          <p className="text-aistroyka-caption text-aistroyka-text-tertiary mt-1">
            Source: {latest.source_type}
            {latest.created_at && (
              <> · {new Date(latest.created_at).toLocaleString()}</>
            )}
          </p>
          <div className="mt-2 space-y-1">
            {latest.rough_range_min != null && latest.rough_range_max != null && (
              <p>
                Rough range: {latest.rough_range_min.toLocaleString()} –{" "}
                {latest.rough_range_max.toLocaleString()}{" "}
                {latest.currency_hint ?? ""}
              </p>
            )}
            <p>
              Confidence: <strong>{latest.confidence}</strong>
            </p>
            {latest.work_categories?.length ? (
              <p>Work categories: {latest.work_categories.join(", ")}</p>
            ) : null}
            {latest.missing_data_reasons?.length ? (
              <p className="text-aistroyka-text-secondary text-sm">
                Missing / uncertain: {latest.missing_data_reasons.join("; ")}
              </p>
            ) : null}
            {latest.assumption_notes && (
              <p className="text-aistroyka-text-secondary text-sm">
                Assumptions: {latest.assumption_notes}
              </p>
            )}
          </div>
        </Card>
      )}

      {!latest && summary?.estimate_results?.length === 0 && (
        <Card>
          <EmptyState
            icon={<span className="text-2xl">📐</span>}
            title="No AI estimate yet"
            subtitle="Paste an image URL below and run cost estimate to get a rough range from this image."
          />
        </Card>
      )}

      <Card>
        <h3 className="font-medium text-aistroyka-text-primary">Estimate from image</h3>
        <p className="text-aistroyka-caption text-aistroyka-text-tertiary mt-1">
          Enter a publicly accessible image URL (construction site, drawing, or photo). The AI will return a rough cost range and confidence.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Input
            type="url"
            placeholder="https://…"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="min-w-[280px]"
            aria-label="Image URL"
          />
          <Button
            onClick={() => fromImageMutation.mutate()}
            disabled={!imageUrl.trim() || fromImageMutation.isPending}
          >
            {fromImageMutation.isPending ? "Running…" : "Run cost estimate"}
          </Button>
        </div>
        {fromImageMutation.isError && (
          <p className="mt-2 text-sm text-aistroyka-error">
            {fromImageMutation.error instanceof Error
              ? fromImageMutation.error.message
              : "Request failed"}
          </p>
        )}
      </Card>

      {docs.length > 0 && (
        <Card>
          <h3 className="font-medium text-aistroyka-text-primary">Source documents</h3>
          <p className="text-aistroyka-caption text-aistroyka-text-tertiary mt-1">
            Project documents that can be used for future estimate inputs (content extraction not yet supported).
          </p>
          <ul className="mt-2 list-disc list-inside text-sm text-aistroyka-text-secondary">
            {docs.map((d) => (
              <li key={d.id}>
                {d.title} ({d.type}, {d.status})
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
