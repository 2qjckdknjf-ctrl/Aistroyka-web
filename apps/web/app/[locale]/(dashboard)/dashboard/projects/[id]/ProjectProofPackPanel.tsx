"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, Button, Skeleton, Input } from "@/components/ui";
import { getPublicConfig } from "@/lib/config/public";

interface ProofPackPreview {
  generated_at: string;
  project: { id: string; name: string };
  progress: { tasks_done: number; tasks_total: number };
  media: { id: string; category: string }[];
  documents: unknown[];
  decisions: unknown[];
  approved_commercial_changes: unknown[];
}

async function fetchPack(projectId: string): Promise<ProofPackPreview | null> {
  const res = await fetch(`/api/v1/projects/${projectId}/proof-pack`, { credentials: "include" });
  if (!res.ok) return null;
  const j = await res.json();
  return j.data ?? null;
}

function absoluteShareUrl(path: string): string {
  const base = (getPublicConfig().NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
  if (!base) return path;
  return `${base}${path}`;
}

export function ProjectProofPackPanel({ projectId }: { projectId: string }) {
  const t = useTranslations("dashboardDetail");
  const qc = useQueryClient();
  const [expiresAt, setExpiresAt] = useState("");
  const [lastShare, setLastShare] = useState<{ token: string; url: string } | null>(null);

  const query = useQuery({
    queryKey: ["project-proof-pack", projectId],
    queryFn: () => fetchPack(projectId),
    enabled: !!projectId,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/v1/projects/${projectId}/proof-pack`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expires_at: expiresAt.trim() || null,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((j as { error?: string }).error ?? "Failed");
      return j.data as { token: string; url: string };
    },
    onSuccess: (data) => {
      setLastShare({ token: data.token, url: data.url });
    },
  });

  const revokeMutation = useMutation({
    mutationFn: async (token: string) => {
      const res = await fetch(`/api/v1/projects/${projectId}/proof-pack/shares/${token}`, {
        method: "DELETE",
        credentials: "include",
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((j as { error?: string }).error ?? "Failed");
    },
    onSuccess: () => {
      setLastShare(null);
      qc.invalidateQueries({ queryKey: ["project-proof-pack", projectId] });
    },
  });

  if (query.isPending) return <Skeleton className="h-36 mb-6" />;
  if (query.isError || !query.data) {
    return (
      <Card className="mb-6 p-4 border-l-4 border-l-aistroyka-warning">
        <p className="text-sm text-aistroyka-text-secondary">{t("proofPackLoadFailed")}</p>
      </Card>
    );
  }

  const d = query.data;
  const fullUrl = lastShare ? absoluteShareUrl(lastShare.url) : null;

  return (
    <Card className="mb-6 border-l-4 border-l-aistroyka-accent p-4">
      <h3 className="text-aistroyka-subheadline font-semibold text-aistroyka-text-primary">
        {t("proofPackHeading")}
      </h3>
      <p className="mt-1 text-sm text-aistroyka-text-secondary">{t("proofPackManagerHint")}</p>
      <p className="mt-3 text-sm text-aistroyka-text-primary">
        {t("proofPackPreviewSummary", {
          media: String(d.media.length),
          docs: String(d.documents.length),
          decisions: String(d.decisions.length),
          commercial: String(d.approved_commercial_changes.length),
          done: String(d.progress.tasks_done),
          total: String(d.progress.tasks_total),
        })}
      </p>
      <p className="mt-1 text-xs text-aistroyka-text-tertiary">{t("proofPackPublicMediaHint")}</p>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-aistroyka-text-secondary">{t("proofPackExpiresOptional")}</span>
          <Input
            type="datetime-local"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            className="min-w-[200px]"
          />
        </label>
        <Button
          type="button"
          variant="primary"
          size="sm"
          disabled={createMutation.isPending}
          onClick={() => createMutation.mutate()}
        >
          {createMutation.isPending ? t("proofPackCreating") : t("proofPackCreateLink")}
        </Button>
      </div>
      {createMutation.isError ? (
        <p className="mt-2 text-sm text-aistroyka-error">{(createMutation.error as Error).message}</p>
      ) : null}

      {fullUrl ? (
        <div className="mt-4 surface-glass-muted rounded p-3">
          <p className="text-xs font-medium uppercase text-aistroyka-text-tertiary">{t("proofPackShareUrl")}</p>
          <p className="mt-1 break-all font-mono text-sm text-aistroyka-accent">{fullUrl}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => navigator.clipboard.writeText(fullUrl)}
            >
              {t("proofPackCopyUrl")}
            </Button>
            <a
              href={fullUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center rounded-md border border-aistroyka-border-subtle px-3 py-1.5 text-sm font-semibold text-aistroyka-accent hover:underline"
            >
              {t("proofPackOpenPublic")}
            </a>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={revokeMutation.isPending || !lastShare}
              onClick={() => lastShare && revokeMutation.mutate(lastShare.token)}
            >
              {t("proofPackRevokeLink")}
            </Button>
          </div>
          {revokeMutation.isError ? (
            <p className="mt-2 text-sm text-aistroyka-error">{(revokeMutation.error as Error).message}</p>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}
