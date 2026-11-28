import {
  evaluateActionBoundary,
  type ActionBoundaryResult,
} from "@/lib/platform/ai-governance/action-boundary";

const FORBIDDEN_KEYS = [
  "project_cost_items",
  "internal_cost_item_id",
  "planned_amount",
  "actual_amount",
  "margin",
  "profitability",
  "budget_pressure",
  "cost_overrun",
  "subcontractor_cost",
  "ai_finance_risk",
] as const;

type GuardResult = {
  ok: boolean;
  path?: string;
  key?: string;
  /** Present when Action Boundary was evaluated for this projection. */
  boundary?: ActionBoundaryResult;
};

function walk(value: unknown, path: string[]): GuardResult {
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i += 1) {
      const result = walk(value[i], [...path, String(i)]);
      if (!result.ok) return result;
    }
    return { ok: true };
  }

  if (value && typeof value === "object") {
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      const keyLower = key.toLowerCase();
      const isForbidden =
        FORBIDDEN_KEYS.includes(keyLower as (typeof FORBIDDEN_KEYS)[number]) ||
        keyLower.includes("internal_cost");
      if (isForbidden) {
        return {
          ok: false,
          path: [...path, key].join("."),
          key,
        };
      }
      const result = walk(nested, [...path, key]);
      if (!result.ok) return result;
    }
  }

  return { ok: true };
}

export function assertCustomerFinanceSafePayload(value: unknown): GuardResult {
  return walk(value, []);
}

export type CustomerProjectionPrincipal = {
  principalId: string;
  tenantId: string;
  /** Known authorization for customer_data read; unknown/false ⇒ fail closed. */
  authorized?: boolean | null;
};

/**
 * Portal/customer projection gate: key-walk finance isolation plus Action Boundary
 * (2026-11-28). Forbidden finance keys ⇒ deny. Boundary must deny finance
 * exfiltration on API; authorized customer_data read may allow.
 */
export function assertCustomerProjectionAllowed(
  value: unknown,
  principal: CustomerProjectionPrincipal
): GuardResult {
  const finance = assertCustomerFinanceSafePayload(value);
  if (!finance.ok) {
    const boundary = evaluateActionBoundary({
      principal: {
        principalId: principal.principalId,
        tenantId: principal.tenantId,
        authorized: principal.authorized === true,
      },
      resourceClass: "finance",
      operation: "exfiltrate",
      transport: "api",
    });
    return { ...finance, boundary };
  }

  const boundary = evaluateActionBoundary({
    principal: {
      principalId: principal.principalId,
      tenantId: principal.tenantId,
      authorized: principal.authorized === true,
    },
    resourceClass: "customer_data",
    operation: "read",
    transport: "api",
  });

  if (boundary.decision !== "allow") {
    return {
      ok: false,
      path: "action_boundary",
      key: "customer_data",
      boundary,
    };
  }

  return { ok: true, boundary };
}
