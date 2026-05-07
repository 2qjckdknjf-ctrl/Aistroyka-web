"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui";
import type { CustomerEstimatePublic } from "@/lib/domain/customer-estimates/customer-estimates.types";

export function ClientPortalCustomerEstimatesSection({
  projectId,
  estimates,
  canRespond,
}: {
  projectId: string;
  estimates: CustomerEstimatePublic[];
  canRespond: boolean;
}) {
  const t = useTranslations("dashboardDetail");
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState<Record<string, string>>({});

  const respondMutation = useMutation({
    mutationFn: async (args: { estimateId: string; decision: "approve" | "reject" }) => {
      const res = await fetch(`/api/v1/projects/${projectId}/estimates/${args.estimateId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          decision: args.decision,
          note: notes[args.estimateId]?.trim() || null,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error((j as { error?: string }).error ?? "Failed");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-project-view", projectId] });
    },
  });

  if (estimates.length === 0) return null;

  return (
    <section
      id="portal-customer-estimates"
      className="rounded-lg border border-aistroyka-border-subtle bg-aistroyka-surface p-4 border-l-4 border-l-aistroyka-accent"
      aria-labelledby="portal-estimates-heading"
    >
      <h3 id="portal-estimates-heading" className="font-semibold text-aistroyka-text-primary">
        {t("customerEstimatesHeading")}
      </h3>
      <p className="mt-1 text-sm text-aistroyka-text-secondary">{t("customerEstimatesCustomerHint")}</p>
      <ul className="mt-4 space-y-4">
        {estimates.map((e) => (
          <li key={e.id} className="rounded-md border border-aistroyka-border-subtle p-3 text-sm">
            <p className="font-medium text-aistroyka-text-primary">{e.title}</p>
            {e.description ? (
              <p className="mt-1 text-aistroyka-text-secondary whitespace-pre-wrap">{e.description}</p>
            ) : null}
            <p className="mt-2 text-aistroyka-text-primary">
              {t("customerEstimatesAmountLine", {
                amount: e.total_amount.toLocaleString(),
                currency: e.currency,
              })}
            </p>
            <p className="mt-1 text-xs text-aistroyka-text-tertiary capitalize">{e.status}</p>
            {e.status === "sent" && canRespond ? (
              <div className="mt-3 space-y-2">
                <textarea
                  className="w-full rounded border border-aistroyka-border-subtle bg-aistroyka-surface px-3 py-2 text-aistroyka-text-primary min-h-[72px]"
                  placeholder={t("customerEstimatesNotePlaceholder")}
                  value={notes[e.id] ?? ""}
                  onChange={(ev) => setNotes((prev) => ({ ...prev, [e.id]: ev.target.value }))}
                />
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="primary"
                    disabled={respondMutation.isPending}
                    onClick={() => respondMutation.mutate({ estimateId: e.id, decision: "approve" })}
                  >
                    {t("customerEstimatesApprove")}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    disabled={respondMutation.isPending}
                    onClick={() => respondMutation.mutate({ estimateId: e.id, decision: "reject" })}
                  >
                    {t("customerEstimatesReject")}
                  </Button>
                </div>
              </div>
            ) : null}
          </li>
        ))}
      </ul>
      {respondMutation.isError ? (
        <p className="mt-3 text-sm text-aistroyka-error" role="alert">
          {(respondMutation.error as Error).message}
        </p>
      ) : null}
    </section>
  );
}
