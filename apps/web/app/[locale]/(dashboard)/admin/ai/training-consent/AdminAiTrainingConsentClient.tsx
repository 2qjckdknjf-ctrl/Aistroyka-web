"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui";

interface ConsentState {
  aiTrainingConsent: boolean;
}

export function AdminAiTrainingConsentClient() {
  const t = useTranslations("aiFlywheel.consent");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/tenant/ai-training-consent");
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      const json = (await res.json()) as { data: ConsentState };
      setConsent(json.data.aiTrainingConsent);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("loadError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/v1/tenant/ai-training-consent", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aiTrainingConsent: consent }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("saveError"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-aistroyka-subheadline text-aistroyka-text-secondary">{t("loading")}</p>;
  }

  return (
    <Card className="max-w-2xl">
      <h2 className="text-aistroyka-title3 font-semibold text-aistroyka-text-primary">{t("title")}</h2>
      <p className="mt-2 text-aistroyka-subheadline text-aistroyka-text-secondary">{t("description")}</p>

      <label className="mt-6 flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          className="mt-1 h-4 w-4 rounded border-aistroyka-border-subtle"
          checked={consent}
          onChange={(e) => {
            setConsent(e.target.checked);
            setSaved(false);
          }}
        />
        <span className="text-aistroyka-subheadline text-aistroyka-text-primary">{t("toggleLabel")}</span>
      </label>

      <div className="mt-4 rounded-md border border-aistroyka-border-subtle bg-aistroyka-surface-raised p-4 text-aistroyka-footnote text-aistroyka-text-secondary">
        <p className="font-medium text-aistroyka-text-primary">{t("revocationTitle")}</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>{t("revocationFuture")}</li>
          <li>{t("revocationModels")}</li>
          <li>{t("revocationSnapshot")}</li>
        </ul>
      </div>

      {error ? <p className="mt-4 text-aistroyka-footnote text-red-600">{error}</p> : null}
      {saved ? <p className="mt-4 text-aistroyka-footnote text-aistroyka-accent">{t("saved")}</p> : null}

      <button
        type="button"
        onClick={() => void save()}
        disabled={saving}
        className="mt-6 rounded-md bg-aistroyka-accent px-4 py-2 text-aistroyka-subheadline font-medium text-white disabled:opacity-50"
      >
        {saving ? t("saving") : t("save")}
      </button>
    </Card>
  );
}
