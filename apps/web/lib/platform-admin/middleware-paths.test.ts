import { describe, expect, it } from "vitest";
import {
  isPlatformAdminApiPath,
  isPlatformAdminPagePath,
  shouldBypassApiMiddleware,
} from "./middleware-paths";
import { PLATFORM_ADMIN_BASE_PATH, PLATFORM_API_PREFIX, LEGACY_OWNER_API_PREFIX } from "./constants";

describe("platform-admin middleware-paths", () => {
  it("detects platform-admin page paths", () => {
    expect(isPlatformAdminPagePath("/owner")).toBe(true);
    expect(isPlatformAdminPagePath("/owner/")).toBe(true);
    expect(isPlatformAdminPagePath(PLATFORM_ADMIN_BASE_PATH)).toBe(true);
    expect(isPlatformAdminPagePath(`${PLATFORM_ADMIN_BASE_PATH}/billing`)).toBe(true);
    expect(isPlatformAdminPagePath(`${PLATFORM_ADMIN_BASE_PATH}/testing`)).toBe(true);
    expect(isPlatformAdminPagePath("/admin")).toBe(false);
    expect(isPlatformAdminPagePath("/dashboard")).toBe(false);
  });

  it("detects platform-admin API paths", () => {
    expect(isPlatformAdminApiPath(`${LEGACY_OWNER_API_PREFIX}/overview`)).toBe(true);
    expect(isPlatformAdminApiPath(`${PLATFORM_API_PREFIX}/leads`)).toBe(true);
    expect(isPlatformAdminApiPath(`${PLATFORM_API_PREFIX}/billing/pilot-status`)).toBe(true);
    expect(isPlatformAdminApiPath("/api/v1/admin/leads")).toBe(false);
  });

  it("bypasses worker middleware except owner and platform namespaces", () => {
    expect(shouldBypassApiMiddleware("/api/v1/health")).toBe(true);
    expect(shouldBypassApiMiddleware("/api/v1/admin/leads")).toBe(true);
    expect(shouldBypassApiMiddleware(`${LEGACY_OWNER_API_PREFIX}/health`)).toBe(false);
    expect(shouldBypassApiMiddleware(`${PLATFORM_API_PREFIX}/health`)).toBe(false);
  });
});
