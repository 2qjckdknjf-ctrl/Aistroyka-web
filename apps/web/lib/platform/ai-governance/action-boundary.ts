/**
 * Transport-independent Action Boundary (Cursor/Codex delta 2026-11-27 P0).
 *
 * Resource + operation policy is evaluated the same way for MCP, direct API,
 * shell, filesystem, browser, and delegated-agent routes. Deny before any
 * external effect. Synthetic fixtures only — no real secrets.
 */

export type ActionTransport =
  | "mcp"
  | "api"
  | "shell"
  | "filesystem"
  | "browser"
  | "delegated_agent";

export type ProtectedResourceClass =
  | "secrets"
  | "finance"
  | "customer_data"
  | "tenant_admin"
  | "public";

export type ActionOperation =
  | "read"
  | "write"
  | "execute"
  | "exfiltrate"
  | "delegate";

export type ActionBoundaryPrincipal = {
  /** Absent/empty ⇒ fail closed. */
  principalId?: string | null;
  tenantId?: string | null;
  /** Known authorization decision for this principal on the resource. */
  authorized?: boolean | null;
};

export type ActionBoundaryRequest = {
  principal: ActionBoundaryPrincipal;
  resourceClass: ProtectedResourceClass;
  resourceId?: string | null;
  operation: ActionOperation;
  transport: ActionTransport;
  /** Optional synthetic payload scanned for secret shapes (never log values). */
  payloadText?: string | null;
};

export type ActionBoundaryDecision = "allow" | "deny";

export type ActionBoundaryResult = {
  decision: ActionBoundaryDecision;
  rule_hits: string[];
  /** Stable policy id for audit / evidence. */
  policy_version: string;
  audit: {
    principal_id: string | null;
    tenant_id: string | null;
    resource_class: ProtectedResourceClass;
    resource_id: string | null;
    operation: ActionOperation;
    transport: ActionTransport;
    policy_version: string;
  };
};

export const ACTION_BOUNDARY_POLICY_VERSION = "action_boundary.v1" as const;

const TRANSPORTS: readonly ActionTransport[] = [
  "mcp",
  "api",
  "shell",
  "filesystem",
  "browser",
  "delegated_agent",
] as const;

function isTransport(value: string): value is ActionTransport {
  return (TRANSPORTS as readonly string[]).includes(value);
}

/**
 * Evaluate whether a principal may perform an operation on a resource class.
 * Identity/authorization unknown ⇒ deny. Transport must not widen access.
 */
export function evaluateActionBoundary(
  request: ActionBoundaryRequest
): ActionBoundaryResult {
  const rule_hits: string[] = [];
  const principalId =
    typeof request.principal.principalId === "string" && request.principal.principalId.trim()
      ? request.principal.principalId.trim()
      : null;
  const tenantId =
    typeof request.principal.tenantId === "string" && request.principal.tenantId.trim()
      ? request.principal.tenantId.trim()
      : null;
  const resourceId =
    typeof request.resourceId === "string" && request.resourceId.trim()
      ? request.resourceId.trim()
      : null;

  const audit = {
    principal_id: principalId,
    tenant_id: tenantId,
    resource_class: request.resourceClass,
    resource_id: resourceId,
    operation: request.operation,
    transport: request.transport,
    policy_version: ACTION_BOUNDARY_POLICY_VERSION,
  };

  if (!isTransport(request.transport)) {
    rule_hits.push("transport_unknown");
    return deny(rule_hits, audit);
  }

  if (!principalId || !tenantId) {
    rule_hits.push("identity_unknown");
    return deny(rule_hits, audit);
  }

  if (request.principal.authorized !== true) {
    rule_hits.push("authorization_unknown_or_denied");
    return deny(rule_hits, audit);
  }

  // Protected classes never leave via shell/filesystem/browser/delegate without explicit allow path.
  if (
    request.resourceClass === "secrets" ||
    request.resourceClass === "finance" ||
    request.resourceClass === "customer_data"
  ) {
    if (
      request.operation === "exfiltrate" ||
      request.transport === "shell" ||
      request.transport === "filesystem" ||
      request.transport === "browser" ||
      request.transport === "delegated_agent"
    ) {
      rule_hits.push("protected_resource_denied");
      rule_hits.push(`transport_${request.transport}`);
      return deny(rule_hits, audit);
    }
    // MCP/API write/execute on secrets/finance also fail closed unless future allow-list added.
    if (
      (request.resourceClass === "secrets" || request.resourceClass === "finance") &&
      (request.operation === "write" || request.operation === "execute" || request.operation === "delegate")
    ) {
      rule_hits.push("protected_mutation_denied");
      rule_hits.push(`transport_${request.transport}`);
      return deny(rule_hits, audit);
    }
  }

  if (request.resourceClass === "tenant_admin" && request.operation === "delegate") {
    rule_hits.push("admin_delegate_denied");
    return deny(rule_hits, audit);
  }

  // Payload may carry synthetic secret shapes — block before egress on any transport.
  if (request.payloadText && containsSyntheticSecretShape(request.payloadText)) {
    rule_hits.push("synthetic_secret_in_payload");
    rule_hits.push(`transport_${request.transport}`);
    return deny(rule_hits, audit);
  }

  rule_hits.push("action_boundary_allow");
  rule_hits.push(`transport_${request.transport}`);
  return {
    decision: "allow",
    rule_hits,
    policy_version: ACTION_BOUNDARY_POLICY_VERSION,
    audit,
  };
}

function deny(
  rule_hits: string[],
  audit: ActionBoundaryResult["audit"]
): ActionBoundaryResult {
  return {
    decision: "deny",
    rule_hits,
    policy_version: ACTION_BOUNDARY_POLICY_VERSION,
    audit,
  };
}

/** Synthetic-only shapes for fixtures (mirrors high-signal secret-detection kinds). */
function containsSyntheticSecretShape(text: string): boolean {
  return (
    /\bsk-[A-Za-z0-9]{20,}\b/.test(text) ||
    /\bghp_[A-Za-z0-9]{20,}\b/.test(text) ||
    /\bAIza[0-9A-Za-z\-_]{35}\b/.test(text)
  );
}

/**
 * Assert the same protected-resource deny for every supported transport.
 * Used by tests and by MCP/skill harnesses — not a network sandbox by itself.
 */
export function denyProtectedAcrossTransports(
  base: Omit<ActionBoundaryRequest, "transport">
): Record<ActionTransport, ActionBoundaryResult> {
  const out = {} as Record<ActionTransport, ActionBoundaryResult>;
  for (const transport of TRANSPORTS) {
    out[transport] = evaluateActionBoundary({ ...base, transport });
  }
  return out;
}
