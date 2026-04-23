"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "@/i18n/navigation";
import { Card } from "@/components/ui";

export function ClientPortalManagerCard({
  projectId,
  initialEnabled,
  initialBudget,
}: {
  projectId: string;
  initialEnabled: boolean;
  initialBudget: boolean;
}) {
  const queryClient = useQueryClient();
  const [enabled, setEnabled] = useState(initialEnabled);
  const [budget, setBudget] = useState(initialBudget);

  const mutation = useMutation({
    mutationFn: async (body: { client_portal_enabled?: boolean; client_show_budget_summary?: boolean }) => {
      const res = await fetch(`/api/v1/projects/${projectId}/client-portal`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error((j as { error?: string }).error ?? "Update failed");
      }
      return res.json() as Promise<{ data: { client_portal_enabled: boolean; client_show_budget_summary: boolean } }>;
    },
    onSuccess: (json) => {
      setEnabled(json.data.client_portal_enabled);
      setBudget(json.data.client_show_budget_summary);
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
    },
  });

  return (
    <Card className="border-l-4 border-l-aistroyka-info p-4">
      <h3 className="text-aistroyka-caption font-semibold uppercase tracking-wide text-aistroyka-text-tertiary">
        Client portal
      </h3>
      <p className="mt-1 text-sm text-aistroyka-text-secondary">
        Control what project owners (customer role) can see. Mark individual milestones and documents as visible in their
        edit panels.
      </p>
      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="flex items-center gap-2 text-sm text-aistroyka-text-primary">
          <input
            type="checkbox"
            checked={enabled}
            disabled={mutation.isPending}
            onChange={(e) => mutation.mutate({ client_portal_enabled: e.target.checked })}
          />
          Enable client portal
        </label>
        <label className="flex items-center gap-2 text-sm text-aistroyka-text-primary">
          <input
            type="checkbox"
            checked={budget}
            disabled={mutation.isPending || !enabled}
            onChange={(e) => mutation.mutate({ client_show_budget_summary: e.target.checked })}
          />
          Show high-level budget (totals only)
        </label>
      </div>
      {enabled && (
        <p className="mt-2 text-xs text-aistroyka-text-tertiary">
          Preview:{" "}
          <Link href={`/dashboard/projects/${projectId}/client`} className="text-aistroyka-accent hover:underline">
            Open client view
          </Link>
        </p>
      )}
      {mutation.isError && mutation.error instanceof Error ? (
        <p className="mt-2 text-sm text-aistroyka-error" role="alert">
          {mutation.error.message}
        </p>
      ) : null}
    </Card>
  );
}
