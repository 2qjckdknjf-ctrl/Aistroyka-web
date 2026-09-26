"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui";
import {
  fieldDailyLogDraftBody,
  persistThenConfirmFieldDailyLog,
} from "@/lib/domain/field-daily-log/field-daily-log-form";

type FieldDailyLogStatus = "draft" | "confirmed";

interface FieldDailyLog {
  id: string;
  work_date: string;
  status: FieldDailyLogStatus;
  note: string | null;
  summary: string | null;
  work_done: string | null;
  blockers: string | null;
  weather: string | null;
  media_refs: string[];
  created_by: string | null;
  confirmed_at: string | null;
  confirmed_by: string | null;
  created_at: string;
  updated_at: string;
}

function todayIsoDate(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function ProjectFieldDailyLogPanel({ projectId }: { projectId: string }) {
  const t = useTranslations("projectDetail");
  const [workDate, setWorkDate] = useState(todayIsoDate);
  const [note, setNote] = useState("");
  const [summary, setSummary] = useState("");
  const [workDone, setWorkDone] = useState("");
  const [blockers, setBlockers] = useState("");
  const [weather, setWeather] = useState("");
  const [mediaRef, setMediaRef] = useState("");
  const [logs, setLogs] = useState<FieldDailyLog[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const selected = logs.find((l) => l.id === selectedId) ?? null;
  const isDraft = selected?.status === "draft";

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch(`/api/v1/projects/${projectId}/field-daily-logs?limit=20`, {
        credentials: "include",
      });
      const json = (await res.json()) as { data?: FieldDailyLog[]; error?: string };
      if (!res.ok) throw new Error(json.error ?? t("fieldDailyError"));
      setLogs(json.data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("fieldDailyError"));
    }
  }, [projectId, t]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!selected) return;
    setWorkDate(selected.work_date);
    setNote(selected.note ?? "");
    setSummary(selected.summary ?? "");
    setWorkDone(selected.work_done ?? "");
    setBlockers(selected.blockers ?? "");
    setWeather(selected.weather ?? "");
    setMediaRef(selected.media_refs[0] ?? "");
  }, [selected]);

  const createDraft = useCallback(async () => {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const media_refs = mediaRef.trim() ? [mediaRef.trim()] : [];
      const res = await fetch(`/api/v1/projects/${projectId}/field-daily-logs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          work_date: workDate,
          note: note.trim() || undefined,
          summary: summary.trim() || undefined,
          work_done: workDone.trim() || undefined,
          blockers: blockers.trim() || undefined,
          weather: weather.trim() || undefined,
          media_refs: media_refs.length ? media_refs : undefined,
        }),
      });
      const json = (await res.json()) as { data?: FieldDailyLog; error?: string };
      if (!res.ok) throw new Error(json.error ?? t("fieldDailyError"));
      setMessage(t("fieldDailyDraftCreated"));
      setSelectedId(json.data?.id ?? null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("fieldDailyError"));
    } finally {
      setLoading(false);
    }
  }, [
    blockers,
    load,
    mediaRef,
    note,
    projectId,
    summary,
    t,
    weather,
    workDate,
    workDone,
  ]);

  const saveDraft = useCallback(async () => {
    if (!selectedId || !isDraft) return;
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/v1/projects/${projectId}/field-daily-logs/${selectedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(
          fieldDailyLogDraftBody(
            { workDate, note, summary, workDone, blockers, weather, mediaRef },
            selected?.media_refs
          )
        ),
      });
      const json = (await res.json()) as { data?: FieldDailyLog; error?: string };
      if (!res.ok) throw new Error(json.error ?? t("fieldDailyError"));
      setMessage(t("fieldDailyDraftSaved"));
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("fieldDailyError"));
    } finally {
      setLoading(false);
    }
  }, [
    blockers,
    isDraft,
    load,
    mediaRef,
    note,
    projectId,
    selected?.media_refs,
    selectedId,
    summary,
    t,
    weather,
    workDate,
    workDone,
  ]);

  const confirmLog = useCallback(async () => {
    if (!selectedId || !isDraft) return;
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const result = await persistThenConfirmFieldDailyLog(
        fetch,
        projectId,
        selectedId,
        { workDate, note, summary, workDone, blockers, weather, mediaRef },
        selected?.media_refs
      );
      if (!result.ok) throw new Error(result.error || t("fieldDailyError"));
      setMessage(t("fieldDailyConfirmed"));
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("fieldDailyError"));
    } finally {
      setLoading(false);
    }
  }, [
    blockers,
    isDraft,
    load,
    mediaRef,
    note,
    projectId,
    selected?.media_refs,
    selectedId,
    summary,
    t,
    weather,
    workDate,
    workDone,
  ]);

  const resetNew = () => {
    setSelectedId(null);
    setWorkDate(todayIsoDate());
    setNote("");
    setSummary("");
    setWorkDone("");
    setBlockers("");
    setWeather("");
    setMediaRef("");
    setMessage(null);
    setError(null);
  };

  return (
    <div className="space-y-aistroyka-4 p-4">
      <p className="text-sm text-aistroyka-text-secondary">{t("fieldDailyIntro")}</p>

      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label htmlFor="field-daily-date" className="mb-1 block text-sm font-medium text-aistroyka-text-primary">
            {t("fieldDailyWorkDateLabel")}
          </label>
          <input
            id="field-daily-date"
            type="date"
            value={workDate}
            onChange={(e) => setWorkDate(e.target.value)}
            disabled={!!selected && !isDraft}
            className="max-w-xs rounded border border-aistroyka-border-subtle bg-aistroyka-bg-primary px-3 py-2 text-sm text-aistroyka-text-primary focus:outline-none focus:ring-2 focus:ring-aistroyka-accent focus:ring-offset-2 disabled:opacity-60"
          />
        </div>
        <div>
          <label htmlFor="field-daily-media" className="mb-1 block text-sm font-medium text-aistroyka-text-primary">
            {t("fieldDailyMediaRefLabel")}
          </label>
          <input
            id="field-daily-media"
            type="text"
            value={mediaRef}
            onChange={(e) => setMediaRef(e.target.value)}
            disabled={!!selected && !isDraft}
            placeholder={t("fieldDailyMediaRefPlaceholder")}
            className="w-full rounded border border-aistroyka-border-subtle bg-aistroyka-bg-primary px-3 py-2 text-sm text-aistroyka-text-primary placeholder:text-aistroyka-text-tertiary focus:outline-none focus:ring-2 focus:ring-aistroyka-accent focus:ring-offset-2 disabled:opacity-60"
          />
        </div>
      </div>

      <div>
        <label htmlFor="field-daily-note" className="mb-1 block text-sm font-medium text-aistroyka-text-primary">
          {t("fieldDailyNoteLabel")}
        </label>
        <textarea
          id="field-daily-note"
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          disabled={!!selected && !isDraft}
          placeholder={t("fieldDailyNotePlaceholder")}
          className="w-full rounded border border-aistroyka-border-subtle bg-aistroyka-bg-primary px-3 py-2 text-sm text-aistroyka-text-primary placeholder:text-aistroyka-text-tertiary focus:outline-none focus:ring-2 focus:ring-aistroyka-accent focus:ring-offset-2 disabled:opacity-60"
        />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label htmlFor="field-daily-summary" className="mb-1 block text-sm font-medium text-aistroyka-text-primary">
            {t("fieldDailySummaryLabel")}
          </label>
          <textarea
            id="field-daily-summary"
            rows={2}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            disabled={!!selected && !isDraft}
            className="w-full rounded border border-aistroyka-border-subtle bg-aistroyka-bg-primary px-3 py-2 text-sm text-aistroyka-text-primary focus:outline-none focus:ring-2 focus:ring-aistroyka-accent focus:ring-offset-2 disabled:opacity-60"
          />
        </div>
        <div>
          <label htmlFor="field-daily-work-done" className="mb-1 block text-sm font-medium text-aistroyka-text-primary">
            {t("fieldDailyWorkDoneLabel")}
          </label>
          <textarea
            id="field-daily-work-done"
            rows={2}
            value={workDone}
            onChange={(e) => setWorkDone(e.target.value)}
            disabled={!!selected && !isDraft}
            className="w-full rounded border border-aistroyka-border-subtle bg-aistroyka-bg-primary px-3 py-2 text-sm text-aistroyka-text-primary focus:outline-none focus:ring-2 focus:ring-aistroyka-accent focus:ring-offset-2 disabled:opacity-60"
          />
        </div>
        <div>
          <label htmlFor="field-daily-blockers" className="mb-1 block text-sm font-medium text-aistroyka-text-primary">
            {t("fieldDailyBlockersLabel")}
          </label>
          <textarea
            id="field-daily-blockers"
            rows={2}
            value={blockers}
            onChange={(e) => setBlockers(e.target.value)}
            disabled={!!selected && !isDraft}
            className="w-full rounded border border-aistroyka-border-subtle bg-aistroyka-bg-primary px-3 py-2 text-sm text-aistroyka-text-primary focus:outline-none focus:ring-2 focus:ring-aistroyka-accent focus:ring-offset-2 disabled:opacity-60"
          />
        </div>
        <div>
          <label htmlFor="field-daily-weather" className="mb-1 block text-sm font-medium text-aistroyka-text-primary">
            {t("fieldDailyWeatherLabel")}
          </label>
          <input
            id="field-daily-weather"
            type="text"
            value={weather}
            onChange={(e) => setWeather(e.target.value)}
            disabled={!!selected && !isDraft}
            className="w-full rounded border border-aistroyka-border-subtle bg-aistroyka-bg-primary px-3 py-2 text-sm text-aistroyka-text-primary focus:outline-none focus:ring-2 focus:ring-aistroyka-accent focus:ring-offset-2 disabled:opacity-60"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {!selected ? (
          <Button type="button" onClick={createDraft} disabled={loading} loading={loading}>
            {t("fieldDailyCreateDraft")}
          </Button>
        ) : null}
        {selected && isDraft ? (
          <>
            <Button type="button" onClick={saveDraft} disabled={loading} loading={loading}>
              {t("fieldDailySaveDraft")}
            </Button>
            <Button type="button" onClick={confirmLog} disabled={loading} loading={loading}>
              {t("fieldDailyConfirm")}
            </Button>
          </>
        ) : null}
        <Button type="button" variant="ghost" onClick={resetNew} disabled={loading}>
          {t("fieldDailyNew")}
        </Button>
      </div>

      {error ? (
        <div
          className="rounded border border-aistroyka-danger/40 bg-aistroyka-danger/10 px-3 py-2 text-sm text-aistroyka-text-primary"
          role="alert"
        >
          {error}
        </div>
      ) : null}
      {message ? (
        <div className="rounded border border-aistroyka-border-subtle bg-aistroyka-surface-muted/40 px-3 py-2 text-sm text-aistroyka-text-secondary">
          {message}
        </div>
      ) : null}

      <div className="space-y-2">
        <h3 className="text-sm font-medium text-aistroyka-text-primary">{t("fieldDailyRecent")}</h3>
        {logs.length === 0 ? (
          <p className="text-sm text-aistroyka-text-tertiary">{t("fieldDailyEmpty")}</p>
        ) : (
          <ul className="divide-y divide-aistroyka-border-subtle rounded border border-aistroyka-border-subtle">
            {logs.map((log) => (
              <li key={log.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(log.id)}
                  className={`flex w-full items-start justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-aistroyka-surface-muted/50 ${
                    selectedId === log.id ? "bg-aistroyka-surface-muted/40" : ""
                  }`}
                >
                  <span>
                    <span className="font-medium text-aistroyka-text-primary">{log.work_date}</span>
                    <span className="mt-0.5 block text-aistroyka-text-secondary">
                      {(log.summary || log.note || "—").slice(0, 120)}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs uppercase tracking-wide text-aistroyka-text-tertiary">
                    {log.status === "draft" ? t("fieldDailyStatusDraft") : t("fieldDailyStatusConfirmed")}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
