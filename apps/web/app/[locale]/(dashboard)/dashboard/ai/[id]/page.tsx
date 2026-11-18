"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { Skeleton, EmptyState, Badge, Button } from "@/components/ui";
import { CanonPageHeader } from "@/components/canon";

interface AIDetail {
  id: string;
  type: string;
  status: string;
  payload?: unknown;
  attempts: number;
  max_attempts: number | null;
  last_error: string | null;
  last_error_type: string | null;
  user_message_key?: string;
  trace_id: string | null;
  created_at: string;
  updated_at: string;
  vision_configured?: boolean;
}

function CopyIdButton({
  id,
  label = "Copy ID",
  copiedLabel = "Copied",
}: {
  id: string;
  label?: string;
  copiedLabel?: string;
}) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(id).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <Button variant="secondary" onClick={copy} className="text-sm">
      {copied ? copiedLabel : label}
    </Button>
  );
}

function riskDecisionLabel(
  tDetail: ReturnType<typeof useTranslations<"dashboardDetail">>,
  decision: string
): string {
  switch (decision) {
    case "accept":
      return tDetail("riskDecision_accept");
    case "assign":
      return tDetail("riskDecision_assign");
    case "reject":
      return tDetail("riskDecision_reject");
    default:
      return decision;
  }
}

function friendlyMessage(
  tDetail: ReturnType<typeof useTranslations<"dashboardDetail">>,
  data: AIDetail
): string {
  const key = data.user_message_key;
  if (key === "aiStatusQueued") return tDetail("aiStatusQueued");
  if (key === "aiStatusRunning") return tDetail("aiStatusRunning");
  if (key === "aiStatusSuccess") return tDetail("aiStatusSuccess");
  if (key === "aiStatusTemporary") return tDetail("aiStatusTemporary");
  if (key === "aiStatusNotConfigured") return tDetail("aiStatusNotConfigured");
  if (key === "aiStatusFailed") return tDetail("aiStatusFailed");
  if (data.status === "queued") return tDetail("aiStatusQueued");
  if (data.status === "running") return tDetail("aiStatusRunning");
  if (data.status === "success") return tDetail("aiStatusSuccess");
  return tDetail("aiStatusFailed");
}

