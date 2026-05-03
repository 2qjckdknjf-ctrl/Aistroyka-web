/** AI governance policy types. */

export type PolicyDecision = "allow" | "block" | "degrade";

export type ResourceType = "media" | "report";

export interface PolicyContext {
  tenant_id: string;
  subscription_tier: string;
  resource_type?: ResourceType;
  image_count?: number;
  image_size_bytes?: number;
  image_url?: string | null;
  /** Site video URL (same PII host rules as image_url when strict). */
  video_url?: string | null;
  /** Fetched video byte length for tier caps. */
  video_size_bytes?: number | null;
  rate_override?: boolean;
}

export interface PolicyResult {
  decision: PolicyDecision;
  rule_hits: string[];
  model_tier?: "free" | "pro" | "enterprise";
  /** Set when decision is persisted (ai_policy_decisions.id). */
  decisionId?: string | null;
}
