/**
 * Shared helpers for Phase 2B.4 platform route negative-access tests.
 * Central identity→deny proofs live in require-platform-owner-api.test.ts;
 * route tests prove handler wiring, mode, and zero side effects on denial.
 */
import { expect, type Mock } from "vitest";
import { NextResponse } from "next/server";
import type { PlatformOwnerRole } from "@/lib/platform-owner/constants";
import type { OwnerApiGuardMode } from "@/lib/platform-owner/require-platform-owner-api";

export const PLATFORM_NEGATIVE_IDENTITIES = [
  "anonymous",
  "tenant_owner",
  "tenant_admin",
  "tenant_member",
  "stakeholder",
  "service_role",
] as const;

export type PlatformNegativeIdentity = (typeof PLATFORM_NEGATIVE_IDENTITIES)[number];

export function ownerOk(role: PlatformOwnerRole = "OWNER") {
  return { ok: true as const, supabase: { __mock: true }, userId: "owner-user-1", role };
}

export function ownerDeny(status = 403, code = "owner_gate") {
  return {
    ok: false as const,
    response: NextResponse.json({ error: "forbidden", code }, { status }),
  };
}

/** Stable denial body used across route-level identity labels (central tests prove real mapping). */
export function ownerDenyForIdentity(identity: PlatformNegativeIdentity) {
  return ownerDeny(403, "owner_gate");
}

export function requestFor(
  path: string,
  method: string,
  init?: { body?: unknown; headers?: Record<string, string> }
): Request {
  const headers = new Headers(init?.headers);
  if (init?.body !== undefined && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }
  return new Request(`https://aistroyka.ai${path}`, {
    method,
    headers,
    body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
  });
}

export async function expectForbiddenOwnerGate(res: Response) {
  expect(res.status).toBe(403);
  const body = await res.json();
  expect(body).toEqual({ error: "forbidden", code: "owner_gate" });
}

export function expectGuardCalledFirst(
  mockRequire: Mock,
  mode: OwnerApiGuardMode,
  sideEffectMocks: Mock[]
) {
  expect(mockRequire).toHaveBeenCalled();
  expect(mockRequire).toHaveBeenCalledWith(expect.anything(), { mode });
  for (const m of sideEffectMocks) {
    expect(m).not.toHaveBeenCalled();
  }
}

export function expectAllowedRoleReachedSuccess(
  res: Response,
  mockRequire: Mock,
  mode: OwnerApiGuardMode,
  opts?: { minStatus?: number; maxStatus?: number }
) {
  expect(mockRequire).toHaveBeenCalledWith(expect.anything(), { mode });
  const min = opts?.minStatus ?? 200;
  const max = opts?.maxStatus ?? 299;
  expect(res.status).toBeGreaterThanOrEqual(min);
  expect(res.status).toBeLessThanOrEqual(max);
}
