"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { SectionHeader, Skeleton, EmptyState, Badge, Button } from "@/components/ui";
import { DashboardGlassCard } from "@/components/dashboard/DashboardGlassCard";

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
  }, [id]);

  if (!id) {
    return (
      <DashboardGlassCard>
        <p className="text-aistroyka-text-secondary p-4">{tDetail("missingRequestId")}</p>
      </DashboardGlassCard>
    );
  }

  if (loading && !data) {
    return (
      <DashboardGlassCard>
        <Skeleton lines={6} />
      </DashboardGlassCard>
    );
  }

  if (error || !data) {
    return (
      <DashboardGlassCard>
        <EmptyState
          icon={<span className="text-2xl" aria-hidden>⚠️</span>}
          title={tDetail("requestNotFound")}
          subtitle={error ?? tDetail("accessDeniedHint")}
          action={
            <Link href="/dashboard/ai" className="text-aistroyka-accent hover:underline">
              {tDetail("backToAi")}
            </Link>
          }
        />
      </DashboardGlassCard>
    );
  }

  const showTechnical =
    data.status === "failed" || data.status === "dead" || data.status === "queued";

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Link
          href="/dashboard/ai"
          className="text-aistroyka-subheadline text-aistroyka-accent hover:underline"
        >
          {tDetail("aiShort")}
        </Link>
        <CopyIdButton id={data.id} label={tDetail("copyId")} copiedLabel={tDetail("copied")} />
      </div>
      <SectionHeader
        title={`${tNav("ai")} ${data.id.slice(0, 8)}…`}
        subtitle={tPage("aiRequestDetailSubtitle")}
      />

      <DashboardGlassCard className="mb-4">
        <p className="text-aistroyka-subheadline text-aistroyka-text-secondary mb-4">
          {friendlyMessage(tDetail, data)}
        </p>
        <dl className="grid gap-2 sm:grid-cols-2">
          <div>
            <dt className="text-aistroyka-caption text-aistroyka-text-tertiary">{tDetail("type")}</dt>
            <dd>{data.type}</dd>
          </div>
          <div>
            <dt className="text-aistroyka-caption text-aistroyka-text-tertiary">{tDetail("status")}</dt>
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
            <dt className="text-aistroyka-caption text-aistroyka-text-tertiary">
              {tDetail("attempts")}
            </dt>
            <dd className="tabular-nums">
              {data.attempts}
              {data.max_attempts != null ? ` / ${data.max_attempts}` : ""}
            </dd>
          </div>
          <div>
            <dt className="text-aistroyka-caption text-aistroyka-text-tertiary">
              {tDetail("created")}
            </dt>
            <dd className="tabular-nums">{new Date(data.created_at).toLocaleString()}</dd>
          </div>
          <div>
            <dt className="text-aistroyka-caption text-aistroyka-text-tertiary">
              {tDetail("updated")}
            </dt>
            <dd className="tabular-nums">{new Date(data.updated_at).toLocaleString()}</dd>
          </div>
        </dl>
      </DashboardGlassCard>

      {showTechnical && (data.last_error_type || data.last_error) && (
        <DashboardGlassCard className="mb-4 border-l-4 border-l-aistroyka-error">
          <h3 className="text-aistroyka-headline font-semibold text-aistroyka-text-primary mb-2">
            {tDetail("aiSafeDiagnostics")}
          </h3>
          {data.last_error_type && (
            <p className="text-aistroyka-caption text-aistroyka-text-tertiary mb-1">
              {tDetail("aiErrorCode")}: {data.last_error_type}
            </p>
          )}
          {data.last_error && (
            <p className="text-aistroyka-subheadline text-aistroyka-text-secondary whitespace-pre-wrap">
              {data.last_error}
            </p>
          )}
          <p className="mt-2 text-aistroyka-caption text-aistroyka-text-tertiary">
            {tDetail("aiAdminDiagnosticsHint")}
          </p>
        </DashboardGlassCard>
      )}

      <DashboardGlassCard>
        <h3 className="text-aistroyka-headline font-semibold text-aistroyka-text-primary mb-2">
          {tDetail("payloadMetadata")}
        </h3>
        <pre className="text-aistroyka-caption font-mono bg-aistroyka-surface-muted p-4 rounded overflow-x-auto whitespace-pre-wrap">
          {JSON.stringify(data.payload ?? {}, null, 2)}
        </pre>
      </DashboardGlassCard>
    </>
  );
}
