"use client";

/**
 * Stage2a A02/A04/A05 — Manager quantity panel.
 * Lists immutable InputSnapshots, records human acceptance (A04), and may bind
 * contractor-internal cost-input commercial lines (A05). Never shows margin,
 * profitability, or portal-facing commercial artifacts.
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

type AcceptanceState = {
  id: string;
  decision: string;
  commercially_bindable: boolean;
};

/** commercial.stage2a.v1 requires six fractional digits. */
function toCommercialQuantity(value: string): string | null {
  const trimmed = value.trim();
  if (!/^(0|[1-9][0-9]*)(\.[0-9]+)?$/.test(trimmed)) return null;
  const [whole, frac = ""] = trimmed.split(".");
  return `${whole}.${frac.padEnd(6, "0").slice(0, 6)}`;
}

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

async function postAcceptance(input: {
  projectId: string;
  calculationId: string;
  decision: "accepted" | "rejected" | "insufficient_basis";
}): Promise<AcceptanceState> {
  const res = await fetch(
    `/api/v1/projects/${input.projectId}/quantities/calculations/${input.calculationId}/acceptance`,
    {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision: input.decision }),
    }
  );
  const json = (await res.json()) as {
    error?: string;
    code?: string;
    data?: AcceptanceState;
  };
  if (!res.ok || !json.data) {
    throw new Error(json.code ?? json.error ?? "ACCEPTANCE_FAILED");
  }
  return json.data;
}

async function postCommercialBind(input: {
  projectId: string;
  acceptanceId: string;
  quantity: string;
  unit: "m2" | "m" | "ea";
  quantityBasis: "physical_net" | "system_area" | "joint_length" | "element_count";
  workSpecHash: string;
  numeratorMinor: string;
}): Promise<{ id: string }> {
  const context = {
    work_spec_hash: input.workSpecHash,
    unit: input.unit,
    purpose: "work" as const,
    quantity_basis: input.quantityBasis,
    component_id: null,
  };
  const commercial = {
    currency: "EUR",
    quantity: { value: input.quantity, context },
    price: {
      price_use: "cost_input",
      context,
      rate: {
        numerator_minor: input.numeratorMinor.trim(),
        denominator_quantity: "1.000000",
        unit: input.unit,
        currency: "EUR",
        tax_treatment: "excluded",
      },
    },
    minimum_billable_quantity: null,
    fixed_charges: [],
    markup_bps: "0",
    discount: { kind: "none" },
    tax_bps: "0",
  };

  const res = await fetch(
    `/api/v1/projects/${input.projectId}/quantities/acceptances/${input.acceptanceId}/commercial-bind`,
    {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commercial }),
    }
  );
  const json = (await res.json()) as {
    error?: string;
    code?: string;
    data?: { id: string };
  };
  if (!res.ok || !json.data?.id) {
    throw new Error(json.code ?? json.error ?? "COMMERCIAL_BIND_FAILED");
  }
  return { id: json.data.id };
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
  const [workSpecHash, setWorkSpecHash] = useState<string | null>(null);
  const [acceptance, setAcceptance] = useState<AcceptanceState | null>(null);
  const [costNumeratorMinor, setCostNumeratorMinor] = useState("1999");
  const [bindingId, setBindingId] = useState<string | null>(null);

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
      setWorkSpecHash(
        /^[a-f0-9]{64}$/.test(result.snapshot.request_hash)
          ? result.snapshot.request_hash
          : null
      );
      setAcceptance(null);
      setBindingId(null);
      queryClient.invalidateQueries({ queryKey: ["project-quantities", projectId] });
    },
  });

  const acceptMutation = useMutation({
    mutationFn: (decision: "accepted" | "rejected" | "insufficient_basis") => {
      if (!lastResult?.id) throw new Error("NO_CALCULATION");
      return postAcceptance({
        projectId,
        calculationId: lastResult.id,
        decision,
      });
    },
    onSuccess: (result) => {
      setAcceptance(result);
      setBindingId(null);
    },
  });

  const bindMutation = useMutation({
    mutationFn: () => {
      if (!acceptance?.id || !lastResult || !workSpecHash) throw new Error("NO_ACCEPTANCE");
      const unit = (lastResult.unit === "m" || lastResult.unit === "ea" ? lastResult.unit : "m2") as
        | "m2"
        | "m"
        | "ea";
      const quantityBasis = (
        lastResult.quantity_basis === "system_area" ||
        lastResult.quantity_basis === "joint_length" ||
        lastResult.quantity_basis === "element_count"
          ? lastResult.quantity_basis
          : "physical_net"
      ) as "physical_net" | "system_area" | "joint_length" | "element_count";
      const quantity = lastResult.quantity
        ? toCommercialQuantity(lastResult.quantity)
        : null;
      if (!quantity) throw new Error("NO_QUANTITY");
      return postCommercialBind({
        projectId,
        acceptanceId: acceptance.id,
        quantity,
        unit,
        quantityBasis,
        workSpecHash,
        numeratorMinor: costNumeratorMinor,
      });
    },
    onSuccess: (result) => {
      setBindingId(result.id);
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
        <div className="space-y-3 rounded-md border border-aistroyka-border p-3 text-sm">
          <div>
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

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              disabled={acceptMutation.isPending || !!acceptance}
              onClick={() => acceptMutation.mutate("accepted")}
            >
              {t("quantitiesAccept")}
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={acceptMutation.isPending || !!acceptance}
              onClick={() => acceptMutation.mutate("rejected")}
            >
              {t("quantitiesReject")}
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={acceptMutation.isPending || !!acceptance}
              onClick={() => acceptMutation.mutate("insufficient_basis")}
            >
              {t("quantitiesInsufficient")}
            </Button>
          </div>
          {acceptMutation.isError ? (
            <p className="text-sm text-red-400" role="alert">
              {t("quantitiesAcceptFailed")}
            </p>
          ) : null}
          {acceptance ? (
            <p className="text-aistroyka-text-secondary">
              {t("quantitiesAcceptanceRecorded", { decision: acceptance.decision })}
              {acceptance.commercially_bindable
                ? ` · ${t("quantitiesCommerciallyBindable")}`
                : ` · ${t("quantitiesNotCommerciallyBindable")}`}
            </p>
          ) : null}

          {acceptance?.commercially_bindable && !bindingId ? (
            <form
              className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end"
              onSubmit={(event) => {
                event.preventDefault();
                bindMutation.mutate();
              }}
            >
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-aistroyka-text-secondary">
                  {t("quantitiesCostNumeratorMinor")}
                </span>
                <Input
                  value={costNumeratorMinor}
                  onChange={(e) => setCostNumeratorMinor(e.target.value)}
                  inputMode="numeric"
                  autoComplete="off"
                />
              </label>
              <Button type="submit" disabled={bindMutation.isPending || !workSpecHash}>
                {bindMutation.isPending
                  ? t("quantitiesBinding")
                  : t("quantitiesBindCommercial")}
              </Button>
              <p className="sm:col-span-2 text-xs text-aistroyka-text-secondary">
                {t("quantitiesBindHint")}
              </p>
              {bindMutation.isError ? (
                <p className="sm:col-span-2 text-sm text-red-400" role="alert">
                  {t("quantitiesBindFailed")}
                </p>
              ) : null}
            </form>
          ) : null}
          {bindingId ? (
            <p className="text-aistroyka-text-secondary">
              {t("quantitiesBindRecorded")}
            </p>
          ) : null}
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

  return <CanonSurface isCanon={isCanon}>{body}</CanonSurface>;
}
