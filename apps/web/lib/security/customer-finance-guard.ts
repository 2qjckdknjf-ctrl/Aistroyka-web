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
