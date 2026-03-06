"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { Card, SectionHeader, Skeleton, EmptyState, Badge, Button } from "@/components/ui";

interface AIDetail {
  id: string;
  type: string;
  status: string;
  payload?: unknown;
  attempts: number;
  max_attempts: number;
  last_error: string | null;
  last_error_type: string | null;
  trace_id: string | null;
  created_at: string;
  updated_at: string;
}

function CopyIdButton({ id }: { id: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(id).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <Button variant="secondary" onClick={copy} className="text-sm">
      {copied ? "Copied" : "Copy ID"}
    </Button>
  );
}

export default function AIRequestDetailPage() {
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
      <Card>
        <p className="text-aistroyka-text-secondary p-4">Missing request id.</p>
      </Card>
    );
  }

  if (loading && !data) {
    return (
      <Card>
        <Skeleton lines={6} />
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <EmptyState
          icon={<span className="text-2xl">⚠️</span>}
          title="Request not found"
          subtitle={error ?? "You may not have access."}
          action={<Link href="/dashboard/ai" className="text-aistroyka-accent hover:underline">← Back to AI</Link>}
        />
      </Card>
    );
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Link href="/dashboard/ai" className="text-aistroyka-subheadline text-aistroyka-accent hover:underline">← AI</Link>
        <CopyIdButton id={data.id} />
      </div>
      <SectionHeader title={`AI request ${data.id.slice(0, 8)}…`} subtitle="Job detail: payload, errors, metadata." />

      <Card className="mb-4">
        <dl className="grid gap-2 sm:grid-cols-2">
          <div>
            <dt className="text-aistroyka-caption text-aistroyka-text-tertiary">Type</dt>
            <dd>{data.type}</dd>
          </div>
          <div>
            <dt className="text-aistroyka-caption text-aistroyka-text-tertiary">Status</dt>
            <dd><Badge variant={data.status === "success" ? "success" : data.status === "failed" || data.status === "dead" ? "danger" : "warning"}>{data.status}</Badge></dd>
          </div>
          <div>
            <dt className="text-aistroyka-caption text-aistroyka-text-tertiary">Attempts</dt>
            <dd className="tabular-nums">{data.attempts} / {data.max_attempts}</dd>
          </div>
          <div>
            <dt className="text-aistroyka-caption text-aistroyka-text-tertiary">Trace ID</dt>
            <dd className="font-mono text-sm">{data.trace_id ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-aistroyka-caption text-aistroyka-text-tertiary">Created</dt>
            <dd className="tabular-nums">{new Date(data.created_at).toLocaleString()}</dd>
          </div>
          <div>
            <dt className="text-aistroyka-caption text-aistroyka-text-tertiary">Updated</dt>
            <dd className="tabular-nums">{new Date(data.updated_at).toLocaleString()}</dd>
          </div>
        </dl>
      </Card>

      {data.last_error && (
        <Card className="mb-4 border-l-4 border-l-aistroyka-error">
          <h3 className="text-aistroyka-headline font-semibold text-aistroyka-text-primary mb-2">Error</h3>
          <p className="text-aistroyka-subheadline text-aistroyka-text-secondary font-mono whitespace-pre-wrap">{data.last_error}</p>
          {data.last_error_type && <p className="mt-1 text-aistroyka-caption text-aistroyka-text-tertiary">{data.last_error_type}</p>}
        </Card>
      )}

      <Card>
        <h3 className="text-aistroyka-headline font-semibold text-aistroyka-text-primary mb-2">Payload / decision metadata</h3>
        <pre className="text-aistroyka-caption font-mono bg-aistroyka-surface-muted p-4 rounded overflow-x-auto whitespace-pre-wrap">
          {JSON.stringify(data.payload ?? {}, null, 2)}
        </pre>
      </Card>
    </>
  );
}
