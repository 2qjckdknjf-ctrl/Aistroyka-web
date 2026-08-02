/**
 * Phase 2B.4 — executable central proofs for requirePlatformOwnerApi.
 * Proves identity → deny mapping, fail-closed grants, opaque denial bodies,
 * capability modes, safe-audit readonly POST exception, and rate-limit preservation.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";
import { OWNER_RATE_LIMIT_ALREADY_APPLIED_HEADER, OWNER_STEP_UP_HEADER } from "./constants";
import { OWNER_READONLY_ALLOWED_POST_PATH } from "./owner-capabilities";

const mockCreateClientFromRequest = vi.fn();
const mockGetSessionUser = vi.fn();
const mockSafeGetSession = vi.fn();
const mockGetPlatformOwnerGrant = vi.fn();
const mockGetAdminClient = vi.fn();
const mockAssertOwnerRateLimit = vi.fn();
const mockInsertPlatformOwnerAudit = vi.fn();
const mockEvaluateOwnerSessionFreshness = vi.fn();
const mockGetRequestClientIp = vi.fn();
const mockIsIpBlockedByOwnerAllowlist = vi.fn();
const mockOwnerSecretHeaderValid = vi.fn();
const mockReadOwnerGateSecretEnv = vi.fn();
const mockIsOwnerApiSecretRequired = vi.fn();
const mockReadOwnerStepUpSecret = vi.fn();
const mockVerifyOwnerStepUpHeader = vi.fn();
const mockLogOwnerGateEvent = vi.fn();
const mockRecordOwnerSecurityDenial = vi.fn();
const mockRecordOwnerSecurityAlert = vi.fn();

vi.mock("@/lib/supabase/server", () => {
  class ServiceRoleForbiddenError extends Error {
    constructor() {
      super("service_role_forbidden");
      this.name = "ServiceRoleForbiddenError";
    }
  }
  return {
    ServiceRoleForbiddenError,
    createClientFromRequest: (...args: unknown[]) => mockCreateClientFromRequest(...args),
    getSessionUser: (...args: unknown[]) => mockGetSessionUser(...args),
    safeGetSession: (...args: unknown[]) => mockSafeGetSession(...args),
  };
});

vi.mock("@/lib/supabase/admin", () => ({
  getAdminClient: (...args: unknown[]) => mockGetAdminClient(...args),
}));

vi.mock("./platform-owner-grant", () => ({
  getPlatformOwnerGrant: (...args: unknown[]) => mockGetPlatformOwnerGrant(...args),
}));

vi.mock("./owner-rate-limit", () => ({
  assertOwnerRateLimit: (...args: unknown[]) => mockAssertOwnerRateLimit(...args),
}));

vi.mock("./owner-audit.service", () => ({
  insertPlatformOwnerAudit: (...args: unknown[]) => mockInsertPlatformOwnerAudit(...args),
}));

vi.mock("./owner-session-policy", () => ({
  evaluateOwnerSessionFreshness: (...args: unknown[]) =>
    mockEvaluateOwnerSessionFreshness(...args),
}));

vi.mock("./client-ip", () => ({
  getRequestClientIp: (...args: unknown[]) => mockGetRequestClientIp(...args),
  isIpBlockedByOwnerAllowlist: (...args: unknown[]) => mockIsIpBlockedByOwnerAllowlist(...args),
}));

vi.mock("./owner-secret-header", () => ({
  ownerSecretHeaderValid: (...args: unknown[]) => mockOwnerSecretHeaderValid(...args),
  readOwnerGateSecretEnv: (...args: unknown[]) => mockReadOwnerGateSecretEnv(...args),
}));

vi.mock("./owner-gate-policy", () => ({
  isOwnerApiSecretRequired: (...args: unknown[]) => mockIsOwnerApiSecretRequired(...args),
}));

vi.mock("./owner-step-up", () => ({
  readOwnerStepUpSecret: (...args: unknown[]) => mockReadOwnerStepUpSecret(...args),
  verifyOwnerStepUpHeader: (...args: unknown[]) => mockVerifyOwnerStepUpHeader(...args),
}));

vi.mock("./owner-access-log", () => ({
  logOwnerGateEvent: (...args: unknown[]) => mockLogOwnerGateEvent(...args),
}));

vi.mock("./owner-security-alerts", () => ({
  recordOwnerSecurityDenial: (...args: unknown[]) => mockRecordOwnerSecurityDenial(...args),
  recordOwnerSecurityAlert: (...args: unknown[]) => mockRecordOwnerSecurityAlert(...args),
}));

import { requirePlatformOwnerApi } from "./require-platform-owner-api";
import { ServiceRoleForbiddenError } from "@/lib/supabase/server";

function req(path: string, method = "GET", headers?: Record<string, string>) {
  return new Request(`https://aistroyka.ai${path}`, { method, headers });
}

async function expectOpaqueForbidden(
  result: Awaited<ReturnType<typeof requirePlatformOwnerApi>>,
  code = "owner_gate"
) {
  expect(result.ok).toBe(false);
  if (result.ok) return;
  expect(result.response.status).toBe(403);
  const body = await result.response.json();
  expect(body).toEqual({ error: "forbidden", code });
  expect(JSON.stringify(body)).not.toMatch(/grant|tenant|email|db_error|not_granted|invalid_role/i);
}

describe("requirePlatformOwnerApi central guard", () => {
  const prevHost = process.env.OWNER_ALLOWED_HOSTS;
  const prevAudit = process.env.OWNER_AUDIT_DENIED;

  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.OWNER_ALLOWED_HOSTS;
    delete process.env.OWNER_AUDIT_DENIED;
    mockGetRequestClientIp.mockReturnValue("127.0.0.1");
    mockIsIpBlockedByOwnerAllowlist.mockReturnValue(false);
    mockReadOwnerGateSecretEnv.mockReturnValue(null);
    mockIsOwnerApiSecretRequired.mockReturnValue(false);
    mockCreateClientFromRequest.mockResolvedValue({ __supabase: true });
    mockSafeGetSession.mockResolvedValue({
      access_token: "tok",
      user: { id: "u1" },
    });
    mockEvaluateOwnerSessionFreshness.mockReturnValue({ stale: false });
    mockGetSessionUser.mockResolvedValue({ id: "u1", email: "owner@example.com" });
    mockGetPlatformOwnerGrant.mockResolvedValue({ ok: true, role: "OWNER" });
    mockGetAdminClient.mockReturnValue({ __admin: true });
    mockAssertOwnerRateLimit.mockResolvedValue({ ok: true });
    mockInsertPlatformOwnerAudit.mockResolvedValue(undefined);
    mockReadOwnerStepUpSecret.mockReturnValue("step-secret");
    mockVerifyOwnerStepUpHeader.mockResolvedValue(true);
  });

  afterEach(() => {
    if (prevHost === undefined) delete process.env.OWNER_ALLOWED_HOSTS;
    else process.env.OWNER_ALLOWED_HOSTS = prevHost;
    if (prevAudit === undefined) delete process.env.OWNER_AUDIT_DENIED;
    else process.env.OWNER_AUDIT_DENIED = prevAudit;
  });

  it("denies anonymous (no session) with opaque body", async () => {
    mockGetSessionUser.mockResolvedValue(null);
    const result = await requirePlatformOwnerApi(req("/api/v1/platform/health"), { mode: "read" });
    await expectOpaqueForbidden(result);
    expect(mockGetPlatformOwnerGrant).not.toHaveBeenCalled();
  });

  it("denies authenticated user without platform_owner_grants (tenant owner equivalent)", async () => {
    mockGetPlatformOwnerGrant.mockResolvedValue({ ok: false, reason: "not_granted" });
    const result = await requirePlatformOwnerApi(req("/api/v1/platform/leads"), { mode: "read" });
    await expectOpaqueForbidden(result);
  });

  it("denies tenant admin / tenant member / stakeholder the same way — grant absence only", async () => {
    // Tenant roles are never consulted; only platform_owner_grants matters.
    for (const label of ["tenant_admin", "tenant_member", "stakeholder"]) {
      mockGetPlatformOwnerGrant.mockResolvedValueOnce({ ok: false, reason: "not_granted" });
      const result = await requirePlatformOwnerApi(
        req("/api/v1/platform/tenants", "GET", { "x-test-identity": label }),
        { mode: "read" }
      );
      await expectOpaqueForbidden(result);
    }
    expect(mockGetPlatformOwnerGrant).toHaveBeenCalledTimes(3);
  });

  it("denies service-role JWT without HTTP bypass", async () => {
    mockCreateClientFromRequest.mockRejectedValueOnce(new ServiceRoleForbiddenError());
    const result = await requirePlatformOwnerApi(req("/api/v1/platform/overview"), {
      mode: "read",
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.response.status).toBe(403);
    const body = await result.response.json();
    expect(body).toEqual({ error: "forbidden" });
    expect(mockGetPlatformOwnerGrant).not.toHaveBeenCalled();
  });

  it("denies grant DB error fail-closed with opaque body", async () => {
    mockGetPlatformOwnerGrant.mockResolvedValue({ ok: false, reason: "db_error" });
    const result = await requirePlatformOwnerApi(req("/api/v1/platform/users"), { mode: "read" });
    await expectOpaqueForbidden(result);
  });

  it("denies missing or unknown grant role", async () => {
    mockGetPlatformOwnerGrant.mockResolvedValue({ ok: false, reason: "invalid_role" });
    const result = await requirePlatformOwnerApi(req("/api/v1/platform/audit"), { mode: "read" });
    await expectOpaqueForbidden(result);
  });

  it("tenant role never replaces platform_owner_grants", async () => {
    mockGetSessionUser.mockResolvedValue({
      id: "tenant-owner-1",
      email: "tenant-owner@example.com",
      app_metadata: { role: "owner" },
      user_metadata: { tenant_role: "owner" },
    });
    mockGetPlatformOwnerGrant.mockResolvedValue({ ok: false, reason: "not_granted" });
    const result = await requirePlatformOwnerApi(req("/api/v1/platform/billing/pilot-status"), {
      mode: "read",
    });
    await expectOpaqueForbidden(result);
    expect(mockGetPlatformOwnerGrant).toHaveBeenCalledWith(expect.anything(), "tenant-owner-1");
  });

  it("blocks host when OWNER_ALLOWED_HOSTS set", async () => {
    process.env.OWNER_ALLOWED_HOSTS = "admin.aistroyka.ai";
    const result = await requirePlatformOwnerApi(req("/api/v1/platform/health"), { mode: "read" });
    await expectOpaqueForbidden(result);
    expect(mockCreateClientFromRequest).not.toHaveBeenCalled();
  });

  it("blocks IP allowlist misses", async () => {
    mockIsIpBlockedByOwnerAllowlist.mockReturnValue(true);
    const result = await requirePlatformOwnerApi(req("/api/v1/platform/health"), { mode: "read" });
    await expectOpaqueForbidden(result);
    expect(mockCreateClientFromRequest).not.toHaveBeenCalled();
  });

  it("blocks invalid owner secret when required", async () => {
    mockReadOwnerGateSecretEnv.mockReturnValue("secret");
    mockIsOwnerApiSecretRequired.mockReturnValue(true);
    mockOwnerSecretHeaderValid.mockReturnValue("mismatch");
    const result = await requirePlatformOwnerApi(req("/api/v1/platform/health"), { mode: "read" });
    await expectOpaqueForbidden(result);
  });

  it("preserves stale session contract", async () => {
    mockEvaluateOwnerSessionFreshness.mockReturnValue({ stale: true, reason: "expired" });
    const result = await requirePlatformOwnerApi(req("/api/v1/platform/health"), { mode: "read" });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.response.status).toBe(401);
    const body = await result.response.json();
    expect(body).toEqual({
      error: "session_stale",
      code: "owner_session_refresh_required",
    });
  });

  it("preserves rate-limit response and headers when middleware marker absent", async () => {
    const rl = new NextResponse(JSON.stringify({ error: "rate_limited", code: "owner_rate_limited" }), {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": "30",
        "X-Rate-Limit-Scope": "platform-owner",
      },
    });
    mockAssertOwnerRateLimit.mockResolvedValue({ ok: false, response: rl });
    const result = await requirePlatformOwnerApi(req("/api/v1/platform/health"), { mode: "read" });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.response.status).toBe(429);
    expect(result.response.headers.get("Retry-After")).toBe("30");
    expect(result.response.headers.get("X-Rate-Limit-Scope")).toBe("platform-owner");
    const body = await result.response.json();
    expect(body.code).toBe("owner_rate_limited");
  });

  it("skips duplicate rate-limit when middleware marker present", async () => {
    const result = await requirePlatformOwnerApi(
      req("/api/v1/platform/health", "GET", {
        [OWNER_RATE_LIMIT_ALREADY_APPLIED_HEADER]: "1",
      }),
      { mode: "read" }
    );
    expect(result.ok).toBe(true);
    expect(mockAssertOwnerRateLimit).not.toHaveBeenCalled();
  });

  describe("owner capability modes", () => {
    it("read mode allows OWNER_READONLY, OWNER_OPERATOR, OWNER", async () => {
      for (const role of ["OWNER_READONLY", "OWNER_OPERATOR", "OWNER"] as const) {
        mockGetPlatformOwnerGrant.mockResolvedValueOnce({ ok: true, role });
        const result = await requirePlatformOwnerApi(req("/api/v1/platform/health"), {
          mode: "read",
        });
        expect(result.ok).toBe(true);
        if (result.ok) expect(result.role).toBe(role);
      }
    });

    it("write mode denies OWNER_READONLY before side effects", async () => {
      mockGetPlatformOwnerGrant.mockResolvedValue({ ok: true, role: "OWNER_READONLY" });
      const result = await requirePlatformOwnerApi(
        req("/api/v1/platform/billing/reprocess-event", "POST"),
        { mode: "write" }
      );
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.response.status).toBe(403);
      const body = await result.response.json();
      expect(body.code).toBe("owner_readonly");
      expect(mockInsertPlatformOwnerAudit).not.toHaveBeenCalled();
    });

    it("write mode allows OWNER_OPERATOR and OWNER", async () => {
      for (const role of ["OWNER_OPERATOR", "OWNER"] as const) {
        mockGetPlatformOwnerGrant.mockResolvedValueOnce({ ok: true, role });
        const result = await requirePlatformOwnerApi(
          req("/api/v1/platform/billing/reprocess-event", "POST"),
          { mode: "write" }
        );
        expect(result.ok).toBe(true);
      }
    });

    it("critical mode denies OWNER_READONLY and OWNER_OPERATOR", async () => {
      for (const role of ["OWNER_READONLY", "OWNER_OPERATOR"] as const) {
        mockGetPlatformOwnerGrant.mockResolvedValueOnce({ ok: true, role });
        const result = await requirePlatformOwnerApi(
          req("/api/v1/platform/critical/echo", "POST"),
          { mode: "critical" }
        );
        expect(result.ok).toBe(false);
        if (result.ok) return;
        const body = await result.response.json();
        // READONLY blocked at HTTP method; OPERATOR reaches critical role check
        expect(["owner_readonly", "owner_critical_role"]).toContain(body.code);
      }
    });

    it("critical mode denies OWNER without step-up", async () => {
      mockVerifyOwnerStepUpHeader.mockResolvedValue(false);
      const result = await requirePlatformOwnerApi(
        req("/api/v1/platform/critical/echo", "POST"),
        { mode: "critical" }
      );
      expect(result.ok).toBe(false);
      if (result.ok) return;
      const body = await result.response.json();
      expect(body).toEqual({ error: "forbidden", code: "owner_step_up_required" });
    });

    it("critical mode denies OWNER with invalid/expired step-up", async () => {
      mockVerifyOwnerStepUpHeader.mockResolvedValue(false);
      const result = await requirePlatformOwnerApi(
        req("/api/v1/platform/critical/echo", "POST", {
          [OWNER_STEP_UP_HEADER]: "stale-or-wrong",
        }),
        { mode: "critical" }
      );
      expect(result.ok).toBe(false);
      if (result.ok) return;
      const body = await result.response.json();
      expect(body.code).toBe("owner_step_up_required");
    });

    it("critical mode allows OWNER with valid step-up", async () => {
      mockVerifyOwnerStepUpHeader.mockResolvedValue(true);
      const result = await requirePlatformOwnerApi(
        req("/api/v1/platform/critical/echo", "POST", {
          [OWNER_STEP_UP_HEADER]: "valid",
        }),
        { mode: "critical" }
      );
      expect(result.ok).toBe(true);
      expect(mockVerifyOwnerStepUpHeader).toHaveBeenCalled();
    });
  });

  describe("safe-audit readonly POST exception", () => {
    it("OWNER_READONLY may POST exact refresh path under mode:read", async () => {
      mockGetPlatformOwnerGrant.mockResolvedValue({ ok: true, role: "OWNER_READONLY" });
      const result = await requirePlatformOwnerApi(
        req(OWNER_READONLY_ALLOWED_POST_PATH, "POST"),
        { mode: "read" }
      );
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.role).toBe("OWNER_READONLY");
    });

    it("OWNER_READONLY still denied on other write POSTs", async () => {
      mockGetPlatformOwnerGrant.mockResolvedValue({ ok: true, role: "OWNER_READONLY" });
      for (const path of [
        "/api/v1/platform/testing/safe-audit/save",
        "/api/v1/platform/billing/reprocess-event",
        "/api/v1/platform/testing/safe-audit/refresh/extra",
        "/api/v1/platform/testing/safe-audit/refresh/",
      ]) {
        const result = await requirePlatformOwnerApi(req(path, "POST"), { mode: "write" });
        expect(result.ok).toBe(false);
      }
    });

    it("OWNER_READONLY denied when mode is write even on refresh path", async () => {
      mockGetPlatformOwnerGrant.mockResolvedValue({ ok: true, role: "OWNER_READONLY" });
      // HTTP method exception alone is insufficient — handler mode:write still blocks.
      const result = await requirePlatformOwnerApi(
        req(OWNER_READONLY_ALLOWED_POST_PATH, "POST"),
        { mode: "write" }
      );
      expect(result.ok).toBe(false);
      if (result.ok) return;
      const body = await result.response.json();
      expect(body.code).toBe("owner_write_required");
    });
  });

  it("allows granted OWNER and records allow audit", async () => {
    const result = await requirePlatformOwnerApi(req("/api/v1/platform/health"), { mode: "read" });
    expect(result.ok).toBe(true);
    expect(mockInsertPlatformOwnerAudit).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        user_id: "u1",
        action: "owner_api_GET",
        entity_id: "/api/v1/platform/health",
      })
    );
  });
});
