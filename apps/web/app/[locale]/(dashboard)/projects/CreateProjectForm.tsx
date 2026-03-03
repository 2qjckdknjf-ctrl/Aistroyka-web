"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import {
  normalizeApiError,
  networkErrorToApiError,
} from "@/lib/api/errorShape";

export function CreateProjectForm() {
  const router = useRouter();
  const t = useTranslations("projects");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const PROJECT_NAME_MAX_LENGTH = 200;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    if (name.trim().length > PROJECT_NAME_MAX_LENGTH) {
      setError(t("nameTooLong"));
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
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
      setName("");
      router.refresh();
      const id = data.data?.id ?? (data as { id?: string }).id;
      if (id) router.push(`/projects/${id}`);
    } catch (_e) {
      setLoading(false);
      setError(networkErrorToApiError().error.message);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-wrap items-center gap-2"
      aria-busy={loading}
    >
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={t("projectNamePlaceholder")}
        maxLength={PROJECT_NAME_MAX_LENGTH}
        className="input-field min-w-[200px] max-w-xs"
        aria-label={t("projectNamePlaceholder")}
        autoComplete="off"
      />
      <button
        type="submit"
        disabled={loading || !name.trim()}
        className="btn-primary"
        aria-label={loading ? t("creating") : t("create")}
      >
        {loading ? t("creating") : t("create")}
      </button>
      {error && (
        <span className="w-full text-sm text-aistroyka-error sm:w-auto" role="alert">{error}</span>
      )}
    </form>
  );
}
