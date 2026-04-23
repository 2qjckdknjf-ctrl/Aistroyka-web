"use client";

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, Badge, Button } from "@/components/ui";
import type { ClientRequestPublic } from "@/lib/domain/client-requests/client-requests.types";
import { clientRequestStatusBadgeClass, formatStatusLabel } from "../statusBadgeStyles";

function kindLabel(k: string): string {
  return k.replace(/_/g, " ");
}

export function ClientPortalRequestsSection({
  projectId,
  requests,
  canRespondToRequests,
}: {
  projectId: string;
  requests: ClientRequestPublic[];
  canRespondToRequests: boolean;
}) {
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
        `/api/v1/projects/${projectId}/client-requests/${args.requestId}/respond`,
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

  return (
    <Card className="p-4 border-l-4 border-l-aistroyka-info">
      <h3 className="font-semibold text-aistroyka-text-primary">Requests from your project team</h3>
      <p className="mt-1 text-sm text-aistroyka-text-secondary">
        Respond to explicit items below. This is not a chat — each request is tracked.
      </p>
      <ul className="mt-4 space-y-4">
        {requests.map((r) => (
          <li key={r.id} className="rounded-lg border border-aistroyka-border-subtle p-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-medium text-aistroyka-text-primary">{r.title}</p>
                <p className="text-xs text-aistroyka-text-tertiary mt-1">
                  {kindLabel(r.kind)} · {r.action_mode === "info_only" ? "Information" : "Action required"}
                </p>
                {r.instructions ? (
                  <p className="mt-2 text-sm text-aistroyka-text-secondary whitespace-pre-wrap">{r.instructions}</p>
                ) : null}
                {r.linked_entity_type ? (
                  <p className="mt-1 text-xs text-aistroyka-text-tertiary">
                    Linked: {r.linked_entity_type}
                    {r.linked_entity_id ? ` · ${r.linked_entity_id.slice(0, 8)}…` : ""}
                  </p>
                ) : null}
              </div>
              <Badge
                className={clientRequestStatusBadgeClass(r.status)}
              >
                {formatStatusLabel(r.status)}
              </Badge>
            </div>

            {r.status === "open" && r.action_mode === "action_required" && canRespondToRequests ? (
              expandedId === r.id ? (
                <div className="mt-3 space-y-3 border-t border-aistroyka-border-subtle pt-3">
                  {r.kind === "approve_or_reject" ? (
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="primary"
                        disabled={respondMutation.isPending}
                        onClick={() =>
                          respondMutation.mutate({ requestId: r.id, body: { decision: "approve", note: note || null } })
                        }
                      >
                        Approve
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
                        Reject
                      </Button>
                    </div>
                  ) : null}
                  {r.kind === "feedback" ? (
                    <div>
                      <label className="text-xs font-medium text-aistroyka-text-secondary">Your feedback</label>
                      <textarea
                        className="mt-1 w-full rounded border border-aistroyka-border-subtle bg-aistroyka-bg-elevated p-2 text-sm"
                        rows={3}
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                      />
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
                        Submit feedback
                      </Button>
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
                      I acknowledge
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
                        Submit choice
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
                      Confirm review
                    </Button>
                  ) : null}
                  <div>
                    <label className="text-xs text-aistroyka-text-tertiary">Optional note</label>
                    <input
                      type="text"
                      className="mt-1 w-full rounded border border-aistroyka-border-subtle bg-aistroyka-bg-elevated p-2 text-sm"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Add a short note"
                    />
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setExpandedId(null)}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button type="button" size="sm" className="mt-3" onClick={() => setExpandedId(r.id)}>
                  Respond
                </Button>
              )
            ) : null}

            {r.status !== "open" && r.response_value ? (
              <p className="mt-2 text-xs text-aistroyka-text-tertiary">
                Your response: {r.response_value}
                {r.response_note ? ` — ${r.response_note}` : ""}
              </p>
            ) : null}

            {respondMutation.isError && expandedId === r.id ? (
              <p className="mt-2 text-sm text-aistroyka-error" role="alert">
                {respondMutation.error instanceof Error ? respondMutation.error.message : "Error"}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </Card>
  );
}
