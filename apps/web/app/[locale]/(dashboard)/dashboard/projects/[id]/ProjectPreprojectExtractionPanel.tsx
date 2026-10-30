"use client";

/**
 * AIS-CLIENT-005A Manager review UI for heuristic preproject observations.
 * No prices/margin. Accept/reject/edit only — no auto promote/estimate.
 * Optional intake draft picker binds extraction to a stable intake_draft_id.
 */

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, EmptyState, Input, Skeleton } from "@/components/ui";
import { CanonSurface } from "@/components/canon/CanonSurface";

type Observation = {
  id: string;
  kind: string;
  label: string;
  uncertainty: string;
  review_status: string;
  created_at: string;
};

type Run = {
  id: string;
  status: string;
  source_kind: string;
  created_at: string;
  observations: Observation[];
};

type IntakeDraftOption = {
  id: string;
  title: string;
  description: string;
  status: string;
};

async function fetchRuns(projectId: string): Promise<Run[]> {
  const res = await fetch(`/api/v1/projects/${projectId}/preproject/extractions`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("FAILED_LOAD_EXTRACTIONS");
  const json = (await res.json()) as { data?: { runs?: Run[] } };
  return json.data?.runs ?? [];
}

async function fetchIntakeDrafts(projectId: string): Promise<IntakeDraftOption[]> {
  const res = await fetch(`/api/v1/projects/${projectId}/intake-drafts`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("FAILED_LOAD_INTAKES");
  const json = (await res.json()) as { data?: { drafts?: IntakeDraftOption[] } };
  return json.data?.drafts ?? [];
}

async function createRun(
  projectId: string,
  text: string,
  intakeDraftId: string | null
): Promise<Run> {
  const res = await fetch(`/api/v1/projects/${projectId}/preproject/extractions`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text,
      ...(intakeDraftId ? { intake_draft_id: intakeDraftId } : {}),
    }),
  });
  const json = (await res.json()) as { data?: Run; error?: string };
  if (!res.ok || !json.data) throw new Error(json.error ?? "CREATE_FAILED");
  return json.data;
}

async function reviewObservation(
  observationId: string,
  status: "accepted" | "rejected" | "edited",
  editedLabel?: string
): Promise<void> {
  const res = await fetch(`/api/v1/preproject/observations/${observationId}/review`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      status,
      ...(status === "edited" ? { edited_label: editedLabel } : {}),
    }),
  });
  if (!res.ok) {
    const json = (await res.json()) as { error?: string };
    throw new Error(json.error ?? "REVIEW_FAILED");
  }
}

