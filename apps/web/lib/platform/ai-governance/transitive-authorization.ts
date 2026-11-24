/**
 * Transitive multi-agent authorization (Codex/Cursor delta 2026-11-24 D4).
 * Pure fail-closed helper: three individually authorized agents must not
 * exfiltrate another tenant's data or widen recipients. No agent runtime.
 */

export type DataClassification = "internal" | "restricted" | "customer_safe";

export type HandoffDestination =
  | "same_tenant_ops"
  | "allowed_recipient"
  | "external"
  | "finance"
  | "unknown";

export type AuthorizationMandate = {
  tenantId: string;
  principalId: string;
  allowedRecipients: readonly string[];
  classification: DataClassification;
  purpose: string;
};

export type AuthorizationHop = {
  agentId: string;
  tenantId: string;
  action: string;
  destination: HandoffDestination;
  /**
   * Recipient ids for this hop. Required at evaluation time and must stay
   * ⊆ mandate.allowedRecipients. hop.agentId must be in that set too.
   * Omitting recipients fails closed as widening.
   */
  recipients?: readonly string[];
  /** If true, hop claims break-glass — must NOT widen recipients or cross tenant. */
  breakGlass?: boolean;
  /** Optional classification after hop; cannot drop below mandate. */
  classification?: DataClassification;
};

export type TransitiveAuthorizationResult = {
  decision: "allow" | "block";
  rule_hits: string[];
};

const CLASSIFICATION_RANK: Record<DataClassification, number> = {
  customer_safe: 0,
  internal: 1,
  restricted: 2,
};

function isClassificationDowngrade(
  from: DataClassification,
  to: DataClassification
): boolean {
  return CLASSIFICATION_RANK[to] < CLASSIFICATION_RANK[from];
}

/**
 * Evaluate an originator mandate against a chain of agent hops.
 * Empty/missing mandate or hops ⇒ block (fail-closed).
 * When boundTenantId is set (the policy tenant), the mandate must name that tenant.
 */
export function evaluateTransitiveAuthorization(
  mandate: AuthorizationMandate | null | undefined,
  hops: readonly AuthorizationHop[] | null | undefined,
  boundTenantId?: string
): TransitiveAuthorizationResult {
  const rule_hits: string[] = [];

  if (!mandate || !mandate.tenantId || !mandate.principalId) {
    return { decision: "block", rule_hits: ["mandate_missing"] };
  }
  if (boundTenantId !== undefined && boundTenantId !== mandate.tenantId) {
    rule_hits.push("cross_tenant_handoff");
    // A mandate for another tenant is not authorization for this request.
    rule_hits.push("isolated_grant_insufficient");
    return { decision: "block", rule_hits };
  }
  if (!hops || hops.length === 0) {
    return { decision: "block", rule_hits: ["handoff_chain_empty"] };
  }

  const allowed = new Set(mandate.allowedRecipients);

  for (const hop of hops) {
    if (!hop.agentId || !hop.tenantId) {
      rule_hits.push("hop_incomplete");
      return { decision: "block", rule_hits };
    }
    if (hop.tenantId !== mandate.tenantId) {
      rule_hits.push("cross_tenant_handoff");
      // Individually authorized agents on another tenant are still insufficient.
      rule_hits.push("isolated_grant_insufficient");
      return { decision: "block", rule_hits };
    }
    if (hop.destination === "finance" || hop.destination === "external" || hop.destination === "unknown") {
      rule_hits.push("forbidden_destination");
      return { decision: "block", rule_hits };
    }
    if (!allowed.has(hop.agentId)) {
      rule_hits.push(hop.breakGlass ? "break_glass_non_widening" : "recipient_widened");
      return { decision: "block", rule_hits };
    }
    if (hop.recipients == null) {
      rule_hits.push(hop.breakGlass ? "break_glass_non_widening" : "recipient_widened");
      return { decision: "block", rule_hits };
    }
    for (const recipient of hop.recipients) {
      if (!allowed.has(recipient)) {
        rule_hits.push(hop.breakGlass ? "break_glass_non_widening" : "recipient_widened");
        return { decision: "block", rule_hits };
      }
    }
    if (hop.classification && isClassificationDowngrade(mandate.classification, hop.classification)) {
      rule_hits.push("classification_downgrade");
      return { decision: "block", rule_hits };
    }
  }

  rule_hits.push("transitive_allow");
  return { decision: "allow", rule_hits };
}
