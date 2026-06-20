"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui";

type Overview = {
  totalTenants: number;
  activeUsers: number;
  pendingInvites: number;
  openSupportEvents: number;
  recentSupportEvents: Array<{ id: string; subject: string; status: string; priority: string }>;
};

type TenantRow = {
  id: string;
  name: string | null;
  user_id: string | null;
  membersCount: number;
  invitationsCount: number;
  projectsCount: number;
};

type UserRow = {
  userId: string;
  memberships: Array<{ tenant_id: string; role: string }>;
  platformOwnerGrant: string | null;
};

type SupportTicket = {
  id: string;
  subject: string;
  status: string;
  priority: string;
  requester_user_id: string;
  tenant_id: string | null;
};

type AuditItem = {
  id: string;
  action: string;
  entity: string | null;
  entity_id: string | null;
  created_at: string;
};

type Diagnostics = {
  auth: { userId: string; role: string };
  inviteToken: { exists: boolean; expired?: boolean };
  mobileLinks: Record<string, string | null>;
};

export function OwnerConsoleClient() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [audit, setAudit] = useState<AuditItem[]>([]);
  const [diagnostics, setDiagnostics] = useState<Diagnostics | null>(null);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [thread, setThread] = useState<Array<{ id: string; author_type: string; body: string; created_at: string }>>([]);
  const [reply, setReply] = useState("");
  const [statusUpdate, setStatusUpdate] = useState("in_progress");
  const [error, setError] = useState<string | null>(null);

  async function loadAll() {
    const [overviewRes, tenantsRes, usersRes, ticketsRes, auditRes, diagnosticsRes] = await Promise.all([
      fetch("/api/v1/owner/overview"),
      fetch("/api/v1/owner/tenants"),
      fetch("/api/v1/owner/users"),
      fetch("/api/v1/owner/support/tickets"),
      fetch("/api/v1/owner/audit?limit=30"),
      fetch("/api/v1/owner/diagnostics"),
    ]);

    const [overviewJson, tenantsJson, usersJson, ticketsJson, auditJson, diagnosticsJson] = await Promise.all([
      overviewRes.json().catch(() => ({})),
      tenantsRes.json().catch(() => ({})),
      usersRes.json().catch(() => ({})),
      ticketsRes.json().catch(() => ({})),
      auditRes.json().catch(() => ({})),
      diagnosticsRes.json().catch(() => ({})),
    ]);

    if (
      !overviewRes.ok ||
      !tenantsRes.ok ||
      !usersRes.ok ||
      !ticketsRes.ok ||
      !auditRes.ok ||
      !diagnosticsRes.ok
    ) {
      setError("Failed to load owner console data.");
      return;
    }

    setOverview(overviewJson.data as Overview);
    setTenants((tenantsJson.data ?? []) as TenantRow[]);
    setUsers((usersJson.data ?? []) as UserRow[]);
    const loadedTickets = (ticketsJson.data ?? []) as SupportTicket[];
    setTickets(loadedTickets);
    setAudit((auditJson.data ?? []) as AuditItem[]);
    setDiagnostics(diagnosticsJson.data as Diagnostics);
    if (!selectedTicketId && loadedTickets.length > 0) {
      setSelectedTicketId(loadedTickets[0].id);
    }
  }

  async function loadThread(ticketId: string) {
    const response = await fetch(`/api/v1/owner/support/tickets/${ticketId}/messages`);
    const json = await response.json().catch(() => ({}));
    if (response.ok) {
      setThread(json.data ?? []);
    }
  }

  useEffect(() => {
    void loadAll();
  }, []);

  useEffect(() => {
    if (selectedTicketId) {
      void loadThread(selectedTicketId);
    }
  }, [selectedTicketId]);

  async function sendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTicketId || !reply.trim()) return;
    const response = await fetch(`/api/v1/owner/support/tickets/${selectedTicketId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: reply.trim(), status: statusUpdate }),
    });
    if (!response.ok) {
      setError("Failed to send support reply.");
      return;
    }
    setReply("");
    await loadThread(selectedTicketId);
    await loadAll();
  }

  async function updateStatus(ticketId: string, status: string) {
    const response = await fetch("/api/v1/owner/support/tickets", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticketId, status }),
    });
    if (!response.ok) {
      setError("Failed to update ticket status.");
      return;
    }
    await loadAll();
  }

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-aistroyka-title2 font-semibold tracking-tight">Platform owner console</h1>
        <p className="mt-2 text-aistroyka-subheadline text-aistroyka-text-secondary">
          Isolated OWNER surface for cross-tenant operations, support, diagnostics, and audit.
        </p>
      </header>

      {error ? <p className="text-sm text-aistroyka-error">{error}</p> : null}

      <div className="grid gap-3 md:grid-cols-4">
        <div className="card">
          <p className="text-xs text-aistroyka-text-tertiary">Tenants</p>
          <p className="text-2xl font-semibold">{overview?.totalTenants ?? 0}</p>
        </div>
        <div className="card">
          <p className="text-xs text-aistroyka-text-tertiary">Active users</p>
          <p className="text-2xl font-semibold">{overview?.activeUsers ?? 0}</p>
        </div>
        <div className="card">
          <p className="text-xs text-aistroyka-text-tertiary">Pending invites</p>
          <p className="text-2xl font-semibold">{overview?.pendingInvites ?? 0}</p>
        </div>
        <div className="card">
          <p className="text-xs text-aistroyka-text-tertiary">Open support events</p>
          <p className="text-2xl font-semibold">{overview?.openSupportEvents ?? 0}</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card">
          <h2 className="text-aistroyka-headline font-semibold">Tenants</h2>
          <ul className="mt-3 max-h-72 space-y-2 overflow-auto text-sm">
            {tenants.map((tenant) => (
              <li key={tenant.id} className="rounded-card border border-aistroyka-border-subtle px-3 py-2">
                <p className="font-medium">{tenant.name ?? "Untitled tenant"}</p>
                <p className="text-aistroyka-text-tertiary">
                  {tenant.id} · members {tenant.membersCount} · invites {tenant.invitationsCount} · projects {tenant.projectsCount}
                </p>
              </li>
            ))}
          </ul>
        </section>
        <section className="card">
          <h2 className="text-aistroyka-headline font-semibold">Users</h2>
          <ul className="mt-3 max-h-72 space-y-2 overflow-auto text-sm">
            {users.map((user) => (
              <li key={user.userId} className="rounded-card border border-aistroyka-border-subtle px-3 py-2">
                <p className="font-medium">{user.userId}</p>
                <p className="text-aistroyka-text-tertiary">
                  memberships {user.memberships.length} · owner grant {user.platformOwnerGrant ?? "none"}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card">
          <h2 className="text-aistroyka-headline font-semibold">Support tickets</h2>
          <ul className="mt-3 max-h-72 space-y-2 overflow-auto text-sm">
            {tickets.map((ticket) => (
              <li key={ticket.id} className="rounded-card border border-aistroyka-border-subtle px-3 py-2">
                <button type="button" className="w-full text-left" onClick={() => setSelectedTicketId(ticket.id)}>
                  <p className="font-medium">{ticket.subject}</p>
                  <p className="text-aistroyka-text-tertiary">
                    {ticket.status} · {ticket.priority} · {ticket.requester_user_id}
                  </p>
                </button>
                <div className="mt-2 flex gap-2">
                  {["in_progress", "waiting_user", "resolved", "closed"].map((status) => (
                    <Button
                      key={status}
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => updateStatus(ticket.id, status)}
                    >
                      {status}
                    </Button>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </section>
        <section className="card">
          <h2 className="text-aistroyka-headline font-semibold">Support thread</h2>
          {selectedTicketId ? (
            <>
              <ul className="mt-3 max-h-56 space-y-2 overflow-auto text-sm">
                {thread.map((msg) => (
                  <li key={msg.id} className="rounded-card border border-aistroyka-border-subtle px-3 py-2">
                    <p className="text-xs text-aistroyka-text-tertiary">
                      {msg.author_type} · {new Date(msg.created_at).toLocaleString()}
                    </p>
                    <p>{msg.body}</p>
                  </li>
                ))}
              </ul>
              <form onSubmit={sendReply} className="mt-3 space-y-2">
                <select
                  value={statusUpdate}
                  onChange={(event) => setStatusUpdate(event.target.value)}
                  className="input-field"
                >
                  <option value="in_progress">in_progress</option>
                  <option value="waiting_user">waiting_user</option>
                  <option value="resolved">resolved</option>
                  <option value="closed">closed</option>
                </select>
                <textarea
                  value={reply}
                  onChange={(event) => setReply(event.target.value)}
                  className="input-field min-h-20"
                  placeholder="Owner reply"
                  required
                />
                <Button type="submit">Send owner reply</Button>
              </form>
            </>
          ) : (
            <p className="mt-3 text-sm text-aistroyka-text-tertiary">Select a support ticket.</p>
          )}
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card">
          <h2 className="text-aistroyka-headline font-semibold">Technical diagnostics</h2>
          <pre className="mt-3 max-h-72 overflow-auto rounded-card bg-aistroyka-bg-primary p-3 text-xs">
            {JSON.stringify(diagnostics, null, 2)}
          </pre>
        </section>
        <section className="card">
          <h2 className="text-aistroyka-headline font-semibold">Audit log</h2>
          <ul className="mt-3 max-h-72 space-y-2 overflow-auto text-xs">
            {audit.map((row) => (
              <li key={row.id} className="rounded-card border border-aistroyka-border-subtle px-3 py-2">
                <p className="font-medium">{row.action}</p>
                <p className="text-aistroyka-text-tertiary">
                  {row.entity ?? "owner_api"} · {row.entity_id ?? "—"} · {new Date(row.created_at).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </section>
  );
}
