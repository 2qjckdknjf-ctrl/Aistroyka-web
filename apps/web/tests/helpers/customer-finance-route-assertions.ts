/**
 * Test-only helpers for customer-finance route proofs.
 * Not imported by production route code.
 */

import { expect } from "vitest";
import { CUSTOMER_FINANCE_GUARD_ERROR } from "@/lib/security/customer-finance-response";

export async function expectCustomerFinanceBlocked(
  res: Response,
  opts: {
    forbiddenKey: string;
    injectedValue?: string | number | boolean;
  }
): Promise<void> {
  expect(res.status).toBe(500);
  const body = (await res.json()) as Record<string, unknown>;
  expect(body).toEqual({ error: CUSTOMER_FINANCE_GUARD_ERROR });
  expect(Object.keys(body)).toEqual(["error"]);
  const serialized = JSON.stringify(body);
  expect(serialized).not.toContain(opts.forbiddenKey);
  expect(serialized).not.toMatch(/"path"\s*:/);
  expect(serialized).not.toMatch(/"key"\s*:/);
  if (opts.injectedValue !== undefined) {
    expect(serialized).not.toContain(String(opts.injectedValue));
  }
  // Partial unsafe object must not appear under a data envelope
  expect(body.data).toBeUndefined();
  expect(body.audience).toBeUndefined();
}
