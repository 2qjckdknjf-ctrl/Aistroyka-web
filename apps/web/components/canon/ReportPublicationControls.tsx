"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";

type Item = { attachment_id: string; media_id: string | null; upload_session_id: string | null;
  published: boolean; eligible: boolean; evidence_id: string | null; version: string | null };
type State = { report_id: string; project_id: string; report_status: string; portal_enabled: boolean; items: Item[] };

type Preview = { media_id: string | null; upload_session_id: string | null; file_url?: string | null };
export function ReportPublicationControls({ reportId, previews }: { reportId: string; previews: Preview[] }) {
  const t = useTranslations("dashboardDetail");
  const [state, setState] = useState<State | null>(null);
  const [error, setError] = useState<"load" | "stale" | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [forbidden, setForbidden] = useState(false);
  const generation = useRef(0);
  const mounted = useRef(false);
  const endpoint = `/api/v1/reports/${encodeURIComponent(reportId)}/publication`;
  const load = useCallback(async () => {
    const current = ++generation.current;
    setLoading(true);
    try {
      const response = await fetch(endpoint, { credentials: "include", cache: "no-store" });
      if (response.status === 403) {
        if (current === generation.current) { setState(null); setError(null); setForbidden(true); }
        return;
      }
      if (!response.ok) throw new Error("load");
      const result = await response.json() as { data: State };
      if (current !== generation.current) return;
      if (result.data?.report_id !== reportId || !Array.isArray(result.data.items)) throw new Error("load");
      setState(result.data); setError(null); setForbidden(false);
    } catch {
      if (current === generation.current) { setState(null); setError("load"); }
    } finally { if (current === generation.current) setLoading(false); }
  }, [endpoint, reportId]);
  useEffect(() => {
    mounted.current = true;
    void load();
    const refresh = () => { void load(); };
    window.addEventListener("focus", refresh);
    return () => {
      mounted.current = false;
      // Invalidate the latest request generation, rather than a DOM ref snapshot.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      ++generation.current;
      window.removeEventListener("focus", refresh);
    };
  }, [load]);

  async function toggle(item: Item) {
    if (busy) return;
    setBusy(true); setError(null);
    const current = generation.current;
    try {
      const response = await fetch(endpoint, { method: "PATCH", credentials: "include", cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attachment_id: item.attachment_id, visible: !item.published, expected_version: item.version }) });
      if (!mounted.current) return;
      if (response.ok) { await load(); return; }
      if (current !== generation.current) { await load(); return; }
      setState(null); setError(response.status === 409 ? "stale" : "load");
    } catch {
      if (!mounted.current) return;
      if (current !== generation.current) { await load(); return; }
      setState(null); setError("load");
    } finally { if (mounted.current) setBusy(false); }
  }
  if (forbidden) return null;
  return <section className="canon-glass p-4 space-y-3" aria-label={t("reportPublicationTitle")}>
    <h2 className="canon-section-title">{t("reportPublicationTitle")}</h2>
    <p className="text-sm text-[var(--canon-text-secondary)]">{t("reportPublicationHint")}</p>
    {loading && <p role="status">{t("loading")}</p>}
    {error && <div role="alert"><p>{t(error === "stale" ? "reportPublicationStale" : "reportPublicationError")}</p>
      <button type="button" className="canon-ghost-btn mt-2" disabled={loading || busy} onClick={() => void load()}>{t("reportPublicationRefresh")}</button></div>}
    {!loading && state && <>
      {(state.report_status !== "approved" || !state.portal_enabled) && <p>{t("reportPublicationPrerequisite")}</p>}
      {state.items.length === 0 && <p>{t("reportPublicationEmpty")}</p>}
      <ul className="space-y-2">{state.items.map((item, index) => {
        const preview = previews.find(row => row.media_id === item.media_id && row.upload_session_id === item.upload_session_id)?.file_url;
        return <li key={item.attachment_id} className="flex flex-wrap items-center gap-3">
        {preview && <Image src={preview} alt={t("reportPublicationPhoto", { number: index + 1 })} width={80} height={80} unoptimized className="rounded object-contain" />}
        <span>{t("reportPublicationPhoto", { number: index + 1 })}</span>
        <span>{t(item.published ? "reportPublicationVisible" : "reportPublicationPrivate")}</span>
        <button type="button" className="canon-ghost-btn" disabled={busy || loading || (!item.published && (!item.eligible || state.report_status !== "approved" || !state.portal_enabled))}
          aria-label={t(item.published ? "reportPublicationWithdrawPhoto" : "reportPublicationPublishPhoto", { number: index + 1 })}
          onClick={() => void toggle(item)}>{t(item.published ? "reportPublicationWithdraw" : "reportPublicationPublish")}</button>
      </li>; })}</ul>
    </>}
  </section>;
}