export default function AIRequestDetailPage() {
  const tNav = useTranslations("nav");
  const tPage = useTranslations("dashboardPageMeta");
  const tDetail = useTranslations("dashboardDetail");
  const params = useParams();
  const id = params?.id as string | undefined;
  const [data, setData] = useState<AIDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [decision, setDecision] = useState<string | null>(null);
  const [decisionBusy, setDecisionBusy] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/v1/ai/requests/${id}`, { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((json: { data: AIDetail }) => {
        setData(json.data);
        setError(null);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Failed to load");
        setData(null);
      })
      .finally(() => setLoading(false));
    fetch(`/api/v1/ai/risk-decisions?job_id=${encodeURIComponent(id)}&limit=1`, { credentials: "include" })
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((json: { data?: { decision?: string }[] }) => {
        setDecision(json.data?.[0]?.decision ?? null);
      })
      .catch(() => setDecision(null));
  }, [id]);

  const submitDecision = (next: "accept" | "assign" | "reject") => {
    if (!id || decisionBusy) return;
    setDecisionBusy(true);
    fetch("/api/v1/ai/risk-decisions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ job_id: id, decision: next, title: data?.type ?? "" }),
    })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((json: { data?: { decision?: string } }) => {
        setDecision(json.data?.decision ?? next);
      })
      .catch(() => {})
      .finally(() => setDecisionBusy(false));
  };

  if (!id) {
    return (
      <div className="canon-glass p-4">
        <p className="text-[var(--canon-text-secondary)]">{tDetail("missingRequestId")}</p>
      </div>
    );
  }

  if (loading && !data) {
    return (
      <div className="canon-glass p-4">
        <Skeleton lines={6} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="canon-glass p-4">
        <EmptyState
          icon={<span className="text-2xl" aria-hidden>⚠️</span>}
          title={tDetail("requestNotFound")}
          subtitle={error ?? tDetail("accessDeniedHint")}
          action={
            <Link href="/dashboard/ai" className="text-[var(--canon-cyan)] hover:underline">
              {tDetail("backToAi")}
            </Link>
          }
        />
      </div>
    );
  }

  const showTechnical =
    data.status === "failed" || data.status === "dead" || data.status === "queued";

  return (
    <div className="space-y-6">
      <CanonPageHeader
        title={`${tNav("ai")} ${data.id.slice(0, 8)}…`}
        subtitle={tPage("aiRequestDetailSubtitle")}
        showFavorite={false}
        actions={
          <>
            <Link href="/dashboard/ai" className="canon-ghost-btn text-sm">
              {tDetail("backToAi")}
            </Link>
            <CopyIdButton id={data.id} label={tDetail("copyId")} copiedLabel={tDetail("copied")} />
          </>
        }
      />

      <div className="canon-glass p-4 space-y-3">
        <p className="text-sm font-semibold text-[var(--canon-text-primary)]">{tDetail("riskDecisions")}</p>
        {decision ? (
          <p className="text-sm text-[var(--canon-text-secondary)]">
            {tDetail("riskDecisionSaved")}: {riskDecisionLabel(tDetail, decision)}
          </p>
        ) : (
          <p className="text-sm text-[var(--canon-text-muted)]">{tDetail("riskDecisionHint")}</p>
        )}
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" disabled={decisionBusy} onClick={() => submitDecision("accept")}>
            {tDetail("riskDecision_accept")}
          </Button>
          <Button variant="secondary" size="sm" disabled={decisionBusy} onClick={() => submitDecision("assign")}>
            {tDetail("riskDecision_assign")}
          </Button>
          <Button variant="secondary" size="sm" disabled={decisionBusy} onClick={() => submitDecision("reject")}>
            {tDetail("riskDecision_reject")}
          </Button>
        </div>
      </div>

      <div className="canon-glass p-4">
        <p className="mb-4 text-sm text-[var(--canon-text-secondary)]">{friendlyMessage(tDetail, data)}</p>
        <dl className="grid gap-2 sm:grid-cols-2 text-sm">
          <div>
            <dt className="text-xs font-bold uppercase tracking-wide text-[var(--canon-text-muted)]">{tDetail("type")}</dt>
            <dd className="text-[var(--canon-text-primary)]">{data.type}</dd>
          </div>
          <div>
            <dt className="text-xs font-bold uppercase tracking-wide text-[var(--canon-text-muted)]">{tDetail("status")}</dt>
            <dd>
              <Badge
                variant={
                  data.status === "success"
                    ? "success"
                    : data.status === "failed" || data.status === "dead"
                      ? "danger"
                      : "warning"
                }
              >
                {data.status}
              </Badge>
            </dd>
          </div>
          <div>
            <dt className="text-xs font-bold uppercase tracking-wide text-[var(--canon-text-muted)]">{tDetail("attempts")}</dt>
            <dd className="tabular-nums text-[var(--canon-text-primary)]">
              {data.attempts}
              {data.max_attempts != null ? ` / ${data.max_attempts}` : ""}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-bold uppercase tracking-wide text-[var(--canon-text-muted)]">{tDetail("created")}</dt>
            <dd className="tabular-nums text-[var(--canon-text-primary)]">{new Date(data.created_at).toLocaleString()}</dd>
          </div>
          <div>
            <dt className="text-xs font-bold uppercase tracking-wide text-[var(--canon-text-muted)]">{tDetail("updated")}</dt>
            <dd className="tabular-nums text-[var(--canon-text-primary)]">{new Date(data.updated_at).toLocaleString()}</dd>
          </div>
        </dl>
      </div>

      {showTechnical && (data.last_error_type || data.last_error) ? (
        <div className="canon-glass border-l-4 border-l-[var(--canon-warning)] p-4">
          <h3 className="font-semibold text-[var(--canon-text-primary)] mb-2">{tDetail("aiSafeDiagnostics")}</h3>
          {data.last_error_type ? (
            <p className="text-xs text-[var(--canon-text-muted)] mb-1">
              {tDetail("aiErrorCode")}: {data.last_error_type}
            </p>
          ) : null}
          {data.last_error ? (
            <p className="text-sm text-[var(--canon-text-secondary)] whitespace-pre-wrap">{data.last_error}</p>
          ) : null}
          <p className="mt-2 text-xs text-[var(--canon-text-muted)]">{tDetail("aiAdminDiagnosticsHint")}</p>
        </div>
      ) : null}

      <div className="canon-glass p-4">
        <h3 className="font-semibold text-[var(--canon-text-primary)] mb-2">{tDetail("payloadMetadata")}</h3>
        <pre className="text-xs font-mono rounded-lg bg-[rgba(0,0,0,0.25)] p-4 overflow-x-auto whitespace-pre-wrap text-[var(--canon-text-secondary)]">
          {JSON.stringify(data.payload ?? {}, null, 2)}
        </pre>
      </div>
    </div>
  );
}
