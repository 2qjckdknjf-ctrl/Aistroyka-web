"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, Button, Badge } from "@/components/ui";

interface Row {
  id: string;
  email: string;
  stakeholder_role: "client_viewer" | "client_decision_maker";
  status: string;
  expires_at: string;
  accepted_at: string | null;
}

interface DeliveryRow {
  id: string;
  kind: string;
  recipient_email: string;
  status: string;
  email_delivered_at: string | null;
  read_at: string | null;
  created_at: string;
}

async function fetchList(projectId: string): Promise<Row[]> {
  const res = await fetch(`/api/v1/projects/${projectId}/stakeholders`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load");
  const j = await res.json();
  return j.data ?? [];
}

async function fetchDelivery(projectId: string): Promise<DeliveryRow[]> {
  const res = await fetch(`/api/v1/projects/${projectId}/stakeholder-delivery?limit=25`, { credentials: "include" });
  if (!res.ok) return [];
  const j = await res.json();
  return j.data ?? [];
}

export function StakeholderManagerPanel({ projectId }: { projectId: string }) {
  const tDetail = useTranslations("dashboardDetail");
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"client_viewer" | "client_decision_maker">("client_viewer");
  const [open, setOpen] = useState(false);
  const [lastInvitePath, setLastInvitePath] = useState<string | null>(null);

  const listQuery = useQuery({ queryKey: ["project-stakeholders", projectId], queryFn: () => fetchList(projectId) });
  const deliveryQuery = useQuery({
    queryKey: ["stakeholder-delivery", projectId],
    queryFn: () => fetchDelivery(projectId),
  });

  const inviteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/v1/projects/${projectId}/stakeholders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: email.trim(), stakeholder_role: role }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error((j as { error?: string }).error ?? "Invite failed");
      }
      return res.json();
    },
    onSuccess: (json: { data?: { invite_path?: string } }) => {
      queryClient.invalidateQueries({ queryKey: ["project-stakeholders", projectId] });
      queryClient.invalidateQueries({ queryKey: ["stakeholder-delivery", projectId] });
      setEmail("");
      setOpen(false);
      if (json?.data?.invite_path) setLastInvitePath(json.data.invite_path);
    },
  });

  const resendMutation = useMutation({
    mutationFn: async (stakeholderId: string) => {
      const res = await fetch(`/api/v1/projects/${projectId}/stakeholders/${stakeholderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "resend_invite" }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error((j as { error?: string }).error ?? "Resend failed");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stakeholder-delivery", projectId] });
    },
  });

  const revokeMutation = useMutation({
    mutationFn: async (stakeholderId: string) => {
      const res = await fetch(`/api/v1/projects/${projectId}/stakeholders/${stakeholderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "revoke" }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error((j as { error?: string }).error ?? "Revoke failed");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-stakeholders", projectId] });
    },
  });

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <Card className="border-l-4 border-l-aistroyka-info p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-aistroyka-caption font-semibold uppercase tracking-wide text-aistroyka-text-tertiary">
            {tDetail("externalStakeholders")}
          </h3>
          <p className="mt-1 text-sm text-aistroyka-text-secondary">
            {tDetail("externalStakeholdersHint")}
          </p>
        </div>
        <Button type="button" size="sm" variant="secondary" onClick={() => setOpen((o) => !o)}>
          {open ? tDetail("close") : tDetail("invite")}
        </Button>
      </div>

      {open ? (
        <div className="mt-4 space-y-3 rounded-lg border border-aistroyka-border-subtle p-3">
          <div>
            <label className="text-xs font-medium text-aistroyka-text-secondary">{tDetail("email")}</label>
            <input
              className="mt-1 w-full rounded border border-aistroyka-border-subtle bg-aistroyka-bg-elevated p-2 text-sm"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={tDetail("clientEmailPlaceholder")}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-aistroyka-text-secondary">{tDetail("role")}</label>
            <select
              className="mt-1 w-full rounded border border-aistroyka-border-subtle bg-aistroyka-bg-elevated p-2 text-sm"
              value={role}
              onChange={(e) => setRole(e.target.value as "client_viewer" | "client_decision_maker")}
            >
              <option value="client_viewer">{tDetail("viewerPortalReadOnly")}</option>
              <option value="client_decision_maker">{tDetail("decisionMakerRespond")}</option>
            </select>
          </div>
          {inviteMutation.isError && inviteMutation.error instanceof Error ? (
            <p className="text-sm text-aistroyka-error" role="alert">
              {inviteMutation.error.message}
            </p>
          ) : null}
          <Button
            type="button"
            size="sm"
            loading={inviteMutation.isPending}
            disabled={!email.includes("@")}
            onClick={() => inviteMutation.mutate()}
          >
            {tDetail("sendInvite")}
          </Button>
          <p className="text-xs text-aistroyka-text-tertiary">
            {tDetail("inviteEmailHint")}
          </p>
        </div>
      ) : null}

      {lastInvitePath ? (
        <p className="mt-2 text-xs text-aistroyka-text-secondary break-all">
          {tDetail("share")}{" "}
          <span className="font-mono text-aistroyka-accent">
            {origin}
            {lastInvitePath}
          </span>
        </p>
      ) : null}

      {listQuery.isPending ? (
        <p className="mt-3 text-sm text-aistroyka-text-tertiary">{tDetail("loading")}</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {(listQuery.data ?? []).length === 0 ? (
            <li className="text-sm text-aistroyka-text-tertiary">{tDetail("noStakeholdersYet")}</li>
          ) : (
            (listQuery.data ?? []).map((r) => (
              <li
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded border border-aistroyka-border-subtle px-3 py-2 text-sm"
              >
                <div>
                  <span className="font-medium">{r.email}</span>
                  <span className="ml-2 text-aistroyka-text-tertiary">
                    {r.stakeholder_role === "client_decision_maker" ? tDetail("decisionMaker") : tDetail("viewer")} · {r.status}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-aistroyka-surface-raised text-aistroyka-text-secondary">{r.status}</Badge>
                  {r.status === "invited" ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      disabled={resendMutation.isPending}
                      onClick={() => resendMutation.mutate(r.id)}
                    >
                      {tDetail("resendInvite")}
                    </Button>
                  ) : null}
                  {r.status !== "revoked" ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled={revokeMutation.isPending}
                      onClick={() => revokeMutation.mutate(r.id)}
                    >
                      {tDetail("revoke")}
                    </Button>
                  ) : null}
                </div>
              </li>
            ))
          )}
        </ul>
      )}

      <div className="mt-6 border-t border-aistroyka-border-subtle pt-4">
        <h4 className="text-aistroyka-caption font-semibold uppercase tracking-wide text-aistroyka-text-tertiary">
          {tDetail("deliveryLogStakeholderNotifications")}
        </h4>
        <p className="mt-1 text-xs text-aistroyka-text-tertiary">
          {tDetail("deliveryLogHint")}
        </p>
        {deliveryQuery.isPending ? (
          <p className="mt-2 text-sm text-aistroyka-text-tertiary">{tDetail("loading")}</p>
        ) : (deliveryQuery.data ?? []).length === 0 ? (
          <p className="mt-2 text-sm text-aistroyka-text-tertiary">{tDetail("noDeliveryRowsYet")}</p>
        ) : (
          <ul className="mt-2 max-h-56 space-y-1 overflow-y-auto text-xs">
            {(deliveryQuery.data ?? []).map((d) => (
              <li
                key={d.id}
                className="flex flex-wrap justify-between gap-2 border-b border-aistroyka-border-subtle py-1 text-aistroyka-text-secondary"
              >
                <span className="font-mono text-[11px]">{d.kind}</span>
                <span className="text-aistroyka-text-tertiary">{d.recipient_email}</span>
                <span className="text-aistroyka-text-tertiary">{d.status}</span>
                <span className="text-aistroyka-text-tertiary">
                  {d.email_delivered_at ? new Date(d.email_delivered_at).toLocaleString() : "—"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}
