/** SLO/SRE types. */

export type EndpointGroup = "worker" | "sync" | "media" | "ai" | "jobs" | "admin";

export interface SloDailyRow {
  tenant_id: string;
  date: string;
  endpoint_group: EndpointGroup;
  requests: number;
  errors: number;
  p95_latency_ms: number | null;
}

export interface AlertRow {
  id: string;
  tenant_id: string | null;
  severity: "info" | "warn" | "critical";
  type: string;
  message: string;
  created_at: string;
  resolved_at: string | null;
}
