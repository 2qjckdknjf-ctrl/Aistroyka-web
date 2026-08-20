"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "@/i18n/navigation";
import { DashboardGlassCard } from "@/components/dashboard/DashboardGlassCard";

export function ClientPortalManagerCard({
  projectId,
  initialEnabled,
}: {
  projectId: string;
  initialEnabled: boolean;
}) {
  const queryClient = useQueryClient();
  const [enabled, setEnabled] = useState(initialEnabled);

  const mutation = useMutation({
    mutationFn: async (body: { client_portal_enabled?: boolean }) => {
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
      return res.json() as Promise<{ data: { client_portal_enabled: boolean } }>;
    },
    onSuccess: (json) => {
      setEnabled(json.data.client_portal_enabled);
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
    },
  });

  return (
    <DashboardGlassCard className="border-l-4 border-l-aistroyka-info p-4">
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
    </DashboardGlassCard>
  );
}
