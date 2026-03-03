"use client";

import { useState, useMemo, useEffect } from "react";
import { QueryBoundary } from "@/lib/query/render";
import { AdminTable } from "@/src/features/admin/components/AdminTable";
import { JsonDetails } from "@/src/features/admin/components/JsonDetails";
import { RequestIdPill } from "@/src/features/admin/components/RequestIdPill";
import { RangeFilter, rangeToDates, type RangePreset } from "@/src/features/admin/components/RangeFilter";
import { useAdminTenants } from "@/src/features/admin/ai/api/useAdminTenants";
import { useAiSecurityEvents } from "@/src/features/admin/ai/api/useAiSecurityEvents";
import type { SecurityEventRow } from "@/src/features/admin/ai/api/adminAiApi";

export function AdminAiSecurityClient() {
  const [rangePreset, setRangePreset] = useState<RangePreset>("7d");
  const [range, setRange] = useState(() => rangeToDates("7d"));
  const [severity, setSeverity] = useState<string>("");
  const [eventType, setEventType] = useState<string>("");
  const tenantsQuery = useAdminTenants();
  const tenants = tenantsQuery.data ?? [];
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  useEffect(() => {
    if (tenants.length > 0 && selectedTenantId === null) setSelectedTenantId(tenants[0].id);
  }, [tenants, selectedTenantId]);
  const tenantId = selectedTenantId ?? tenants[0]?.id ?? null;

  const filters = useMemo(() => ({ severity: severity || undefined, event_type: eventType || undefined }), [severity, eventType]);
  const eventsQuery = useAiSecurityEvents(tenantId, range, filters);

  const handleRangeChange = (preset: RangePreset, r: { from: string; to: string }) => {
    setRangePreset(preset);
    setRange(r);
  };

  return (
    <>
      <QueryBoundary query={tenantsQuery} emptyCondition={(d) => !d?.length} emptyTitle="No admin tenants">
        {() => (
          <>
            {tenants.length > 1 ? (
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="text-aistroyka-subheadline text-aistroyka-text-secondary">Tenant:</span>
                <select
                  value={tenantId ?? ""}
                  onChange={(e) => setSelectedTenantId(e.target.value || null)}
                  className="rounded border border-aistroyka-border-subtle bg-aistroyka-surface-raised px-2 py-1"
                >
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>{t.name ?? t.id.slice(0, 8)}</option>
                  ))}
                </select>
              </div>
            ) : null}
            <div className="mb-4 flex flex-wrap items-center gap-4">
              <RangeFilter value={rangePreset} onChange={handleRangeChange} />
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                className="rounded border border-aistroyka-border-subtle bg-aistroyka-surface-raised px-2 py-1 text-aistroyka-subheadline"
              >
                <option value="">All severity</option>
                <option value="low">low</option>
                <option value="medium">medium</option>
                <option value="high">high</option>
                <option value="critical">critical</option>
              </select>
              <input
                type="text"
                placeholder="Event type filter"
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                className="rounded border border-aistroyka-border-subtle bg-aistroyka-surface-raised px-2 py-1 text-aistroyka-subheadline"
              />
            </div>
            <QueryBoundary query={eventsQuery} emptyCondition={(d) => !d?.length} emptyTitle="No security events">
              {(events) => (
                <AdminTable<SecurityEventRow>
                  columns={[
                    { key: "created_at", label: "Time" },
                    { key: "severity", label: "Severity" },
                    { key: "event_type", label: "Event type" },
                    { key: "request_id", label: "Request ID" },
                    { key: "details", label: "Details" },
                  ]}
                  rows={events}
                  keyFn={(r) => r.id}
                  renderCell={(row, col) => {
                    if (col === "created_at") return new Date(row.created_at).toLocaleString();
                    if (col === "severity") return row.severity;
                    if (col === "event_type") return row.event_type;
                    if (col === "request_id") return row.request_id ? <RequestIdPill requestId={row.request_id} /> : "—";
                    if (col === "details") return <JsonDetails data={((row.details as Record<string, unknown>) ?? {})} />;
                    return "—";
                  }}
                />
              )}
            </QueryBoundary>
          </>
        )}
      </QueryBoundary>
    </>
  );
}
