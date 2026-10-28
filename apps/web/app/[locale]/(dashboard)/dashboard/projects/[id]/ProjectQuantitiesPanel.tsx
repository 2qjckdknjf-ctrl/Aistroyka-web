"use client";

/**
 * Stage2a A02 — Manager quantity panel.
 * Lists immutable InputSnapshots and creates a simple rectangle planned area request.
 * Never displays unit prices, costs, margin, or commercial totals (A05 / costs tab).
 */

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, EmptyState, Input, Skeleton } from "@/components/ui";
import { CanonSurface } from "@/components/canon/CanonSurface";

const PILOT_AREA_WORK_CODES = [
  "Q-PROT-AREA",
  "Q-DEMO-FLOOR",
  "Q-DEMO-WALL",
  "Q-WP-SYSTEM",
  "Q-TILE-FLOOR",
  "Q-TILE-WALL",
  "Q-MICROCEMENT",
  "Q-PAINT-WALL",
  "Q-PAINT-CEILING",
] as const;

type SnapshotRow = {
  id: string;
  work_code: string;
  quantity_kind: string;
  request_kind: string;
  request_hash: string;
  created_at: string;
};

type CalculationSummary = {
  id: string;
  revision: number;
  quantity: string | null;
  unit: string | null;
  quantity_basis: string | null;
  rule_id: string | null;
  rule_version: string;
  issues: string[];
  created_at: string;
};

async function fetchSnapshots(projectId: string): Promise<SnapshotRow[]> {
  const res = await fetch(`/api/v1/projects/${projectId}/quantities/snapshots?limit=50`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("FAILED_LOAD_QUANTITIES");
  const json = (await res.json()) as { data?: { snapshots?: SnapshotRow[] } };
  return json.data?.snapshots ?? [];
}

async function createRectangleSnapshot(input: {
  projectId: string;
  workCode: string;
  title: string;
  width: string;
  height: string;
}): Promise<{
  snapshot: SnapshotRow;
  calculation: CalculationSummary | null;
  created: boolean;
}> {
  const request = {
    kind: "area",
    rule_version: "1.0.0",
    work_code: input.workCode,
    quantity_kind: "planned",
    surfaces: [
      {
        id: "surface-1",
        shape: {
          kind: "rectangle",
          origin: { x: "0", y: "0" },
          width: input.width.trim(),
          height: input.height.trim(),
        },
        geometry_known: true,
        mapping_complete: true,
        deductions_complete: true,
        selection: "whole",
        zones: [],
        deductions: [],
      },
    ],
  };

  const res = await fetch(`/api/v1/projects/${input.projectId}/quantities/snapshots`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      request,
      title: input.title.trim() || input.workCode,
    }),
  });
  const json = (await res.json()) as {
    error?: string;
    code?: string;
    data?: {
      snapshot: SnapshotRow;
      calculation: CalculationSummary | null;
      created: boolean;
    };
  };
  if (!res.ok || !json.data) {
    throw new Error(json.code ?? json.error ?? "QUANTITY_CREATE_FAILED");
  }
  return json.data;
}

export function ProjectQuantitiesPanel({
  projectId,
  skin = "default",
}: {
  projectId: string;
  skin?: "default" | "canon";
}) {
  const t = useTranslations("dashboardDetail");
  const isCanon = skin === "canon";
  const queryClient = useQueryClient();
  const [workCode, setWorkCode] = useState<string>(PILOT_AREA_WORK_CODES[4]);
  const [title, setTitle] = useState("");
  const [width, setWidth] = useState("4.2");
  const [height, setHeight] = useState("2.1");
  const [lastResult, setLastResult] = useState<CalculationSummary | null>(null);

  const { data, isPending, isError } = useQuery({
    queryKey: ["project-quantities", projectId],
    queryFn: () => fetchSnapshots(projectId),
    enabled: !!projectId,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createRectangleSnapshot({
        projectId,
        workCode,
        title,
        width,
        height,
      }),
    onSuccess: (result) => {
      setLastResult(result.calculation);
      queryClient.invalidateQueries({ queryKey: ["project-quantities", projectId] });
    },
  });

  const body = (
    <div className="space-y-6 p-4">
      <div>
        <h2 className="text-lg font-semibold text-aistroyka-text-primary">
          {t("quantitiesTitle")}
        </h2>
        <p className="mt-1 text-sm text-aistroyka-text-secondary">{t("quantitiesSubtitle")}</p>
      </div>

      <form
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
        onSubmit={(event) => {
          event.preventDefault();
          createMutation.mutate();
        }}
      >
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-aistroyka-text-secondary">{t("quantitiesWorkCode")}</span>
          <select
            className="rounded-md border border-aistroyka-border bg-transparent px-3 py-2"
            value={workCode}
            onChange={(e) => setWorkCode(e.target.value)}
          >
            {PILOT_AREA_WORK_CODES.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-aistroyka-text-secondary">{t("quantitiesTitleField")}</span>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={workCode}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-aistroyka-text-secondary">{t("quantitiesWidthM")}</span>
          <Input value={width} onChange={(e) => setWidth(e.target.value)} inputMode="decimal" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-aistroyka-text-secondary">{t("quantitiesHeightM")}</span>
          <Input value={height} onChange={(e) => setHeight(e.target.value)} inputMode="decimal" />
        </label>
        <div className="sm:col-span-2 lg:col-span-4">
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? t("quantitiesSaving") : t("quantitiesCompute")}
          </Button>
        </div>
      </form>

      {createMutation.isError ? (
        <p className="text-sm text-red-400" role="alert">
          {t("quantitiesCreateFailed")}
        </p>
      ) : null}

      {lastResult ? (
        <div className="rounded-md border border-aistroyka-border p-3 text-sm">
          <p className="font-medium text-aistroyka-text-primary">{t("quantitiesLastResult")}</p>
          <p className="mt-1 text-aistroyka-text-secondary">
            {lastResult.quantity != null
              ? `${lastResult.quantity} ${lastResult.unit ?? ""}`.trim()
              : t("quantitiesNoQuantity")}
            {lastResult.issues.length > 0
              ? ` · ${t("quantitiesIssues")}: ${lastResult.issues.join(", ")}`
              : ""}
          </p>
        </div>
      ) : null}

      <div>
        <h3 className="mb-2 text-sm font-medium text-aistroyka-text-primary">
          {t("quantitiesSnapshots")}
        </h3>
        {isPending ? <Skeleton className="h-24 w-full" /> : null}
        {isError ? (
          <p className="text-sm text-red-400">{t("quantitiesLoadFailed")}</p>
        ) : null}
        {!isPending && !isError && (data?.length ?? 0) === 0 ? (
          <EmptyState
            icon={<span aria-hidden>◇</span>}
            title={t("quantitiesEmpty")}
            subtitle={t("quantitiesEmptyHint")}
          />
        ) : null}
        {!isPending && !isError && (data?.length ?? 0) > 0 ? (
          <ul className="divide-y divide-aistroyka-border rounded-md border border-aistroyka-border">
            {data!.map((row) => (
              <li key={row.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm">
                <div>
                  <p className="font-medium text-aistroyka-text-primary">{row.work_code}</p>
                  <p className="text-aistroyka-text-secondary">
                    {row.quantity_kind} · {row.request_kind} · {row.request_hash.slice(0, 12)}…
                  </p>
                </div>
                <time className="text-xs text-aistroyka-text-secondary" dateTime={row.created_at}>
                  {new Date(row.created_at).toLocaleString()}
                </time>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );

  if (isCanon) {
    return <CanonSurface>{body}</CanonSurface>;
  }
  return body;
}
