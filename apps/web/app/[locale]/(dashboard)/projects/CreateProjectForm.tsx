"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import {
  normalizeApiError,
  networkErrorToApiError,
} from "@/lib/api/errorShape";

const PROJECT_NAME_MAX_LENGTH = 200;

export function CreateProjectForm({ skin = "default" }: { skin?: "default" | "canon" }) {
  const router = useRouter();
  const t = useTranslations("projects");
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [clientLabel, setClientLabel] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function composeName(): string {
    const parts = [name.trim()];
    if (address.trim()) parts.push(address.trim());
    if (clientLabel.trim()) parts.push(clientLabel.trim());
    let composed = parts.join(" · ");
    if (composed.length > PROJECT_NAME_MAX_LENGTH) {
      composed = composed.slice(0, PROJECT_NAME_MAX_LENGTH);
    }
    return composed;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const composed = composeName();
    if (composed.length > PROJECT_NAME_MAX_LENGTH) {
      setError(t("nameTooLong"));
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/v1/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: composed }),
        credentials: "include",
      });
      const data = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        data?: { id?: string };
        error?: string;
      };
      setLoading(false);
      if (!res.ok) {
        setError(normalizeApiError(res, data).error.message);
        return;
      }
      if (data.success === false && data.error) {
        setError(normalizeApiError(res, data).error.message);
        return;
      }
      const id = data.data?.id ?? (data as { id?: string }).id;
      if (id) {
        if (notes.trim() && typeof window !== "undefined") {
          try {
            sessionStorage.setItem(`aistroyka.project.setup.${id}`, notes.trim());
          } catch {
            /* ignore */
          }
        }
        router.push(`/dashboard/projects/${id}`);
        router.refresh();
        return;
      }
      router.refresh();
    } catch {
      setLoading(false);
      setError(networkErrorToApiError().error.message);
    }
  }

  const inputClass =
    skin === "canon"
      ? "w-full rounded-xl border border-[var(--canon-border-glass)] bg-[rgba(255,255,255,0.04)] px-3 py-2.5 text-sm text-[var(--canon-text-primary)] outline-none focus:border-[var(--canon-gold)]"
      : "input-field w-full min-w-[200px]";

  const labelClass =
    skin === "canon"
      ? "mb-1.5 block text-sm font-medium text-[var(--canon-text-primary)]"
      : "mb-1 block text-aistroyka-caption font-medium text-aistroyka-text-secondary";

  return (
    <form
      onSubmit={handleSubmit}
      className={skin === "canon" ? "space-y-4" : "flex flex-wrap items-end gap-3"}
      aria-busy={loading}
    >
      <div className={skin === "canon" ? "" : "min-w-[200px] flex-1"}>
        <label htmlFor="create-project-name" className={labelClass}>
          {t("projectNamePlaceholder")}
        </label>
        <input
          id="create-project-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("projectNamePlaceholder")}
          maxLength={PROJECT_NAME_MAX_LENGTH}
          className={inputClass}
          required
          autoComplete="off"
        />
      </div>
      <div className={skin === "canon" ? "" : "min-w-[180px] flex-1"}>
        <label htmlFor="create-project-address" className={labelClass}>
          {t("addressOptional")}
        </label>
        <input
          id="create-project-address"
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder={t("addressPlaceholder")}
          className={inputClass}
          autoComplete="street-address"
        />
      </div>
      <div className={skin === "canon" ? "" : "min-w-[160px] flex-1"}>
        <label htmlFor="create-project-client" className={labelClass}>
          {t("clientOptional")}
        </label>
        <input
          id="create-project-client"
          type="text"
          value={clientLabel}
          onChange={(e) => setClientLabel(e.target.value)}
          placeholder={t("clientPlaceholder")}
          className={inputClass}
          autoComplete="organization"
        />
      </div>
      {skin === "canon" ? (
        <div>
          <label htmlFor="create-project-notes" className={labelClass}>
            {t("notesOptional")}
          </label>
          <textarea
            id="create-project-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t("notesPlaceholder")}
            rows={3}
            className={inputClass}
          />
        </div>
      ) : null}
      <div className={skin === "canon" ? "flex flex-wrap justify-end gap-2 pt-2" : ""}>
        <button
          type="submit"
          disabled={loading || !name.trim()}
          className={skin === "canon" ? "canon-gold-btn" : "btn-primary"}
          aria-label={loading ? t("creating") : t("create")}
        >
          {loading ? t("creating") : t("create")}
        </button>
      </div>
      {error ? (
        <p className="w-full text-sm text-[var(--canon-danger,var(--aistroyka-error))]" role="alert">
          {error}
        </p>
      ) : null}
      {skin === "canon" ? (
        <p className="text-xs text-[var(--canon-text-muted)]">{t("richCreateHint")}</p>
      ) : null}
    </form>
  );
}
