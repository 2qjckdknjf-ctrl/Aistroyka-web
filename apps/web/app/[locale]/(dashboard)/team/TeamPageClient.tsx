"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui";

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
      const res = await fetch("/api/v1/tenant/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed, role }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? t("inviteError"));
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
      const res = await fetch("/api/v1/tenant/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setError(data.error ?? t("inviteError"));
      else router.refresh();
    } finally {
      setRevoking(null);
    }
  }

  function copyLink() {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink);
      setMessage(t("copyLink"));
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
            <p className="mt-2 text-sm text-aistroyka-warning">{t("migrationRequiredTitle")}</p>
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
            <Button type="submit" disabled={loading || inviteDisabled} loading={loading}>
              {loading ? "…" : t("invite")}
            </Button>
          </form>
          {message && <p className="mt-3 text-sm text-aistroyka-success">{message}</p>}
          {inviteLink && (
            <div className="mt-3 space-y-2">
              <p className="text-xs text-aistroyka-text-tertiary">{inviteLink}</p>
              <Button type="button" variant="secondary" onClick={copyLink}>
                {t("copyLink")}
              </Button>
            </div>
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
                className="flex flex-wrap items-center justify-between gap-2 surface-glass-raised rounded-card px-4 py-2.5"
              >
                <span className="font-mono text-sm text-aistroyka-text-secondary">{m.user_id.slice(0, 8)}…</span>
                <span className="text-sm text-aistroyka-text-primary">{roleLabel(m.role)}</span>
                {canManage && !m.is_owner && m.user_id !== currentUserId && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => handleRevoke(m.user_id)}
                    disabled={revoking === m.user_id}
                    loading={revoking === m.user_id}
                  >
                    {revoking === m.user_id ? "…" : t("revoke")}
                  </Button>
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
                  className="flex flex-wrap items-center justify-between gap-2 surface-glass-raised rounded-card px-4 py-2.5"
                >
                  <span className="text-sm text-aistroyka-text-primary">{inv.email}</span>
                  <span className="text-sm text-aistroyka-text-secondary">{roleLabel(inv.role)}</span>
                  <span className="text-xs text-aistroyka-text-tertiary">
                    {new Date(inv.expires_at).toLocaleDateString()}
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
