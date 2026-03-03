"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  normalizeApiError,
  networkErrorToApiError,
} from "@/lib/api/errorShape";

export function UploadMediaForm({ projectId }: { projectId: string }) {
  const router = useRouter();
  const t = useTranslations("projectDetail");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setLoading(true);
    const form = new FormData();
    form.set("file", file);
    try {
      const res = await fetch(`/api/projects/${projectId}/upload`, {
        method: "POST",
        body: form,
      });
      const data = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        data?: { jobId?: string; mediaId?: string };
        error?: string;
      };
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
      if (!res.ok) {
        setError(normalizeApiError(res, data).error.message);
        return;
      }
      if (data.success === false && data.error) {
        setError(normalizeApiError(res, data).error.message);
        return;
      }
      // Trigger one job processing so AI runs without a separate worker
      fetch("/api/analysis/process", { method: "POST" }).catch(() => {});
      router.refresh();
    } catch (_e) {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
      setError(networkErrorToApiError().error.message);
    }
  }

  return (
    <div>
      <label className="inline-flex min-h-[44px] cursor-pointer items-center justify-center rounded-aistroyka-lg border border-aistroyka-border-subtle bg-aistroyka-surface px-4 py-2.5 text-sm font-medium text-aistroyka-text-primary transition-colors hover:bg-aistroyka-surface-raised focus-within:ring-2 focus-within:ring-aistroyka-accent/20 disabled:pointer-events-none disabled:opacity-50">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleChange}
          disabled={loading}
          className="sr-only"
          aria-label={t("chooseImage")}
        />
        {loading ? t("uploading") : t("chooseImage")}
      </label>
      {loading && <span className="ml-2 text-sm text-aistroyka-text-tertiary">{t("uploading")}</span>}
      {error && (
        <p className="mt-2 text-sm text-aistroyka-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
