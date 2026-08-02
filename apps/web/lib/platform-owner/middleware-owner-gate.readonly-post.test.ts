/**
 * Phase 2B.4 — gateOwnerRequest shares assertOwnerHttpMethodForRole pathname policy
 * with requirePlatformOwnerApi (safe-audit refresh exact POST exception).
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { OWNER_READONLY_ALLOWED_POST_PATH } from "./owner-capabilities";

const mockGetPlatformOwnerGrant = vi.fn();
const mockAssertOwnerRateLimit = vi.fn();
const mockGetAdminClient = vi.fn();
const mockEvaluateOwnerSessionFreshness = vi.fn();
const mockCreateServerClient = vi.fn();

vi.mock("@supabase/ssr", () => ({
  createServerClient: (...args: unknown[]) => mockCreateServerClient(...args),
}));

vi.mock("@/lib/env", () => ({
  getPublicEnv: () => ({
    NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
  }),
}));

vi.mock("@/lib/supabase/admin", () => ({
  getAdminClient: (...args: unknown[]) => mockGetAdminClient(...args),
}));

vi.mock("./platform-owner-grant", () => ({
  getPlatformOwnerGrant: (...args: unknown[]) => mockGetPlatformOwnerGrant(...args),
}));

vi.mock("./owner-rate-limit", () => ({
  assertOwnerRateLimit: (...args: unknown[]) => mockAssertOwnerRateLimit(...args),
}));

vi.mock("./owner-session-policy", () => ({
  evaluateOwnerSessionFreshness: (...args: unknown[]) =>
    mockEvaluateOwnerSessionFreshness(...args),
}));

vi.mock("./owner-access-log", () => ({
  logOwnerGateEvent: vi.fn(),
}));

vi.mock("./owner-security-alerts", () => ({
  recordOwnerSecurityDenial: vi.fn(),
  recordOwnerSecurityAlert: vi.fn(),
}));

vi.mock("./owner-secret-header", () => ({
  readOwnerGateSecretEnv: () => null,
  ownerSecretHeaderValid: () => "ok",
}));

vi.mock("./client-ip", () => ({
  getRequestClientIp: () => "127.0.0.1",
  isIpBlockedByOwnerAllowlist: () => false,
}));

import { gateOwnerRequest } from "./middleware-owner-gate";

describe("gateOwnerRequest Phase 2B.4 readonly POST policy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.OWNER_ALLOWED_HOSTS;
    mockCreateServerClient.mockReturnValue({
      auth: {
        getSession: async () => ({ data: { session: { access_token: "tok" } } }),
      },
    });
    mockEvaluateOwnerSessionFreshness.mockReturnValue({ stale: false });
    mockGetAdminClient.mockReturnValue({});
    mockAssertOwnerRateLimit.mockResolvedValue({ ok: true });
  });

  it("allows OWNER_READONLY POST only on exact safe-audit refresh path", async () => {
    mockGetPlatformOwnerGrant.mockResolvedValue({ ok: true, role: "OWNER_READONLY" });
    const request = new NextRequest(`https://aistroyka.ai${OWNER_READONLY_ALLOWED_POST_PATH}`, {
      method: "POST",
    });
    const denied = await gateOwnerRequest({
      request,
      sessionResponse: NextResponse.next(),
      user: { id: "u1" },
      pathname: OWNER_READONLY_ALLOWED_POST_PATH,
      isApi: true,
    });
    expect(denied).toBeNull();
  });

  it("blocks OWNER_READONLY POST on safe-audit save and other mutations", async () => {
    mockGetPlatformOwnerGrant.mockResolvedValue({ ok: true, role: "OWNER_READONLY" });
    for (const path of [
      "/api/v1/platform/testing/safe-audit/save",
      "/api/v1/platform/billing/reprocess-event",
      `${OWNER_READONLY_ALLOWED_POST_PATH}/`,
      `${OWNER_READONLY_ALLOWED_POST_PATH}/extra`,
    ]) {
      const request = new NextRequest(`https://aistroyka.ai${path}`, { method: "POST" });
      const denied = await gateOwnerRequest({
        request,
        sessionResponse: NextResponse.next(),
        user: { id: "u1" },
        pathname: path,
        isApi: true,
      });
      expect(denied).not.toBeNull();
      expect(denied!.status).toBe(403);
    }
  });
});