export function ProjectPreprojectExtractionPanel({
  projectId,
  skin = "default",
}: {
  projectId: string;
  skin?: "default" | "canon";
}) {
  const t = useTranslations("dashboardDetail");
  const isCanon = skin === "canon";
  const queryClient = useQueryClient();
  const [text, setText] = useState("");
  const [selectedDraftId, setSelectedDraftId] = useState<string>("");
  const [editLabels, setEditLabels] = useState<Record<string, string>>({});

  const { data, isPending, isError } = useQuery({
    queryKey: ["preproject-extractions", projectId],
    queryFn: () => fetchRuns(projectId),
    enabled: !!projectId,
  });

  const intakesQuery = useQuery({
    queryKey: ["project-intake-drafts", projectId],
    queryFn: () => fetchIntakeDrafts(projectId),
    enabled: !!projectId,
  });

  const createMutation = useMutation({
    mutationFn: () => createRun(projectId, text, selectedDraftId || null),
    onSuccess: () => {
      setText("");
      setSelectedDraftId("");
      queryClient.invalidateQueries({ queryKey: ["preproject-extractions", projectId] });
    },
  });

  const reviewMutation = useMutation({
    mutationFn: (args: {
      id: string;
      status: "accepted" | "rejected" | "edited";
      label?: string;
    }) => reviewObservation(args.id, args.status, args.label),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["preproject-extractions", projectId] });
    },
  });

  const body = (
    <div className="space-y-6 p-4">
      <div>
        <h2 className="text-lg font-semibold text-aistroyka-text-primary">
          {t("preprojectTitle")}
        </h2>
        <p className="mt-1 text-sm text-aistroyka-text-secondary">{t("preprojectSubtitle")}</p>
      </div>

      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          createMutation.mutate();
        }}
      >
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-aistroyka-text-secondary">{t("preprojectIntakeDraft")}</span>
          <select
            className="rounded-md border border-aistroyka-border bg-transparent px-3 py-2"
            value={selectedDraftId}
            onChange={(e) => {
              const id = e.target.value;
              setSelectedDraftId(id);
              const draft = (intakesQuery.data ?? []).find((d) => d.id === id);
              if (draft?.description) setText(draft.description);
            }}
            disabled={intakesQuery.isPending}
          >
            <option value="">{t("preprojectIntakeNone")}</option>
            {(intakesQuery.data ?? []).map((draft) => (
              <option key={draft.id} value={draft.id}>
                {draft.title} ({draft.status})
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-aistroyka-text-secondary">{t("preprojectText")}</span>
          <textarea
            className="min-h-[96px] rounded-md border border-aistroyka-border bg-transparent px-3 py-2"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t("preprojectTextPlaceholder")}
          />
        </label>
        <Button type="submit" disabled={createMutation.isPending || !text.trim()}>
          {createMutation.isPending ? t("preprojectRunning") : t("preprojectRun")}
        </Button>
        {createMutation.isError ? (
          <p className="text-sm text-red-400" role="alert">
            {t("preprojectCreateFailed")}
          </p>
        ) : null}
      </form>

      <div>
        <h3 className="mb-2 text-sm font-medium text-aistroyka-text-primary">
          {t("preprojectRuns")}
        </h3>
        {isPending ? <Skeleton className="h-24 w-full" /> : null}
        {isError ? <p className="text-sm text-red-400">{t("preprojectLoadFailed")}</p> : null}
        {!isPending && !isError && (data?.length ?? 0) === 0 ? (
          <EmptyState
            icon={<span aria-hidden>◇</span>}
            title={t("preprojectEmpty")}
            subtitle={t("preprojectEmptyHint")}
          />
        ) : null}
        <ul className="space-y-4">
          {(data ?? []).map((run) => (
            <li key={run.id} className="rounded-md border border-aistroyka-border p-3">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="font-medium text-aistroyka-text-primary">
                  {run.source_kind} · {run.status}
                </span>
                <time className="text-xs text-aistroyka-text-secondary" dateTime={run.created_at}>
                  {new Date(run.created_at).toLocaleString()}
                </time>
              </div>
              <ul className="divide-y divide-aistroyka-border">
                {run.observations.map((obs) => (
                  <li
                    key={obs.id}
                    className="flex flex-col gap-2 py-2 text-sm sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-medium text-aistroyka-text-primary">
                        {obs.kind}: {obs.label}
                      </p>
                      <p className="text-aistroyka-text-secondary">
                        {obs.review_status} · {t("preprojectUncertainty")}: {obs.uncertainty}
                      </p>
                    </div>
                    {obs.review_status === "pending" ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          type="button"
                          disabled={reviewMutation.isPending}
                          onClick={() =>
                            reviewMutation.mutate({ id: obs.id, status: "accepted" })
                          }
                        >
                          {t("preprojectAccept")}
                        </Button>
                        <Button
                          type="button"
                          disabled={reviewMutation.isPending}
                          onClick={() =>
                            reviewMutation.mutate({ id: obs.id, status: "rejected" })
                          }
                        >
                          {t("preprojectReject")}
                        </Button>
                        <Input
                          className="w-40"
                          value={editLabels[obs.id] ?? obs.label}
                          onChange={(e) =>
                            setEditLabels((prev) => ({ ...prev, [obs.id]: e.target.value }))
                          }
                        />
                        <Button
                          type="button"
                          disabled={reviewMutation.isPending}
                          onClick={() =>
                            reviewMutation.mutate({
                              id: obs.id,
                              status: "edited",
                              label: editLabels[obs.id] ?? obs.label,
                            })
                          }
                        >
                          {t("preprojectEdit")}
                        </Button>
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );

  return <CanonSurface isCanon={isCanon}>{body}</CanonSurface>;
}
