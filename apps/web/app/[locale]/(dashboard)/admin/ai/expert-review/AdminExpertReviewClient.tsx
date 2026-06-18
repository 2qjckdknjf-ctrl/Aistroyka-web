"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui";

interface QueueItem {
  id: string;
  taskType: string;
  audience: string;
  status: string;
  priority: string;
  provenance: string;
  sourceTable: string;
  inputJson: Record<string, unknown>;
  modelOutputJson: Record<string, unknown>;
  createdAt: string;
}

const VERDICTS = [
  "model_correct",
  "model_partially_correct",
  "model_wrong",
  "both_models_wrong",
] as const;

export function AdminExpertReviewClient() {
  const t = useTranslations("aiFlywheel.expertReview");
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<QueueItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [verdict, setVerdict] = useState<string>("model_partially_correct");
  const [conclusion, setConclusion] = useState("");
  const [rationale, setRationale] = useState("");
  const [correctedJson, setCorrectedJson] = useState("{}");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/tenant/ai-expert-review-queue");
      if (res.status === 404) {
        setItems([]);
        setError(t("disabled"));
        return;
      }
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      const json = (await res.json()) as { data: QueueItem[] };
      setItems(json.data);
      if (json.data[0] && !selectedId) setSelectedId(json.data[0].id);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("loadError"));
    } finally {
      setLoading(false);
    }
  }, [selectedId, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const selected = items.find((i) => i.id === selectedId) ?? null;

  const submit = async () => {
    if (!selected) return;
    setBusy(true);
    setError(null);
    try {
      let corrected: Record<string, unknown> | undefined;
      if (correctedJson.trim()) {
        corrected = JSON.parse(correctedJson) as Record<string, unknown>;
      }
      const res = await fetch(`/api/v1/tenant/ai-expert-review-queue/${selected.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verdict,
          expertConclusion: conclusion,
          expertRationale: rationale || undefined,
          correctedOutputJson: corrected,
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? t("submitError"));
      }
      setConclusion("");
      setRationale("");
      setCorrectedJson("{}");
      setSelectedId(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("submitError"));
    } finally {
      setBusy(false);
    }
  };

  const skip = async () => {
    if (!selected) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/tenant/ai-expert-review-queue/${selected.id}/skip`, {
        method: "POST",
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? t("skipError"));
      }
      setSelectedId(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("skipError"));
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <p className="text-aistroyka-subheadline text-aistroyka-text-secondary">{t("loading")}</p>;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <h2 className="text-aistroyka-title3 font-semibold text-aistroyka-text-primary">{t("pendingTitle")}</h2>
        {items.length === 0 ? (
          <p className="mt-4 text-aistroyka-subheadline text-aistroyka-text-secondary">{t("empty")}</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {items.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className={`w-full rounded-md border px-3 py-2 text-left text-aistroyka-subheadline ${
                    selectedId === item.id
                      ? "border-aistroyka-accent bg-aistroyka-surface-raised"
                      : "border-aistroyka-border-subtle"
                  }`}
                >
                  <span className="font-medium">{item.taskType}</span>
                  <span className="text-aistroyka-text-secondary"> · {item.audience}</span>
                  <span className="block text-aistroyka-footnote text-aistroyka-text-tertiary">
                    {item.provenance} / {item.priority}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <h2 className="text-aistroyka-title3 font-semibold text-aistroyka-text-primary">{t("reviewTitle")}</h2>
        {!selected ? (
          <p className="mt-4 text-aistroyka-subheadline text-aistroyka-text-secondary">{t("selectItem")}</p>
        ) : (
          <div className="mt-4 space-y-4">
            <div>
              <p className="text-aistroyka-footnote font-medium text-aistroyka-text-secondary">{t("inputLabel")}</p>
              <pre className="mt-1 max-h-32 overflow-auto rounded border border-aistroyka-border-subtle bg-aistroyka-surface-raised p-2 text-aistroyka-footnote">
                {JSON.stringify(selected.inputJson, null, 2)}
              </pre>
            </div>
            <div>
              <p className="text-aistroyka-footnote font-medium text-aistroyka-text-secondary">{t("modelOutputLabel")}</p>
              <pre className="mt-1 max-h-32 overflow-auto rounded border border-aistroyka-border-subtle bg-aistroyka-surface-raised p-2 text-aistroyka-footnote">
                {JSON.stringify(selected.modelOutputJson, null, 2)}
              </pre>
            </div>

            <label className="block text-aistroyka-subheadline">
              {t("verdictLabel")}
              <select
                className="mt-1 w-full rounded-md border border-aistroyka-border-subtle px-2 py-1"
                value={verdict}
                onChange={(e) => setVerdict(e.target.value)}
              >
                {VERDICTS.map((v) => (
                  <option key={v} value={v}>
                    {t(`verdict.${v}`)}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-aistroyka-subheadline">
              {t("conclusionLabel")}
              <textarea
                className="mt-1 w-full rounded-md border border-aistroyka-border-subtle px-2 py-1"
                rows={3}
                value={conclusion}
                onChange={(e) => setConclusion(e.target.value)}
              />
            </label>

            <label className="block text-aistroyka-subheadline">
              {t("rationaleLabel")}
              <textarea
                className="mt-1 w-full rounded-md border border-aistroyka-border-subtle px-2 py-1"
                rows={2}
                value={rationale}
                onChange={(e) => setRationale(e.target.value)}
              />
            </label>

            <label className="block text-aistroyka-subheadline">
              {t("correctedJsonLabel")}
              <textarea
                className="mt-1 w-full rounded-md border border-aistroyka-border-subtle px-2 py-1 font-mono text-aistroyka-footnote"
                rows={4}
                value={correctedJson}
                onChange={(e) => setCorrectedJson(e.target.value)}
              />
            </label>

            <div className="flex gap-3">
              <button
                type="button"
                disabled={busy || !conclusion.trim()}
                onClick={() => void submit()}
                className="rounded-md bg-aistroyka-accent px-4 py-2 text-aistroyka-subheadline font-medium text-white disabled:opacity-50"
              >
                {busy ? t("submitting") : t("submit")}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void skip()}
                className="rounded-md border border-aistroyka-border-subtle px-4 py-2 text-aistroyka-subheadline"
              >
                {t("skip")}
              </button>
            </div>
          </div>
        )}
        {error ? <p className="mt-4 text-aistroyka-footnote text-aistroyka-error">{error}</p> : null}
      </Card>
    </div>
  );
}
