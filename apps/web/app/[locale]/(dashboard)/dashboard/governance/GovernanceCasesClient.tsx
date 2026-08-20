"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "@/i18n/navigation";
import {
  Badge,
  Button,
  Skeleton,
  ErrorState,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
} from "@/components/ui";
import type { GovernanceCaseWithProjects } from "@/lib/domain/governance/governance.types";
import { DashboardGlassCard } from "@/components/dashboard/DashboardGlassCard";

interface ProjectOption {
  id: string;
  name: string;
}

async function fetchCases(): Promise<GovernanceCaseWithProjects[]> {
  const res = await fetch("/api/v1/governance/cases", { credentials: "include" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(typeof err.error === "string" ? err.error : "Failed to load");
  }
  const j = await res.json();
  return j.data ?? [];
}

async function fetchProjects(): Promise<ProjectOption[]> {
  const res = await fetch("/api/v1/projects", { credentials: "include" });
  if (!res.ok) return [];
  const j = await res.json();
  const rows = j.data as { id: string; name?: string }[] | undefined;
  return (rows ?? []).map((p) => ({ id: p.id, name: p.name ?? p.id }));
}

function sevBadge(s: string, t: (key: string) => string) {
  if (s === "critical") {
    return <Badge className="bg-aistroyka-error/20 text-aistroyka-error">{t("severity.critical")}</Badge>;
  }
  if (s === "high") {
    return <Badge className="bg-aistroyka-warning/20 text-aistroyka-warning">{t("severity.high")}</Badge>;
  }
  return <Badge className="text-aistroyka-text-tertiary">{t("severity.medium")}</Badge>;
}

function statusBadge(st: string, t: (key: string) => string) {
  let label = st.replace(/_/g, " ");
  try {
    label = t(`status.${st}`);
  } catch {
    // Keep backend status as fallback when a locale key is missing.
  }
  return <span className="text-xs font-mono text-aistroyka-text-secondary">{label}</span>;
}

export function GovernanceCasesClient() {
  const t = useTranslations("governancePage");
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [rationale, setRationale] = useState("");
  const [severity, setSeverity] = useState<"medium" | "high" | "critical">("high");
  const [decisionRequired, setDecisionRequired] = useState("");
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(new Set());

  const casesQuery = useQuery({ queryKey: ["governance-cases"], queryFn: fetchCases });
  const projectsQuery = useQuery({ queryKey: ["governance-project-options"], queryFn: fetchProjects });

  const createMut = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/v1/governance/cases", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          rationale: rationale.trim() || null,
          severity,
          decision_required: decisionRequired.trim(),
          project_ids: [...selectedProjects],
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(typeof err.error === "string" ? err.error : t("createFailed"));
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["governance-cases"] });
      setShowCreate(false);
      setTitle("");
      setRationale("");
      setDecisionRequired("");
      setSelectedProjects(new Set());
    },
  });

  const rows = casesQuery.data ?? [];
  const sorted = useMemo(
    () =>
      [...rows].sort(
        (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      ),
    [rows]
  );

  if (casesQuery.isError) {
    return (
      <ErrorState
        message={casesQuery.error instanceof Error ? casesQuery.error.message : t("loadFailed")}
        onRetry={() => casesQuery.refetch()}
      />
    );
  }

  if (casesQuery.isPending) {
    return (
      <DashboardGlassCard className="p-4">
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="h-48 w-full" />
      </DashboardGlassCard>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-aistroyka-text-secondary max-w-2xl">
          {t("listDescription")}
        </p>
        <Button type="button" variant="primary" onClick={() => setShowCreate((s) => !s)}>
          {showCreate ? t("cancelCreate") : t("newCase")}
        </Button>
      </div>

      {showCreate ? (
        <DashboardGlassCard className="p-4 space-y-4 border border-aistroyka-border-subtle">
          <h2 className="text-aistroyka-subheadline font-semibold text-aistroyka-text-primary">
            {t("createTitle")}
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="block text-sm">
              <span className="text-aistroyka-text-secondary">{t("titleLabel")}</span>
              <input
                className="mt-1 w-full rounded border border-aistroyka-border-subtle bg-aistroyka-bg-primary px-3 py-2 text-sm"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t("titlePlaceholder")}
              />
            </label>
            <label className="block text-sm">
              <span className="text-aistroyka-text-secondary">{t("severityLabel")}</span>
              <select
                className="mt-1 w-full rounded border border-aistroyka-border-subtle bg-aistroyka-bg-primary px-3 py-2 text-sm"
                value={severity}
                onChange={(e) => setSeverity(e.target.value as "medium" | "high" | "critical")}
              >
                <option value="medium">{t("severity.medium")}</option>
                <option value="high">{t("severity.high")}</option>
                <option value="critical">{t("severity.critical")}</option>
              </select>
            </label>
          </div>
          <label className="block text-sm">
            <span className="text-aistroyka-text-secondary">{t("rationaleLabel")}</span>
            <textarea
              className="mt-1 w-full rounded border border-aistroyka-border-subtle bg-aistroyka-bg-primary px-3 py-2 text-sm min-h-[72px]"
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              placeholder={t("rationalePlaceholder")}
            />
          </label>
          <label className="block text-sm">
            <span className="text-aistroyka-text-secondary">{t("decisionRequiredLabel")}</span>
            <textarea
              className="mt-1 w-full rounded border border-aistroyka-border-subtle bg-aistroyka-bg-primary px-3 py-2 text-sm min-h-[72px]"
              value={decisionRequired}
              onChange={(e) => setDecisionRequired(e.target.value)}
              placeholder={t("decisionRequiredPlaceholder")}
            />
          </label>
          <div>
            <p className="text-sm text-aistroyka-text-secondary mb-2">{t("affectedProjectsLabel")}</p>
            {projectsQuery.isPending ? (
              <Skeleton className="h-24 w-full" />
            ) : (
              <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto border border-aistroyka-border-subtle rounded p-2">
                {(projectsQuery.data ?? []).map((p) => (
                  <label key={p.id} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedProjects.has(p.id)}
                      onChange={() => {
                        setSelectedProjects((prev) => {
                          const n = new Set(prev);
                          if (n.has(p.id)) n.delete(p.id);
                          else n.add(p.id);
                          return n;
                        });
                      }}
                    />
                    <span>{p.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
          {createMut.isError ? (
            <p className="text-sm text-aistroyka-error">
              {createMut.error instanceof Error ? createMut.error.message : t("error")}
            </p>
          ) : null}
          <Button
            type="button"
            variant="primary"
            disabled={!title.trim() || !decisionRequired.trim() || selectedProjects.size === 0 || createMut.isPending}
            onClick={() => createMut.mutate()}
          >
            {createMut.isPending ? t("creatingCase") : t("createCase")}
          </Button>
        </DashboardGlassCard>
      ) : null}

      <DashboardGlassCard contentClassName="overflow-hidden">
        <Table aria-label={t("tableAria")}>
          <TableHead>
            <TableRow>
              <TableHeaderCell>{t("table.case")}</TableHeaderCell>
              <TableHeaderCell>{t("table.severity")}</TableHeaderCell>
              <TableHeaderCell>{t("table.status")}</TableHeaderCell>
              <TableHeaderCell>{t("table.projects")}</TableHeaderCell>
              <TableHeaderCell>{t("table.outcome")}</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sorted.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-aistroyka-text-tertiary text-sm">
                  {t("empty")}
                </TableCell>
              </TableRow>
            ) : (
              sorted.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <Link
                      href={`/dashboard/governance/${c.id}`}
                      className="font-medium text-aistroyka-accent hover:underline"
                    >
                      {c.title}
                    </Link>
                    <p className="text-xs text-aistroyka-text-tertiary mt-0.5 line-clamp-2">{c.decision_required}</p>
                  </TableCell>
                  <TableCell>{sevBadge(c.severity, t)}</TableCell>
                  <TableCell>{statusBadge(c.status, t)}</TableCell>
                  <TableCell>
                    <ul className="space-y-1">
                      {c.projects.map((p) => (
                        <li key={p.project_id}>
                          <Link
                            href={`/dashboard/projects/${p.project_id}`}
                            className="text-sm text-aistroyka-accent hover:underline"
                          >
                            {p.project_name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </TableCell>
                  <TableCell className="text-sm text-aistroyka-text-secondary max-w-[200px]">
                    {c.decision_outcome ? c.decision_outcome : t("noOutcome")}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </DashboardGlassCard>
    </div>
  );
}
