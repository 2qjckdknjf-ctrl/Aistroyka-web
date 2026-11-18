"use client";

/**
 * AIS-RULE-015 Manager UI — waterproofing trade completeness checklist.
 * Missing evidence → questions / INSUFFICIENT_EVIDENCE. Never workmanship PASS.
 */

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, EmptyState, Skeleton } from "@/components/ui";
import { CanonSurface } from "@/components/canon/CanonSurface";

type Template = {
  id: string;
  version: string;
  trade: string;
  requirement_count: number;
  jurisdiction_note: string;
};

type EvalItem = {
  requirementId: string;
  evidenceKind: string;
  severity: string;
  label: string;
  status: string;
  question: string | null;
};

type Evaluation = {
  templateId: string;
  templateVersion: string;
  trade: string;
  verdict: string;
  items: EvalItem[];
  questions: string[];
  missingRequiredCount: number;
  missingRecommendedCount: number;
};

const EVIDENCE_KINDS = [
  "contract_scope",
  "work_specification",
  "measured_quantity",
  "substrate_prep_record",
  "layer_thickness_record",
  "calibrated_photo",
  "material_datasheet",
  "inspection_checklist",
  "signoff_document",
] as const;

async function fetchTemplates(projectId: string): Promise<Template[]> {
  const res = await fetch(`/api/v1/projects/${projectId}/completeness/templates`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("FAILED_LOAD_TEMPLATES");
  const json = (await res.json()) as { data?: { templates?: Template[] } };
  return json.data?.templates ?? [];
}

async function evaluate(
  projectId: string,
  templateId: string,
  inventory: Array<{ evidence_kind: string; status: "present" | "unverified" }>
): Promise<Evaluation> {
  const res = await fetch(`/api/v1/projects/${projectId}/completeness/evaluate`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ template_id: templateId, inventory }),
  });
  const json = (await res.json()) as { data?: { evaluation?: Evaluation }; error?: string };
  if (!res.ok || !json.data?.evaluation) throw new Error(json.error ?? "EVAL_FAILED");
  return json.data.evaluation;
}

export function ProjectTradeCompletenessPanel({
  projectId,
  skin = "default",
}: {
  projectId: string;
  skin?: "default" | "canon";
}) {
  const t = useTranslations("dashboardDetail");
  const isCanon = skin === "canon";
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [lastEval, setLastEval] = useState<Evaluation | null>(null);

  const { data: templates, isPending, isError } = useQuery({
    queryKey: ["completeness-templates", projectId],
    queryFn: () => fetchTemplates(projectId),
    enabled: !!projectId,
  });

  const templateId = templates?.[0]?.id ?? "trade.waterproofing.wet_area";

  const inventory = useMemo(
    () =>
      EVIDENCE_KINDS.filter((kind) => selected[kind]).map((kind) => ({
        evidence_kind: kind,
        status: "present" as const,
      })),
    [selected]
  );

  const evalMutation = useMutation({
    mutationFn: () => evaluate(projectId, templateId, inventory),
    onSuccess: (evaluation) => {
      setLastEval(evaluation);
      queryClient.invalidateQueries({ queryKey: ["completeness-templates", projectId] });
    },
  });

  const body = (
    <div className="space-y-6 p-4">
      <div>
        <h2 className="text-lg font-semibold text-aistroyka-text-primary">
          {t("completenessTitle")}
        </h2>
        <p className="mt-1 text-sm text-aistroyka-text-secondary">{t("completenessSubtitle")}</p>
      </div>

      {isPending ? <Skeleton className="h-16 w-full" /> : null}
      {isError ? <p className="text-sm text-red-400">{t("completenessLoadFailed")}</p> : null}
      {!isPending && !isError && (templates?.length ?? 0) === 0 ? (
        <EmptyState
          icon={<span aria-hidden>◇</span>}
          title={t("completenessEmpty")}
          subtitle={t("completenessEmptyHint")}
        />
      ) : null}

      {(templates ?? []).map((tpl) => (
        <div key={tpl.id} className="rounded-md border border-aistroyka-border p-3 text-sm">
          <p className="font-medium text-aistroyka-text-primary">
            {tpl.trade} · v{tpl.version}
          </p>
          <p className="mt-1 text-aistroyka-text-secondary">{tpl.jurisdiction_note}</p>
          <p className="mt-1 text-xs text-aistroyka-text-secondary">
            {t("completenessRequirements", { count: tpl.requirement_count })}
          </p>
        </div>
      ))}

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-aistroyka-text-primary">
          {t("completenessInventory")}
        </legend>
        {EVIDENCE_KINDS.map((kind) => (
          <label key={kind} className="flex items-center gap-2 text-sm text-aistroyka-text-secondary">
            <input
              type="checkbox"
              checked={Boolean(selected[kind])}
              onChange={(e) =>
                setSelected((prev) => ({ ...prev, [kind]: e.target.checked }))
              }
            />
            <span>{t(`completenessKind_${kind}` as "completenessKind_contract_scope")}</span>
          </label>
        ))}
      </fieldset>

      <Button
        type="button"
        disabled={evalMutation.isPending}
        onClick={() => evalMutation.mutate()}
      >
        {evalMutation.isPending ? t("completenessEvaluating") : t("completenessEvaluate")}
      </Button>
      {evalMutation.isError ? (
        <p className="text-sm text-red-400" role="alert">
          {t("completenessEvalFailed")}
        </p>
      ) : null}

      {lastEval ? (
        <div className="space-y-3 rounded-md border border-aistroyka-border p-3">
          <p className="text-sm font-medium text-aistroyka-text-primary">
            {t("completenessVerdict")}: {lastEval.verdict}
          </p>
          <p className="text-xs text-aistroyka-text-secondary">{t("completenessNoPass")}</p>
          <ul className="space-y-2 text-sm">
            {lastEval.items.map((item) => (
              <li key={item.requirementId} className="border-t border-aistroyka-border pt-2">
                <p className="text-aistroyka-text-primary">
                  {item.label} · {item.status} ({item.severity})
                </p>
                {item.question ? (
                  <p className="text-aistroyka-text-secondary">{item.question}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );

  return <CanonSurface isCanon={isCanon}>{body}</CanonSurface>;
}
