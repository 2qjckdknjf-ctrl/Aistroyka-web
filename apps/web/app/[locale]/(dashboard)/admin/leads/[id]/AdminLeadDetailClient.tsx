"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { Badge, Button, Textarea } from "@/components/ui";
import { DashboardGlassCard } from "@/components/dashboard/DashboardGlassCard";

type Lead = {
  id: string;
  created_at: string;
  name: string;
  email: string;
  company: string | null;
  message: string;
  source: string;
  status: string;
  notes: string | null;
};

const STATUS_OPTIONS = ["new", "reviewed", "contacted", "archived"] as const;

export function AdminLeadDetailClient() {
  const tDetail = useTranslations("dashboardDetail");
  const params = useParams();
  const id = params?.id as string | undefined;
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/v1/admin/leads/${id}`, { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error(res.status === 404 ? "Not found" : res.statusText);
        return res.json();
      })
      .then((json: { data: Lead }) => {
        setLead(json.data);
        setStatus(json.data.status);
        setNotes(json.data.notes ?? "");
        setError(null);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : tDetail("failedLoad"));
        setLead(null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = () => {
    if (!id || saving) return;
    setSaving(true);
    const body: { status?: string; notes?: string | null } = {};
    if (status !== lead?.status) body.status = status;
    if (notes !== (lead?.notes ?? "")) body.notes = notes || null;
    if (Object.keys(body).length === 0) {
      setSaving(false);
      return;
    }
    fetch(`/api/v1/admin/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    })
      .then((res) => {
        if (!res.ok) throw new Error(tDetail("updateFailed"));
        return res.json();
      })
      .then((json: { data: Lead }) => {
        setLead(json.data);
        setStatus(json.data.status);
        setNotes(json.data.notes ?? "");
      })
      .catch(() => setError(tDetail("updateFailed")))
      .finally(() => setSaving(false));
  };

  if (!id) {
    return (
      <DashboardGlassCard>
        <p className="text-aistroyka-text-secondary">{tDetail("missingLeadId")}</p>
      </DashboardGlassCard>
    );
  }

  if (error && !lead) {
    return (
      <DashboardGlassCard>
        <p className="text-aistroyka-text-secondary">{error}</p>
        <Link href="/admin/leads" className="mt-4 inline-block text-aistroyka-accent hover:underline">
          {tDetail("backToLeads")}
        </Link>
      </DashboardGlassCard>
    );
  }

  if (loading || !lead) {
    return (
      <DashboardGlassCard>
        <div className="h-32 animate-pulse rounded bg-aistroyka-surface-raised" />
      </DashboardGlassCard>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        href="/admin/leads"
        className="inline-block text-aistroyka-subheadline font-medium text-aistroyka-text-secondary hover:text-aistroyka-accent"
      >
        {tDetail("backToLeads")}
      </Link>

      <DashboardGlassCard className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-aistroyka-title3 font-bold text-aistroyka-text-primary">{lead.name}</h1>
            <p className="mt-1 text-aistroyka-subheadline text-aistroyka-text-secondary">
              {new Date(lead.created_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
            </p>
            <p className="mt-1 text-aistroyka-subheadline text-aistroyka-text-secondary">{lead.email}</p>
            {lead.company && (
              <p className="mt-1 text-aistroyka-subheadline text-aistroyka-text-secondary">{lead.company}</p>
            )}
            <Badge variant="neutral" className="mt-2">
              {lead.source}
            </Badge>
          </div>
        </div>

        <div className="mt-6 border-t border-aistroyka-border-subtle pt-6">
          <h2 className="text-aistroyka-headline font-semibold text-aistroyka-text-primary">{tDetail("message")}</h2>
          <p className="mt-2 whitespace-pre-wrap text-aistroyka-body text-aistroyka-text-secondary">{lead.message}</p>
        </div>

        <div className="mt-6 border-t border-aistroyka-border-subtle pt-6">
          <h2 className="text-aistroyka-headline font-semibold text-aistroyka-text-primary">{tDetail("statusAndNotes")}</h2>
          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-6">
            <div className="min-w-[140px]">
              <label htmlFor="lead-status" className="mb-1 block text-aistroyka-caption font-medium text-aistroyka-text-secondary">
                {tDetail("status")}
              </label>
              <select
                id="lead-status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-[var(--aistroyka-radius-md)] border border-aistroyka-border-subtle bg-aistroyka-bg-primary px-3 py-2 text-aistroyka-body"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label htmlFor="lead-notes" className="mb-1 block text-aistroyka-caption font-medium text-aistroyka-text-secondary">
                {tDetail("notesInternal")}
              </label>
              <Textarea
                id="lead-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full"
                placeholder={tDetail("optionalNotes")}
              />
            </div>
            <Button onClick={handleSave} loading={saving} disabled={saving}>
              {tDetail("save")}
            </Button>
          </div>
        </div>
      </DashboardGlassCard>
    </div>
  );
}
