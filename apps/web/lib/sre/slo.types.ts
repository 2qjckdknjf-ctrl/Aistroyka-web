export interface SloDailyRow {
  tenant_id: string;
  date: string;
  endpoint_group: string;
  requests: number;
  errors: number;
  p95_latency_ms: number | null;
}
