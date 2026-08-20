"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge, Button } from "@/components/ui";
import type { ClientRequestKind, ClientRequestManager } from "@/lib/domain/client-requests/client-requests.types";
import { DashboardGlassCard } from "@/components/dashboard/DashboardGlassCard";

async function fetchRequests(projectId: string): Promise<ClientRequestManager[]> {
  const res = await fetch(`/api/v1/projects/${projectId}/client-requests`, { credentials: "include" });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error((j as { error?: string }).error ?? "Failed to load");
  }
  const json = await res.json();
  return json.data ?? [];
}

export function ClientRequestsManagerPanel({ projectId }: { projectId: string }) {
  const tDetail = useTranslations("dashboardDetail");
  const queryClient = useQueryClient();
  const [openForm, setOpenForm] = useState(false);
  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [kind, setKind] = useState<ClientRequestKind>("feedback");
  const [actionMode, setActionMode] = useState<"action_required" | "info_only">("action_required");
  const [choiceLines, setChoiceLines] = useState("Option A\nOption B");
  const [linkType, setLinkType] = useState<"" | "document" | "milestone">("");
  const [linkId, setLinkId] = useState("");
  const KIND_OPTIONS: { value: ClientRequestKind; label: string }[] = [
    { value: "approve_or_reject", label: tDetail("requestKindApproveReject") },
    { value: "feedback", label: tDetail("requestKindFeedback") },
    { value: "acknowledge", label: tDetail("requestKindAcknowledge") },
    { value: "choice", label: tDetail("requestKindChoice") },
    { value: "document_review", label: tDetail("requestKindDocumentReview") },
  ];

  const listQuery = useQuery({
    queryKey: ["client-requests", projectId],
    queryFn: () => fetchRequests(projectId),
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const choice_options =
        kind === "choice"
          ? choiceLines
              .split("\n")
              .map((s) => s.trim())
              .filter(Boolean)
          : undefined;
      const res = await fetch(`/api/v1/projects/${projectId}/client-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          kind,
          title: title.trim(),
          instructions: instructions.trim() || null,
          action_mode: actionMode,
          choice_options,
          linked_entity_type: linkType || null,
          linked_entity_id: linkId.trim() || null,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error((j as { error?: string }).error ?? "Create failed");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-requests", projectId] });
      queryClient.invalidateQueries({ queryKey: ["client-project-view", projectId] });
      setOpenForm(false);
      setTitle("");
      setInstructions("");
      setKind("feedback");
      setActionMode("action_required");
      setChoiceLines("Option A\nOption B");
      setLinkType("");
      setLinkId("");
    },
  });

  const patchMutation = useMutation({
    mutationFn: async (args: { requestId: string; status: "completed" | "cancelled" }) => {
      const res = await fetch(`/api/v1/projects/${projectId}/client-requests/${args.requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: args.status }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error((j as { error?: string }).error ?? "Update failed");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-requests", projectId] });
      queryClient.invalidateQueries({ queryKey: ["client-project-view", projectId] });
    },
  });

  return (
    <DashboardGlassCard className="border-l-4 border-l-aistroyka-info p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-aistroyka-caption font-semibold uppercase tracking-wide text-aistroyka-text-tertiary">
            {tDetail("clientRequests")}
          </h3>
          <p className="mt-1 text-sm text-aistroyka-text-secondary">
            {tDetail("clientRequestsHint")}
          </p>
        </div>
        <Button type="button" size="sm" variant="secondary" onClick={() => setOpenForm((o) => !o)}>
          {openForm ? tDetail("closeForm") : tDetail("newRequest")}
        </Button>
      </div>

      {openForm ? (
        <div className="mt-4 space-y-3 rounded-lg border border-aistroyka-border-subtle p-3">
          <div>
            <label className="text-xs font-medium text-aistroyka-text-secondary">{tDetail("title")}</label>
            <input
              className="mt-1 w-full rounded border border-aistroyka-border-subtle bg-aistroyka-bg-elevated p-2 text-sm"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={tDetail("shortTitle")}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-aistroyka-text-secondary">{tDetail("instructions")}</label>
            <textarea
              className="mt-1 w-full rounded border border-aistroyka-border-subtle bg-aistroyka-bg-elevated p-2 text-sm"
              rows={3}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder={tDetail("whatNeedFromClient")}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-aistroyka-text-secondary">{tDetail("kind")}</label>
              <select
                className="mt-1 w-full rounded border border-aistroyka-border-subtle bg-aistroyka-bg-elevated p-2 text-sm"
                value={kind}
                onChange={(e) => setKind(e.target.value as ClientRequestKind)}
              >
                {KIND_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-aistroyka-text-secondary">{tDetail("mode")}</label>
              <select
                className="mt-1 w-full rounded border border-aistroyka-border-subtle bg-aistroyka-bg-elevated p-2 text-sm"
                value={actionMode}
                onChange={(e) => setActionMode(e.target.value as "action_required" | "info_only")}
              >
                <option value="action_required">{tDetail("actionRequired")}</option>
                <option value="info_only">{tDetail("informationOnly")}</option>
              </select>
            </div>
          </div>
          {kind === "choice" ? (
            <div>
              <label className="text-xs font-medium text-aistroyka-text-secondary">{tDetail("optionsOnePerLine")}</label>
              <textarea
                className="mt-1 w-full rounded border border-aistroyka-border-subtle bg-aistroyka-bg-elevated p-2 text-sm font-mono"
                rows={4}
                value={choiceLines}
                onChange={(e) => setChoiceLines(e.target.value)}
              />
            </div>
          ) : null}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-aistroyka-text-secondary">{tDetail("linkTypeOptional")}</label>
              <select
                className="mt-1 w-full rounded border border-aistroyka-border-subtle bg-aistroyka-bg-elevated p-2 text-sm"
                value={linkType}
                onChange={(e) => setLinkType(e.target.value as "" | "document" | "milestone")}
              >
                <option value="">{tDetail("none")}</option>
                <option value="document">{tDetail("document")}</option>
                <option value="milestone">{tDetail("milestone")}</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-aistroyka-text-secondary">{tDetail("linkedEntityId")}</label>
              <input
                className="mt-1 w-full rounded border border-aistroyka-border-subtle bg-aistroyka-bg-elevated p-2 text-sm font-mono"
                value={linkId}
                onChange={(e) => setLinkId(e.target.value)}
                placeholder={tDetail("uuid")}
                disabled={!linkType}
              />
            </div>
          </div>
          {createMutation.isError && createMutation.error instanceof Error ? (
            <p className="text-sm text-aistroyka-error" role="alert">
              {createMutation.error.message}
            </p>
          ) : null}
          <Button
            type="button"
            size="sm"
            loading={createMutation.isPending}
            disabled={title.trim().length < 1}
            onClick={() => createMutation.mutate()}
          >
            {tDetail("createRequest")}
          </Button>
        </div>
      ) : null}

      {listQuery.isPending ? (
        <p className="mt-3 text-sm text-aistroyka-text-tertiary">{tDetail("loading")}</p>
      ) : listQuery.isError ? (
        <p className="mt-3 text-sm text-aistroyka-error">{tDetail("couldNotLoadRequests")}</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {(listQuery.data ?? []).length === 0 ? (
            <li className="text-sm text-aistroyka-text-tertiary">{tDetail("noRequestsYet")}</li>
          ) : (
            (listQuery.data ?? []).map((r: ClientRequestManager) => (
              <li
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded border border-aistroyka-border-subtle px-3 py-2 text-sm"
              >
                <div>
                  <span className="font-medium text-aistroyka-text-primary">{r.title}</span>
                  <span className="ml-2 text-aistroyka-text-tertiary">
                    {r.kind.replace(/_/g, " ")} · {r.status}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-aistroyka-surface-raised text-aistroyka-text-secondary">{r.action_mode}</Badge>
                  {r.status === "open" && r.action_mode === "info_only" ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      disabled={patchMutation.isPending}
                      onClick={() => patchMutation.mutate({ requestId: r.id, status: "completed" })}
                    >
                      {tDetail("markComplete")}
                    </Button>
                  ) : null}
                  {r.status === "open" || r.status === "responded" ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled={patchMutation.isPending}
                      onClick={() => patchMutation.mutate({ requestId: r.id, status: "cancelled" })}
                    >
                      {tDetail("cancel")}
                    </Button>
                  ) : null}
                  {r.status === "responded" ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="primary"
                      disabled={patchMutation.isPending}
                      onClick={() => patchMutation.mutate({ requestId: r.id, status: "completed" })}
                    >
                      {tDetail("complete")}
                    </Button>
                  ) : null}
                </div>
              </li>
            ))
          )}
        </ul>
      )}
    </DashboardGlassCard>
  );
}
