"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge, Button } from "@/components/ui";
import type { ClientRequestPublic } from "@/lib/domain/client-requests/client-requests.types";
import { clientRequestStatusBadgeClass } from "../statusBadgeStyles";
import { formatPortalStatus } from "@/lib/i18n/portal-status-labels";
import { DashboardGlassCard } from "@/components/dashboard/DashboardGlassCard";

function kindLabel(k: string): string {
  return k.replace(/_/g, " ");
}

export function ClientPortalRequestsSection({
  projectId,
  requests,
  canRespondToRequests,
  surface = "default",
}: {
  projectId: string;
  requests: ClientRequestPublic[];
  canRespondToRequests: boolean;
  surface?: "default" | "canon";
}) {
  const tDetail = useTranslations("dashboardDetail");
  const tPortal = useTranslations("portalStatus");
  const queryClient = useQueryClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [note, setNote] = useState("");
  const [choiceIdx, setChoiceIdx] = useState<number | null>(null);

  useEffect(() => {
    setNote("");
    setFeedbackText("");
    setChoiceIdx(null);
  }, [expandedId]);

  const respondMutation = useMutation({
    mutationFn: async (args: { requestId: string; body: Record<string, unknown> }) => {
      const res = await fetch(
        `/api/v1/portal/projects/${projectId}/decisions/${args.requestId}/respond`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(args.body),
        }
      );
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error((j as { error?: string }).error ?? "Failed to submit");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-project-view", projectId] });
      setExpandedId(null);
      setFeedbackText("");
      setNote("");
    },
  });

  if (requests.length === 0) {
    return null;
  }

  const isCanon = surface === "canon";
  const shellClass = isCanon
    ? "canon-glass p-4 border-l-4 border-l-[var(--canon-cyan)]"
    : "p-4 border-l-4 border-l-aistroyka-info";
  const headingClass = isCanon
    ? "font-semibold text-[var(--canon-text-primary)]"
    : "font-semibold text-aistroyka-text-primary";
  const itemClass = isCanon
    ? "rounded-lg border border-[var(--canon-border-glass)] p-3"
    : "rounded-lg border border-aistroyka-border-subtle p-3";
  const fieldClass = isCanon ? "canon-field mt-1 w-full" : "mt-1 w-full rounded border border-aistroyka-border-subtle bg-aistroyka-bg-elevated p-2 text-sm";

  const content = (
    <>
      <h3 className={headingClass}>{tDetail("requestsFromYourProjectTeam")}</h3>
      <p className={isCanon ? "mt-1 text-sm text-[var(--canon-text-secondary)]" : "mt-1 text-sm text-aistroyka-text-secondary"}>
        {tDetail("requestsFromTeamHint")}
      </p>
      <ul className="mt-4 space-y-4">
        {requests.map((r) => (
          <li key={r.id} className={itemClass}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-medium text-aistroyka-text-primary">{r.title}</p>
                <p className="text-xs text-aistroyka-text-tertiary mt-1">
                  {kindLabel(r.kind)} · {r.action_mode === "info_only" ? tDetail("information") : tDetail("actionRequired")}
                </p>
                {r.instructions ? (
                  <p className="mt-2 text-sm text-aistroyka-text-secondary whitespace-pre-wrap">{r.instructions}</p>
                ) : null}
                {r.linked_entity_type ? (
                  <p className="mt-1 text-xs text-aistroyka-text-tertiary">
                    {tDetail("linked")}: {r.linked_entity_type}
                    {r.linked_entity_id ? ` · ${r.linked_entity_id.slice(0, 8)}…` : ""}
                  </p>
                ) : null}
              </div>
              <Badge
                className={clientRequestStatusBadgeClass(r.status)}
              >
                {formatPortalStatus(r.status, "clientRequest", tPortal)}
              </Badge>
            </div>

            {r.status === "open" && r.action_mode === "action_required" && canRespondToRequests ? (
              expandedId === r.id ? (
                <div className={`mt-3 space-y-3 border-t pt-3 ${isCanon ? "border-[var(--canon-border-glass)]" : "border-aistroyka-border-subtle"}`}>
                  {r.kind === "approve_or_reject" ? (
                    <div className="flex flex-wrap gap-2">
                      {isCanon ? (
                        <>
                          <button
                            type="button"
                            className="canon-gold-btn !text-xs"
                            disabled={respondMutation.isPending}
                            onClick={() =>
                              respondMutation.mutate({ requestId: r.id, body: { decision: "approve", note: note || null } })
                            }
                          >
                            {tDetail("approve")}
                          </button>
                          <button
                            type="button"
                            className="canon-ghost-btn !text-xs"
                            disabled={respondMutation.isPending}
                            onClick={() =>
                              respondMutation.mutate({ requestId: r.id, body: { decision: "reject", note: note || null } })
                            }
                          >
                            {tDetail("reject")}
                          </button>
                        </>
                      ) : (
                        <>
                          <Button
                            type="button"
                            size="sm"
                            variant="primary"
                            disabled={respondMutation.isPending}
                            onClick={() =>
                              respondMutation.mutate({ requestId: r.id, body: { decision: "approve", note: note || null } })
                            }
                          >
                            {tDetail("approve")}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            disabled={respondMutation.isPending}
                            onClick={() =>
                              respondMutation.mutate({ requestId: r.id, body: { decision: "reject", note: note || null } })
                            }
                          >
                            {tDetail("reject")}
                          </Button>
                        </>
                      )}
                    </div>
                  ) : null}
                  {r.kind === "feedback" ? (
                    <div>
                      <label className={isCanon ? "text-xs font-medium text-[var(--canon-text-secondary)]" : "text-xs font-medium text-aistroyka-text-secondary"}>
                        {tDetail("yourFeedback")}
                      </label>
                      <textarea
                        className={`${fieldClass} min-h-[72px]`}
                        rows={3}
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                      />
                      {isCanon ? (
                        <button
                          type="button"
                          className="canon-gold-btn !text-xs mt-2"
                          disabled={respondMutation.isPending || feedbackText.trim().length < 1}
                          onClick={() =>
                            respondMutation.mutate({
                              requestId: r.id,
                              body: { feedback_text: feedbackText.trim(), note: note || null },
                            })
                          }
                        >
                          {tDetail("submitFeedback")}
                        </button>
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          className="mt-2"
                          disabled={respondMutation.isPending || feedbackText.trim().length < 1}
                          onClick={() =>
                            respondMutation.mutate({
                              requestId: r.id,
                              body: { feedback_text: feedbackText.trim(), note: note || null },
                            })
                          }
                        >
                          {tDetail("submitFeedback")}
                        </Button>
                      )}
                    </div>
                  ) : null}
                  {r.kind === "acknowledge" ? (
                    <Button
                      type="button"
                      size="sm"
                      disabled={respondMutation.isPending}
                      onClick={() =>
                        respondMutation.mutate({ requestId: r.id, body: { acknowledged: true, note: note || null } })
                      }
                    >
                      {tDetail("iAcknowledge")}
                    </Button>
                  ) : null}
                  {r.kind === "choice" && r.choice_options ? (
                    <div className="space-y-2">
                      {r.choice_options.map((opt, idx) => (
                        <label key={idx} className="flex items-center gap-2 text-sm">
                          <input
                            type="radio"
                            name={`choice-${r.id}`}
                            checked={choiceIdx === idx}
                            onChange={() => setChoiceIdx(idx)}
                          />
                          {opt}
                        </label>
                      ))}
                      <Button
                        type="button"
                        size="sm"
                        disabled={choiceIdx == null || respondMutation.isPending}
                        onClick={() =>
                          respondMutation.mutate({
                            requestId: r.id,
                            body: { choice_index: choiceIdx!, note: note || null },
                          })
                        }
                      >
                        {tDetail("submitChoice")}
                      </Button>
                    </div>
                  ) : null}
                  {r.kind === "document_review" ? (
                    <Button
                      type="button"
                      size="sm"
                      disabled={respondMutation.isPending}
                      onClick={() =>
                        respondMutation.mutate({
                          requestId: r.id,
                          body: { document_review_confirmed: true, note: note || null },
                        })
                      }
                    >
                      {tDetail("confirmReview")}
                    </Button>
                  ) : null}
                  <div>
                    <label className="text-xs text-aistroyka-text-tertiary">{tDetail("optionalNote")}</label>
                    <input
                      type="text"
                      className="mt-1 w-full rounded border border-aistroyka-border-subtle bg-aistroyka-bg-elevated p-2 text-sm"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder={tDetail("addShortNote")}
                    />
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setExpandedId(null)}>
                    {tDetail("cancel")}
                  </Button>
                </div>
              ) : isCanon ? (
                <button type="button" className="canon-gold-btn !text-xs mt-3" onClick={() => setExpandedId(r.id)}>
                  {tDetail("respond")}
                </button>
              ) : (
                <Button type="button" size="sm" className="mt-3" onClick={() => setExpandedId(r.id)}>
                  {tDetail("respond")}
                </Button>
              )
            ) : null}

            {r.status !== "open" && r.response_value ? (
              <p className="mt-2 text-xs text-aistroyka-text-tertiary">
                {tDetail("yourResponse")} {r.response_value}
                {r.response_note ? ` — ${r.response_note}` : ""}
              </p>
            ) : null}

            {respondMutation.isError && expandedId === r.id ? (
              <p className="mt-2 text-sm text-aistroyka-error" role="alert">
                {respondMutation.error instanceof Error ? respondMutation.error.message : tDetail("error")}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </>
  );

  if (isCanon) {
    return (
      <div id="portal-client-requests" className={shellClass}>
        {content}
      </div>
    );
  }

  return <DashboardGlassCard className={shellClass}>{content}</DashboardGlassCard>;
}
