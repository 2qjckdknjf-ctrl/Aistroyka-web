import { OWNER_SECRET_HEADER } from "./constants";

function timingSafeEqualStrings(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) {
    out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return out === 0;
}

/**
 * `OWNER_GATE_SECRET` + header `X-Owner-Key` (case-insensitive key per fetch spec; we read `x-owner-key`):
 *
 * - Default: when the secret is set, **every** `/api/v1/owner/*` request must include the header (middleware + route).
 * - `OWNER_GATE_SECRET_CRITICAL_ONLY=1`: require the header **only** for `/api/v1/owner/critical/*` (see owner-gate-policy.ts).
 * - Owner **HTML** routes never require this header (browsers cannot attach arbitrary headers to top-level navigations).
 *   For operator consoles behind a corporate proxy, terminate TLS at the proxy and inject `X-Owner-Key` on upstream
 *   calls to owner APIs, **or** leave the secret unset and rely on Supabase session + tiered roles + step-up for critical.
 */
export function readOwnerGateSecretEnv(): string | null {
  const v = process.env.OWNER_GATE_SECRET;
  if (typeof v !== "string" || v.trim() === "") return null;
  return v.trim();
}

export function ownerSecretHeaderValid(request: Request, expectedSecret: string): "ok" | "missing" | "mismatch" {
  const sent = request.headers.get(OWNER_SECRET_HEADER)?.trim() ?? "";
  if (sent.length === 0) return "missing";
  return timingSafeEqualStrings(sent, expectedSecret) ? "ok" : "mismatch";
}
