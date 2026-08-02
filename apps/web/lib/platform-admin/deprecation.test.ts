import { describe, expect, it } from "vitest";
import { NextResponse } from "next/server";
import {
  deprecatedTenantAdminPlatformApiResponse,
  withDeprecatedTenantAdminPlatformApiDeprecation,
  withLegacyOwnerApiDeprecation,
} from "./deprecation";
import { PLATFORM_API_PREFIX } from "./constants";

async function expectExactBody(res: Response, expectedText: string) {
  expect(await res.text()).toBe(expectedText);
}

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

  it("preserves status, statusText, body, Content-Type, custom headers, Retry-After on 2xx", async () => {
    const payload = { ok: true, nonce: "preserve-2xx-abc" };
    const bodyText = JSON.stringify(payload);
    const base = new NextResponse(bodyText, {
      status: 200,
      statusText: "OK",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "X-Trace-Id": "trace-preserve-1",
        "Retry-After": "7",
        "Cache-Control": "no-store",
      },
    });
    const wrapped = withDeprecatedTenantAdminPlatformApiDeprecation(base, "/leads");
    expect(wrapped.status).toBe(200);
    expect(wrapped.statusText).toBe("OK");
    await expectExactBody(wrapped, bodyText);
    expect(wrapped.headers.get("Content-Type")).toBe("application/json; charset=utf-8");
    expect(wrapped.headers.get("X-Trace-Id")).toBe("trace-preserve-1");
    expect(wrapped.headers.get("Retry-After")).toBe("7");
    expect(wrapped.headers.get("Cache-Control")).toBe("no-store");
    expect(wrapped.headers.get("Deprecation")).toBe("true");
    expect(wrapped.headers.get("Link")).toBe(
      `<${PLATFORM_API_PREFIX}/leads>; rel="successor-version"`
    );
  });

  it("preserves Set-Cookie when present on the source response", async () => {
    const base = NextResponse.json({ ok: true }, { status: 200 });
    base.headers.set("Set-Cookie", "sb-access-token=tok; Path=/; HttpOnly");
    const wrapped = withDeprecatedTenantAdminPlatformApiDeprecation(base, "/billing/pilot-status");
    expect(wrapped.status).toBe(200);
    expect(wrapped.headers.get("Set-Cookie")).toBe("sb-access-token=tok; Path=/; HttpOnly");
    expect(wrapped.headers.get("Deprecation")).toBe("true");
  });

  it("preserves 204 with empty body and only adds Deprecation/Link", async () => {
    const base = new NextResponse(null, {
      status: 204,
      statusText: "No Content",
      headers: { "X-Empty": "1" },
    });
    const wrapped = withDeprecatedTenantAdminPlatformApiDeprecation(base, "/leads");
    expect(wrapped.status).toBe(204);
    expect(wrapped.statusText).toBe("No Content");
    expect(wrapped.headers.get("X-Empty")).toBe("1");
    const text = await wrapped.text();
    expect(text).toBe("");
    expect(wrapped.headers.get("Deprecation")).toBe("true");
    expect(wrapped.headers.get("Link")).toContain(`${PLATFORM_API_PREFIX}/leads`);
  });

  it.each([
    { status: 401, statusText: "Unauthorized", code: "owner_session_refresh_required" },
    { status: 403, statusText: "Forbidden", code: "owner_gate" },
    { status: 429, statusText: "Too Many Requests", code: "owner_rate_limited" },
  ] as const)(
    "preserves $status error payload, statusText, Retry-After, and custom headers",
    async ({ status, statusText, code }) => {
      const payload = { error: "denied", code, nonce: `preserve-${status}-xyz` };
      const bodyText = JSON.stringify(payload);
      const base = new NextResponse(bodyText, {
        status,
        statusText,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": "60",
          "X-Error-Id": `err-${status}`,
        },
      });
      const wrapped = withDeprecatedTenantAdminPlatformApiDeprecation(base, "/billing/pilot-status");
      expect(wrapped.status).toBe(status);
      expect(wrapped.statusText).toBe(statusText);
      await expectExactBody(wrapped, bodyText);
      expect(wrapped.headers.get("Content-Type")).toBe("application/json");
      expect(wrapped.headers.get("Retry-After")).toBe("60");
      expect(wrapped.headers.get("X-Error-Id")).toBe(`err-${status}`);
      expect(wrapped.headers.get("Deprecation")).toBe("true");
      expect(wrapped.headers.get("Link")).toBe(
        `<${PLATFORM_API_PREFIX}/billing/pilot-status>; rel="successor-version"`
      );
    }
  );

  it("replaces only Deprecation and Link when they already exist", async () => {
    const payload = { data: [] };
    const bodyText = JSON.stringify(payload);
    const base = new NextResponse(bodyText, {
      status: 200,
      statusText: "OK",
      headers: {
        "Content-Type": "application/json",
        Deprecation: "false",
        Link: "</old>; rel=\"predecessor-version\"",
        "X-Keep": "yes",
      },
    });
    const wrapped = withDeprecatedTenantAdminPlatformApiDeprecation(base, "/leads/bulk");
    expect(wrapped.status).toBe(200);
    expect(wrapped.statusText).toBe("OK");
    await expectExactBody(wrapped, bodyText);
    expect(wrapped.headers.get("X-Keep")).toBe("yes");
    expect(wrapped.headers.get("Deprecation")).toBe("true");
    expect(wrapped.headers.get("Link")).toBe(
      `<${PLATFORM_API_PREFIX}/leads/bulk>; rel="successor-version"`
    );
  });
});
