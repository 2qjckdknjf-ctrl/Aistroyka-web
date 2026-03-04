export type SubscriptionTierKey = "FREE" | "PRO" | "ENTERPRISE";
export type AIPolicyDecision = "allow" | "block" | "degrade";

export interface AIPolicyContext {
  tenant_id: string;
  tier: SubscriptionTierKey;
  resource_type?: "media" | "report";
  image_count?: number;
  image_size_bytes?: number;
  trace_id?: string | null;
}

export interface AIPolicyResult {
  decision: AIPolicyDecision;
  rule_hits: string[];
  model_override?: string;
  redaction_applied?: boolean;
}
