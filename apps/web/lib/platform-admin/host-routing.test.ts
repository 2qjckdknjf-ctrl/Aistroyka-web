import { describe, expect, it } from "vitest";
import {
  isAdminHostAllowedApiPath,
  isAdminHostBlockedApiPath,
  isAdminHostMarketingPath,
  isAdminHostTenantPath,
  resolveAdminHostPageRouting,
  resolvePlatformAdminLandingPath,
} from "./host-routing";
import { PLATFORM_API_PREFIX } from "./constants";

describe("host-routing", () => {
  const adminHost = "admin.aistroyka.ai";
  const publicHost = "aistroyka.ai";

  it("resolves platform admin landing path with locale", () => {
    expect(resolvePlatformAdminLandingPath("en")).toBe("/en/platform-admin");
    expect(resolvePlatformAdminLandingPath("ru")).toBe("/ru/platform-admin");
    expect(resolvePlatformAdminLandingPath("xx")).toBe("/ru/platform-admin");
  });

  it("redirects admin host root to platform-admin landing", () => {
    expect(resolveAdminHostPageRouting(adminHost, "/", "ru")).toEqual({
      action: "redirect",
      targetPath: "/ru/platform-admin",
      reason: "platform_admin_landing",
    });
  });

  it("redirects admin host marketing paths to platform-admin landing", () => {
    expect(resolveAdminHostPageRouting(adminHost, "/features", "en")).toEqual({
      action: "redirect",
      targetPath: "/en/platform-admin",
      reason: "platform_admin_landing",
    });
    expect(isAdminHostMarketingPath("/pricing")).toBe(true);
  });

  it("redirects admin host tenant paths to platform-admin landing", () => {
    expect(resolveAdminHostPageRouting(adminHost, "/dashboard", "ru")).toEqual({
      action: "redirect",
      targetPath: "/ru/platform-admin",
      reason: "platform_admin_landing",
    });
    expect(isAdminHostTenantPath("/admin/leads")).toBe(true);
  });

  it("allows platform-admin, owner, and auth paths on admin host", () => {
    expect(resolveAdminHostPageRouting(adminHost, "/platform-admin", "ru")).toEqual({
      action: "allow",
    });
    expect(resolveAdminHostPageRouting(adminHost, "/platform-admin/testing", "ru")).toEqual({
      action: "allow",
    });
    expect(resolveAdminHostPageRouting(adminHost, "/owner", "ru")).toEqual({ action: "allow" });
    expect(resolveAdminHostPageRouting(adminHost, "/login", "ru")).toEqual({ action: "allow" });
  });

  it("does not redirect public host routes", () => {
    expect(resolveAdminHostPageRouting(publicHost, "/", "ru")).toEqual({ action: "allow" });
    expect(resolveAdminHostPageRouting(publicHost, "/features", "ru")).toEqual({
      action: "allow",
    });
    expect(resolveAdminHostPageRouting(publicHost, "/platform-admin", "ru")).toEqual({
      action: "allow",
    });
  });

  it("allows platform APIs and health on admin host; blocks tenant APIs", () => {
    expect(isAdminHostAllowedApiPath("/api/v1/health")).toBe(true);
    expect(isAdminHostAllowedApiPath(`${PLATFORM_API_PREFIX}/overview`)).toBe(true);
    expect(isAdminHostAllowedApiPath("/api/v1/admin/flags")).toBe(false);
    expect(isAdminHostAllowedApiPath("/api/v1/admin/billing/pilot-status")).toBe(true);
    expect(isAdminHostAllowedApiPath("/api/v1/admin/leads")).toBe(true);

    expect(isAdminHostBlockedApiPath(adminHost, "/api/v1/admin/flags")).toBe(true);
    expect(isAdminHostBlockedApiPath(adminHost, "/api/v1/admin/billing/pilot-status")).toBe(false);
    expect(isAdminHostBlockedApiPath(adminHost, "/api/v1/admin/leads")).toBe(false);
    expect(isAdminHostBlockedApiPath(adminHost, `${PLATFORM_API_PREFIX}/overview`)).toBe(false);
    expect(isAdminHostBlockedApiPath(publicHost, "/api/v1/admin/flags")).toBe(false);
  });
});
