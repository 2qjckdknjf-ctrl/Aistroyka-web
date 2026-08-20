"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  Button,
  Input,
  Textarea,
  Select,
  Skeleton,
  EmptyState,
} from "@/components/ui";
import type { ContractorDirectoryDetail } from "@/lib/domain/contractor-directory/contractor-directory.types";
import { useState, useEffect } from "react";
import { DashboardGlassCard } from "@/components/dashboard/DashboardGlassCard";

async function fetchDetail(userId: string): Promise<ContractorDirectoryDetail> {
  const res = await fetch(`/api/v1/contractors/directory/${encodeURIComponent(userId)}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("load_failed");
  const json = await res.json();
  return json.data;
}

async function saveProfile(userId: string, body: Record<string, unknown>): Promise<void> {
  const res = await fetch(`/api/v1/contractors/directory/${encodeURIComponent(userId)}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("save_failed");
}

export function ContractorDetailClient({ userId }: { userId: string }) {
  const t = useTranslations("contractorDirectory");
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["contractor-directory-detail", userId],
    queryFn: () => fetchDetail(userId),
    enabled: !!userId,
  });

  const [companyName, setCompanyName] = useState("");
  const [specText, setSpecText] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<"active" | "inactive" | "archived">("active");

  useEffect(() => {
    const p = q.data?.profile;
    if (!p) return;
    setCompanyName(p.company_name ?? "");
    setSpecText((p.specializations ?? []).join(", "));
    setPhone(p.phone ?? "");
    setEmail(p.email ?? "");
    setNotes(p.notes ?? "");
    setStatus(p.status);
  }, [q.data?.profile]);

  const save = useMutation({
    mutationFn: () =>
      saveProfile(userId, {
        company_name: companyName,
        specializations: specText,
        phone,
        email,
        notes,
        status,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contractor-directory-detail", userId] });
      qc.invalidateQueries({ queryKey: ["contractor-directory"] });
    },
  });

  if (q.isPending) {
    return (
      <DashboardGlassCard>
        <Skeleton className="h-48" />
      </DashboardGlassCard>
    );
  }

  if (q.isError || !q.data) {
    return (
      <EmptyState
        icon={<span className="text-2xl">⚠️</span>}
        title={t("detailUnavailable")}
        subtitle={t("detailUnavailableHint")}
        action={
          <Link href="/dashboard/contractors" className="text-aistroyka-accent hover:underline">
            {t("backToDirectory")}
          </Link>
        }
      />
    );
  }

  const m = q.data.metrics;
  const pct = new Intl.NumberFormat(undefined, {
    style: "percent",
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  });

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/contractors" className="text-sm text-aistroyka-accent hover:underline">
          {t("backToDirectory")}
        </Link>
      </div>

      <DashboardGlassCard className="p-4">
        <h2 className="text-lg font-semibold text-aistroyka-text-primary">{t("metricsSection")}</h2>
        <p className="mt-1 text-sm text-aistroyka-text-secondary">{t("metricsHint")}</p>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-sm">
          <div>
            <dt className="text-aistroyka-text-tertiary">{t("qualityScore")}</dt>
            <dd className="font-semibold text-aistroyka-text-primary">{m.quality_score}</dd>
          </div>
          <div>
            <dt className="text-aistroyka-text-tertiary">{t("activeProjects")}</dt>
            <dd className="font-semibold text-aistroyka-text-primary">{m.active_projects}</dd>
          </div>
          <div>
            <dt className="text-aistroyka-text-tertiary">{t("tasksCompleted")}</dt>
            <dd className="font-semibold text-aistroyka-text-primary">{m.tasks_completed}</dd>
          </div>
          <div>
            <dt className="text-aistroyka-text-tertiary">{t("reportsNonDraft")}</dt>
            <dd className="font-semibold text-aistroyka-text-primary">{m.reports_submitted}</dd>
          </div>
          <div>
            <dt className="text-aistroyka-text-tertiary">{t("rejectionRate")}</dt>
            <dd className="font-semibold text-aistroyka-text-primary">{pct.format(m.rejection_rate)}</dd>
          </div>
          <div>
            <dt className="text-aistroyka-text-tertiary">{t("changesRequestedRate")}</dt>
            <dd className="font-semibold text-aistroyka-text-primary">{pct.format(m.missing_evidence_rate)}</dd>
          </div>
          <div>
            <dt className="text-aistroyka-text-tertiary">{t("avgDelayDays")}</dt>
            <dd className="font-semibold text-aistroyka-text-primary">
              {m.average_delay_days == null ? "—" : m.average_delay_days.toFixed(1)}
            </dd>
          </div>
        </dl>
      </DashboardGlassCard>

      <DashboardGlassCard className="p-4">
        <h2 className="text-lg font-semibold text-aistroyka-text-primary">{t("profileSection")}</h2>
        <p className="mt-1 text-sm text-aistroyka-text-secondary">{t("profileHint")}</p>
        <form
          className="mt-4 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate();
          }}
        >
          <Input id="co-name" label={t("companyName")} value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
          <Input
            id="co-spec"
            label={t("specializations")}
            value={specText}
            onChange={(e) => setSpecText(e.target.value)}
            placeholder={t("specializationsPlaceholder")}
          />
          <Input id="co-phone" label={t("phone")} value={phone} onChange={(e) => setPhone(e.target.value)} />
          <Input id="co-email" label={t("email")} value={email} onChange={(e) => setEmail(e.target.value)} />
          <Textarea id="co-notes" label={t("notes")} value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
          <div>
            <label htmlFor="co-status" className="mb-1.5 block text-sm font-medium text-aistroyka-text-primary">
              {t("profileStatus")}
            </label>
            <Select id="co-status" value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
              <option value="active">{t("statusActive")}</option>
              <option value="inactive">{t("statusInactive")}</option>
              <option value="archived">{t("statusArchived")}</option>
            </Select>
          </div>
          <Button type="submit" loading={save.isPending}>
            {t("saveProfile")}
          </Button>
          {save.isError ? <p className="text-sm text-aistroyka-error">{t("saveFailed")}</p> : null}
        </form>
      </DashboardGlassCard>
    </div>
  );
}
