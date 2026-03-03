"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

type Member = { user_id: string; role: string; created_at: string; is_owner: boolean };
type Invitation = { id: string; email: string; role: string; expires_at: string };

export function TeamPageClient({
  members,
  invitations,
  canManage,
  currentUserId,
  teamFeaturesAvailable = true,
}: {
  members: Member[];
  invitations: Invitation[];
  canManage: boolean;
  currentUserId: string;
  teamFeaturesAvailable?: boolean;
}) {
  const t = useTranslations("team");
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "member" | "viewer">("member");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setInviteLink(null);
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;
    setLoading(true);
    try {
      const res = await fetch("/api/tenant/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed, role }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Invite failed");
        return;
      }
      setMessage(t("inviteSuccess"));
      setInviteLink(data.data?.accept_link ?? null);
      setEmail("");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function handleRevoke(userId: string) {
    if (!confirm(t("revoke") + "?")) return;
    setRevoking(userId);
    setError(null);
    try {
      const res = await fetch("/api/tenant/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setError(data.error ?? "Failed");
      else router.refresh();
    } finally {
      setRevoking(null);
    }
  }

  function copyLink() {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink);
      setMessage("Link copied.");
    }
  }

  const roleLabel = (r: string) => {
    if (r === "owner") return t("owner");
    if (r === "admin") return t("admin");
    if (r === "member") return t("member");
    return t("viewer");
  };

  const inviteDisabled = canManage && !teamFeaturesAvailable;

  return (
    <div className="space-y-8">
      {canManage && (
        <section className={`card ${inviteDisabled ? "opacity-75" : ""}`}>
          <h2 className="text-lg font-semibold text-aistroyka-text-primary">{t("invite")}</h2>
          {inviteDisabled && (
            <p className="mt-2 text-sm text-aistroyka-warning">Apply the database migrations (see message above) to enable invitations.</p>
          )}
          <form onSubmit={handleInvite} className="mt-4 flex flex-wrap items-end gap-3">
            <div className="min-w-[200px] flex-1">
              <label htmlFor="team-invite-email" className="mb-1 block text-sm font-medium text-aistroyka-text-primary">
                {t("email")}
              </label>
              <input
                id="team-invite-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("invitePlaceholder")}
                className="input-field"
              />
            </div>
            <div className="w-36">
              <label htmlFor="team-invite-role" className="mb-1 block text-sm font-medium text-aistroyka-text-primary">
                {t("role")}
              </label>
              <select
                id="team-invite-role"
                value={role}
                onChange={(e) => setRole(e.target.value as "admin" | "member" | "viewer")}
                className="input-field"
              >
                <option value="viewer">{t("viewer")}</option>
                <option value="member">{t("member")}</option>
                <option value="admin">{t("admin")}</option>
              </select>
            </div>
            <button type="submit" disabled={loading || inviteDisabled} className="btn-primary">
              {loading ? "…" : t("invite")}
            </button>
          </form>
          {message && <p className="mt-3 text-sm text-aistroyka-success">{message}</p>}
          {inviteLink && (
            <button type="button" onClick={copyLink} className="btn-secondary mt-2">
              {t("copyLink")}
            </button>
          )}
          {error && <p className="mt-2 text-sm text-aistroyka-error" role="alert">{error}</p>}
        </section>
      )}

      <section className="card">
        <h2 className="text-lg font-semibold text-aistroyka-text-primary">{t("members")}</h2>
        {members.length === 0 ? (
          <p className="mt-2 text-sm text-aistroyka-text-tertiary">{t("noMembers")}</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {members.map((m) => (
              <li
                key={m.user_id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-card border border-aistroyka-border-subtle bg-aistroyka-surface-raised/80 px-4 py-2.5"
              >
                <span className="font-mono text-sm text-aistroyka-text-secondary">{m.user_id.slice(0, 8)}…</span>
                <span className="text-sm text-aistroyka-text-primary">{roleLabel(m.role)}</span>
                {canManage && !m.is_owner && m.user_id !== currentUserId && (
                  <button
                    type="button"
                    onClick={() => handleRevoke(m.user_id)}
                    disabled={revoking === m.user_id}
                    className="btn-secondary text-sm"
                  >
                    {revoking === m.user_id ? "…" : t("revoke")}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {canManage && (
        <section className="card">
          <h2 className="text-lg font-semibold text-aistroyka-text-primary">{t("invitations")}</h2>
          {invitations.length === 0 ? (
            <p className="mt-2 text-sm text-aistroyka-text-tertiary">{t("noInvitations")}</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {invitations.map((inv) => (
                <li
                  key={inv.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-card border border-aistroyka-border-subtle bg-aistroyka-surface-raised/80 px-4 py-2.5"
                >
                  <span className="text-sm text-aistroyka-text-primary">{inv.email}</span>
                  <span className="text-sm text-aistroyka-text-secondary">{roleLabel(inv.role)}</span>
                  <span className="text-xs text-aistroyka-text-tertiary">
                    expires {new Date(inv.expires_at).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
