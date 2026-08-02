"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Card, Button } from "@/components/ui";

type Row = { id: string; name: string };
type LoadState =
  | { kind: "loading" }
  | { kind: "empty"; rows: [] }
  | { kind: "ready"; rows: Row[] }
  | { kind: "auth"; message: string }
  | { kind: "error"; message: string };

export function PortalProjectsListClient() {
  const t = useTranslations("portalPage");
  const [state, setState] = useState<LoadState>({ kind: "loading" });

  const load = useCallback(() => {
    setState({ kind: "loading" });
    fetch("/api/v1/portal/projects", { credentials: "include" })
      .then(async (r) => {
        if (r.status === 401 || r.status === 403) {
          setState({ kind: "auth", message: t("accessDenied") });
          return;
        }
        if (!r.ok) {
          setState({ kind: "error", message: t("loadError") });
          return;
        }
        const j = (await r.json()) as { data?: Row[] };
        const rows = j.data ?? [];
        setState(rows.length === 0 ? { kind: "empty", rows: [] } : { kind: "ready", rows });
      })
      .catch(() => {
        setState({ kind: "error", message: t("loadError") });
      });
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  if (state.kind === "loading") {
    return (
      <div
        className="h-24 animate-pulse rounded bg-aistroyka-surface-muted"
        role="status"
        aria-label={t("loading")}
      />
    );
  }

  if (state.kind === "auth") {
    return (
      <Card className="p-aistroyka-4">
        <p className="text-aistroyka-text-secondary" role="alert">
          {state.message}
        </p>
      </Card>
    );
  }

  if (state.kind === "error") {
    return (
      <Card className="flex flex-col gap-aistroyka-3 p-aistroyka-4">
        <p className="text-aistroyka-text-secondary" role="alert">
          {state.message}
        </p>
        <Button type="button" variant="secondary" onClick={load} aria-label={t("retry")}>
          {t("retry")}
        </Button>
      </Card>
    );
  }

  if (state.kind === "empty") {
    return <Card className="p-aistroyka-4 text-aistroyka-text-secondary">{t("empty")}</Card>;
  }

  return (
    <ul className="flex flex-col gap-aistroyka-3">
      {state.rows.map((p) => (
        <li key={p.id}>
          <Card className="flex flex-row flex-wrap items-center justify-between gap-aistroyka-4 p-aistroyka-4">
            <span className="font-medium text-aistroyka-text-primary">{p.name}</span>
            <Link
              href={`/dashboard/projects/${p.id}/client`}
              className="text-aistroyka-subheadline font-medium text-aistroyka-accent hover:underline"
            >
              {t("openPortal")} →
            </Link>
          </Card>
        </li>
      ))}
    </ul>
  );
}
