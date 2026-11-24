/** AI governance policy types. */

import type {
  AuthorizationHop,
  AuthorizationMandate,
} from "./transitive-authorization";

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
  /** Optional prompt / user text scanned for secrets before egress. */
  system_prompt?: string | null;
  user_message?: string | null;
  egress_text?: string | null;
  rate_override?: boolean;
  /**
   * Optional multi-agent handoff chain (D4). When set, runPolicy evaluates
   * transitive authorization; absent ⇒ existing single-hop behavior unchanged.
   */
  handoff?: {
    mandate: AuthorizationMandate;
    hops: readonly AuthorizationHop[];
  } | null;
}

export interface PolicyResult {
  decision: PolicyDecision;
  rule_hits: string[];
  model_tier?: "free" | "pro" | "enterprise";
  /** Set when decision is persisted (ai_policy_decisions.id). */
  decisionId?: string | null;
}
