"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { QueryBoundary } from "@/lib/query/render";
import { AdminTable } from "@/src/features/admin/components/AdminTable";
import { JsonDetails } from "@/src/features/admin/components/JsonDetails";
import { RequestIdPill } from "@/src/features/admin/components/RequestIdPill";
import { RangeFilter, rangeToDates, type RangePreset } from "@/src/features/admin/components/RangeFilter";
import { useAiSecurityEvents } from "@/src/features/admin/ai/api/useAiSecurityEvents";
import type { SecurityEventRow } from "@/src/features/admin/ai/api/adminAiApi";

export function AdminAiSecurityClient({
  activeTenantId,
}: {
  /** Active workspace — security events locked to this tenant. */
  activeTenantId: string | null;
}) {
  const tDetail = useTranslations("dashboardDetail");
  const [rangePreset, setRangePreset] = useState<RangePreset>("7d");
  const [range, setRange] = useState(() => rangeToDates("7d"));
  const [severity, setSeverity] = useState<string>("");
  const [eventType, setEventType] = useState<string>("");
  const tenantId = activeTenantId;

  const filters = useMemo(
    () => ({ severity: severity || undefined, event_type: eventType || undefined }),
    [severity, eventType]
  );
  const eventsQuery = useAiSecurityEvents(tenantId, range, filters);

  const handleRangeChange = (preset: RangePreset, r: { from: string; to: string }) => {
    setRangePreset(preset);
    setRange(r);
  };

  if (!tenantId) {
    return (
      <section className="mb-6" role="status" aria-live="polite">
        <p className="text-aistroyka-subheadline text-aistroyka-text-secondary">
          {tDetail("noAdminTenants")}
        </p>
      </section>
    );
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <RangeFilter value={rangePreset} onChange={handleRangeChange} />
        <select
          value={severity}
          onChange={(e) => setSeverity(e.target.value)}
          className="rounded border border-aistroyka-border-subtle bg-aistroyka-surface-raised px-2 py-1 text-aistroyka-subheadline"
        >
          <option value="">{tDetail("allSeverity")}</option>
          <option value="low">{tDetail("low")}</option>
          <option value="medium">{tDetail("medium")}</option>
          <option value="high">{tDetail("high")}</option>
          <option value="critical">{tDetail("critical")}</option>
        </select>
        <input
          type="text"
          placeholder={tDetail("eventTypeFilter")}
          value={eventType}
          onChange={(e) => setEventType(e.target.value)}
          className="rounded border border-aistroyka-border-subtle bg-aistroyka-surface-raised px-2 py-1 text-aistroyka-subheadline"
        />
      </div>
      <QueryBoundary query={eventsQuery} emptyCondition={(d) => !d?.length} emptyTitle={tDetail("noSecurityEvents")}>
        {(events) => (
          <AdminTable<SecurityEventRow>
            columns={[
              { key: "created_at", label: tDetail("time") },
              { key: "severity", label: tDetail("severity") },
              { key: "event_type", label: tDetail("eventType") },
              { key: "request_id", label: tDetail("requestId") },
              { key: "details", label: tDetail("details") },
            ]}
            rows={events}
            keyFn={(r) => r.id}
            renderCell={(row, col) => {
              if (col === "created_at") return new Date(row.created_at).toLocaleString();
              if (col === "severity") return row.severity;
              if (col === "event_type") return row.event_type;
              if (col === "request_id")
                return row.request_id ? <RequestIdPill requestId={row.request_id} /> : "—";
              if (col === "details")
                return <JsonDetails data={((row.details as Record<string, unknown>) ?? {})} />;
              return "—";
            }}
          />
        )}
      </QueryBoundary>
    </>
  );
}
