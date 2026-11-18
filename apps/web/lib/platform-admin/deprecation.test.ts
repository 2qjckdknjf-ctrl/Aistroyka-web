import { describe, expect, it } from "vitest";
import { NextResponse } from "next/server";
import {
  deprecatedTenantAdminPlatformApiResponse,
  withDeprecatedTenantAdminPlatformApiDeprecation,
  withLegacyOwnerApiDeprecation,
} from "./deprecation";
import { PLATFORM_API_PREFIX } from "./constants";

describe("platform-admin deprecation helpers", () => {
  it("returns 403 with canonical platform path for tenant-admin surfaces", async () => {
    const res = deprecatedTenantAdminPlatformApiResponse("/billing/pilot-status");
    expect(res.status).toBe(403);
    expect(res.headers.get("Deprecation")).toBe("true");
    const body = await res.json();
    expect(body.code).toBe("platform_admin_route_moved");
    expect(body.canonical).toBe(`${PLATFORM_API_PREFIX}/billing/pilot-status`);
  });

  it("adds deprecation headers to legacy owner alias responses", () => {
    const base = NextResponse.json({ ok: true });
    const wrapped = withLegacyOwnerApiDeprecation(base);
    expect(wrapped.headers.get("Deprecation")).toBe("true");
    expect(wrapped.headers.get("Link")).toContain(PLATFORM_API_PREFIX);
  });

  it("adds deprecation headers to legacy tenant-admin alias responses", () => {
    const base = NextResponse.json({ data: [] });
    const wrapped = withDeprecatedTenantAdminPlatformApiDeprecation(base, "/leads");
    expect(wrapped.headers.get("Deprecation")).toBe("true");
    expect(wrapped.headers.get("Link")).toContain(`${PLATFORM_API_PREFIX}/leads`);
  });
});
