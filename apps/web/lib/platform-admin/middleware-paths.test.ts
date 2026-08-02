import { describe, expect, it } from "vitest";
import {
  isPlatformAdminApiPath,
  isPlatformAdminPagePath,
  shouldBypassApiMiddleware,
} from "./middleware-paths";
import {
  PLATFORM_ADMIN_BASE_PATH,
  PLATFORM_API_PREFIX,
  LEGACY_OWNER_API_PREFIX,
  LEGACY_ADMIN_BILLING_API_PREFIX,
  LEGACY_ADMIN_LEADS_API_PREFIX,
} from "./constants";
import {
  PLATFORM_OWNER_API_PREFIXES,
  buildIsPlatformOwnerApiPathExpression,
  isPlatformOwnerMiddlewareApiPath,
  matchesSegmentPrefix,
} from "./platform-api-middleware-exceptions.cjs";

const ALIAS_PATHS = [
  "/api/v1/admin/billing/pilot-status",
  "/api/v1/admin/billing/pilot-workspaces",
  "/api/v1/admin/billing/pilot-workspaces/ws-1",
  "/api/v1/admin/billing/process-pending-events",
  "/api/v1/admin/billing/provider-status",
  "/api/v1/admin/billing/reprocess-event",
  "/api/v1/admin/billing/reprocess-workspace-events",
  "/api/v1/admin/billing/workspace-status",
  "/api/v1/admin/leads",
  "/api/v1/admin/leads/lead-1",
  "/api/v1/admin/leads/bulk",
] as const;

const NEAR_MATCH_NEGATIVES = [
  "/api/v1/admin/billingevil",
  "/api/v1/admin/billingevil/x",
  "/api/v1/admin/leadership",
  "/api/v1/admin/leads-extra",
  "/api/v1/admin/leads-extra/1",
  "/api/v1/platformish",
  "/api/v1/platformish/overview",
  "/api/v1/ownerish",
  "/api/v1/ownerish/tenants",
  "/api/v1/admin/flags",
  "/api/v1/admin/jobs",
  "/api/v1/health",
] as const;

describe("platform-admin middleware-paths", () => {
  it("detects platform-admin page paths with segment boundaries", () => {
    expect(isPlatformAdminPagePath("/owner")).toBe(true);
    expect(isPlatformAdminPagePath("/owner/")).toBe(true);
    expect(isPlatformAdminPagePath("/owner/overview")).toBe(true);
    expect(isPlatformAdminPagePath(PLATFORM_ADMIN_BASE_PATH)).toBe(true);
    expect(isPlatformAdminPagePath(`${PLATFORM_ADMIN_BASE_PATH}/billing`)).toBe(true);
    expect(isPlatformAdminPagePath(`${PLATFORM_ADMIN_BASE_PATH}/testing`)).toBe(true);
    expect(isPlatformAdminPagePath("/admin")).toBe(false);
    expect(isPlatformAdminPagePath("/dashboard")).toBe(false);
    expect(isPlatformAdminPagePath("/ownerish")).toBe(false);
    expect(isPlatformAdminPagePath("/platform-adminish")).toBe(false);
  });

  it.each(ALIAS_PATHS)("classifies alias path as platform-owner API: %s", (pathname) => {
    expect(isPlatformAdminApiPath(pathname)).toBe(true);
    expect(shouldBypassApiMiddleware(pathname)).toBe(false);
  });

  it.each(NEAR_MATCH_NEGATIVES)("rejects near-match / ordinary admin path: %s", (pathname) => {
    expect(isPlatformAdminApiPath(pathname)).toBe(false);
    if (pathname.startsWith("/api/v1/")) {
      expect(shouldBypassApiMiddleware(pathname)).toBe(true);
    }
  });

  it("detects canonical platform and owner API paths", () => {
    expect(isPlatformAdminApiPath(`${LEGACY_OWNER_API_PREFIX}/overview`)).toBe(true);
    expect(isPlatformAdminApiPath(LEGACY_OWNER_API_PREFIX)).toBe(true);
    expect(isPlatformAdminApiPath(`${PLATFORM_API_PREFIX}/leads`)).toBe(true);
    expect(isPlatformAdminApiPath(`${PLATFORM_API_PREFIX}/billing/pilot-status`)).toBe(true);
    expect(isPlatformAdminApiPath(PLATFORM_API_PREFIX)).toBe(true);
    expect(isPlatformAdminApiPath(LEGACY_ADMIN_BILLING_API_PREFIX)).toBe(true);
    expect(isPlatformAdminApiPath(LEGACY_ADMIN_LEADS_API_PREFIX)).toBe(true);
  });

  it("bypasses worker middleware except platform-owner namespaces", () => {
    expect(shouldBypassApiMiddleware("/api/v1/health")).toBe(true);
    expect(shouldBypassApiMiddleware("/api/v1/admin/flags")).toBe(true);
    expect(shouldBypassApiMiddleware("/api/v1/admin/leads")).toBe(false);
    expect(shouldBypassApiMiddleware("/api/v1/admin/billing/pilot-status")).toBe(false);
    expect(shouldBypassApiMiddleware(`${LEGACY_OWNER_API_PREFIX}/health`)).toBe(false);
    expect(shouldBypassApiMiddleware(`${PLATFORM_API_PREFIX}/health`)).toBe(false);
  });
});

describe("platform-api-middleware-exceptions.cjs", () => {
  it("exports four segment-safe prefixes", () => {
    expect([...PLATFORM_OWNER_API_PREFIXES]).toEqual([
      "/api/v1/owner",
      "/api/v1/platform",
      "/api/v1/admin/billing",
      "/api/v1/admin/leads",
    ]);
  });

  it("matchesSegmentPrefix is boundary-safe", () => {
    expect(matchesSegmentPrefix("/api/v1/admin/leads", "/api/v1/admin/leads")).toBe(true);
    expect(matchesSegmentPrefix("/api/v1/admin/leads/1", "/api/v1/admin/leads")).toBe(true);
    expect(matchesSegmentPrefix("/api/v1/admin/leadership", "/api/v1/admin/leads")).toBe(false);
    expect(matchesSegmentPrefix("/api/v1/admin/billingevil", "/api/v1/admin/billing")).toBe(false);
  });

  it("buildIsPlatformOwnerApiPathExpression includes all prefixes", () => {
    const expr = buildIsPlatformOwnerApiPathExpression("url.pathname");
    for (const prefix of PLATFORM_OWNER_API_PREFIXES) {
      expect(expr).toContain(JSON.stringify(prefix));
      expect(expr).toContain(JSON.stringify(`${prefix}/`));
    }
    expect(isPlatformOwnerMiddlewareApiPath("/api/v1/admin/billing/pilot-status")).toBe(true);
  });
});
