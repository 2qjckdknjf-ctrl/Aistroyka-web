export interface AiUsageRecord {
  tenant_id: string | null;
  user_id: string | null;
  trace_id: string | null;
  provider: string;
  model: string;
  tokens_input: number;
  tokens_output: number;
  tokens_total: number;
  cost_usd: number;
  status: "success" | "error" | "blocked";
  error_type?: string | null;
  duration_ms?: number | null;
}
