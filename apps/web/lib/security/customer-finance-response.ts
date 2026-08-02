/**
 * Fail-closed customer/stakeholder JSON responses: guard final payload before serialize.
 */

import { NextResponse } from "next/server";
import { assertCustomerFinanceSafePayload } from "./customer-finance-guard";

export const CUSTOMER_FINANCE_GUARD_ERROR = "Payload failed finance safety guard";

/**
 * Returns NextResponse.json(body) only when payload is customer-finance safe.
 * On leak: HTTP 500 with generic error (no forbidden key/path/value in client body).
 */
export function jsonWithCustomerFinanceGuard(
  route: string,
  body: unknown,
  init?: ResponseInit
): NextResponse {
  const safety = assertCustomerFinanceSafePayload(body);
  if (!safety.ok) {
    console.error(`Blocked customer-finance leak in ${route}: ${safety.path ?? safety.key}`);
    return NextResponse.json({ error: CUSTOMER_FINANCE_GUARD_ERROR }, { status: 500 });
  }
  return NextResponse.json(body, init);
}

function isJsonSuccessStatus(status: number): boolean {
  return status >= 200 && status <= 299 && status !== 204;
}

/**
 * For portal aliases that delegate to dual-audience handlers: always treat as customer surface.
 *
 * - Non-2xx: return unchanged
 * - 204: return unchanged (no body)
 * - Other 2xx JSON: clone + parse; if safe return original response; if unsafe generic 500
 * - Unreadable success JSON: generic 500
 *
 * Safe responses must preserve status, statusText, headers, cookies, and exact body bytes
 * by returning the original Response object (not a rebuilt NextResponse).
 */
export async function enforceCustomerFinanceOnJsonResponse(
  route: string,
  response: Response
): Promise<Response> {
  const status = response.status;
  if (status < 200 || status >= 300) return response;
  if (status === 204) return response;
  if (!isJsonSuccessStatus(status)) return response;

  let body: unknown;
  try {
    body = await response.clone().json();
  } catch {
    console.error(`Blocked customer-finance leak in ${route}: unreadable_json_body`);
    return NextResponse.json({ error: CUSTOMER_FINANCE_GUARD_ERROR }, { status: 500 });
  }

  const safety = assertCustomerFinanceSafePayload(body);
  if (!safety.ok) {
    console.error(`Blocked customer-finance leak in ${route}: ${safety.path ?? safety.key}`);
    // Do not copy cookies / success-only headers from the unsafe response into the 500.
    return NextResponse.json({ error: CUSTOMER_FINANCE_GUARD_ERROR }, { status: 500 });
  }

  return response;
}
