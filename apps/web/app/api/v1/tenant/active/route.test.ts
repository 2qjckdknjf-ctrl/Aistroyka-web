import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSessionUser: vi.fn(),
  createClient: vi.fn(),
  userCanAccessTenant: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: (...args: unknown[]) => mocks.createClient(...args),
  getSessionUser: (...args: unknown[]) => mocks.getSessionUser(...args),
}));

vi.mock("@/lib/tenant/active-tenant", async () => {
  const actual = await vi.importActual<typeof import("@/lib/tenant/active-tenant")>(
    "@/lib/tenant/active-tenant"
  );
  return {
    ...actual,
    userCanAccessTenant: (...args: unknown[]) => mocks.userCanAccessTenant(...args),
  };
});

import { ACTIVE_TENANT_COOKIE } from "@/lib/tenant/active-tenant";
import { DELETE, POST } from "./route";

const T1 = "11111111-1111-4111-8111-111111111111";
const T2 = "22222222-2222-4222-8222-222222222222";

function sameOriginHeaders(extra: Record<string, string> = {}): HeadersInit {
  return {
    host: "aistroyka.ai",
    origin: "https://aistroyka.ai",
    "sec-fetch-site": "same-origin",
    "content-type": "application/json",
    ...extra,
  };
}

async function expectCsrfRejected(
  method: "POST" | "DELETE",
  headers: HeadersInit,
  body?: string
) {
  const init: RequestInit = { method, headers };
  if (body !== undefined) init.body = body;
  const req = new Request("https://aistroyka.ai/api/v1/tenant/active", init);
  const res = method === "POST" ? await POST(req) : await DELETE(req);
  expect(res.status).toBe(403);
  expect(res.headers.get("set-cookie")).toBeNull();
  expect(mocks.getSessionUser).not.toHaveBeenCalled();
}

describe("POST/DELETE /api/v1/tenant/active", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createClient.mockResolvedValue({});
    mocks.getSessionUser.mockResolvedValue({ id: "user-1" });
    mocks.userCanAccessTenant.mockResolvedValue({ ok: true, allowed: true });
  });

  it("rejects unauthenticated", async () => {
    mocks.getSessionUser.mockResolvedValue(null);
    const res = await POST(
      new Request("https://aistroyka.ai/api/v1/tenant/active", {
        method: "POST",
        headers: sameOriginHeaders(),
        body: JSON.stringify({ tenantId: T1 }),
      })
    );
    expect(res.status).toBe(401);
  });

  describe("CSRF / same-origin gate (cookie mutation)", () => {
    const setBody = JSON.stringify({ tenantId: T1 });
    const clearBody = JSON.stringify({ tenantId: null });

    it("rejects missing Origin + missing Sec-Fetch-Site on POST set/clear and DELETE", async () => {
      const headers = { host: "aistroyka.ai", "content-type": "application/json" };
      await expectCsrfRejected("POST", headers, setBody);
      vi.clearAllMocks();
      mocks.createClient.mockResolvedValue({});
      mocks.getSessionUser.mockResolvedValue({ id: "user-1" });
      await expectCsrfRejected("POST", headers, clearBody);
      vi.clearAllMocks();
      mocks.createClient.mockResolvedValue({});
      mocks.getSessionUser.mockResolvedValue({ id: "user-1" });
      await expectCsrfRejected("DELETE", headers);
    });

    it("rejects same-site with foreign Origin on POST set/clear and DELETE", async () => {
      const headers = {
        host: "aistroyka.ai",
        origin: "https://evil.example",
        "sec-fetch-site": "same-site",
        "content-type": "application/json",
      };
      await expectCsrfRejected("POST", headers, setBody);
      vi.clearAllMocks();
      mocks.createClient.mockResolvedValue({});
      await expectCsrfRejected("POST", headers, clearBody);
      vi.clearAllMocks();
      mocks.createClient.mockResolvedValue({});
      await expectCsrfRejected("DELETE", headers);
    });

    it("rejects forged/mismatched Host vs Origin on POST set/clear and DELETE", async () => {
      const headers = {
        host: "aistroyka.ai",
        origin: "https://attacker.aistroyka.ai",
        "sec-fetch-site": "same-origin",
        "content-type": "application/json",
      };
      await expectCsrfRejected("POST", headers, setBody);
      vi.clearAllMocks();
      mocks.createClient.mockResolvedValue({});
      await expectCsrfRejected("POST", headers, clearBody);
      vi.clearAllMocks();
      mocks.createClient.mockResolvedValue({});
      await expectCsrfRejected("DELETE", headers);
    });

    it("rejects invalid Origin on POST set/clear and DELETE", async () => {
      const headers = {
        host: "aistroyka.ai",
        origin: "not-a-url",
        "content-type": "application/json",
      };
      await expectCsrfRejected("POST", headers, setBody);
      vi.clearAllMocks();
      mocks.createClient.mockResolvedValue({});
      await expectCsrfRejected("POST", headers, clearBody);
      vi.clearAllMocks();
      mocks.createClient.mockResolvedValue({});
      await expectCsrfRejected("DELETE", headers);
    });

    it("rejects cross-site on POST set/clear and DELETE", async () => {
      const headers = {
        host: "aistroyka.ai",
        "sec-fetch-site": "cross-site",
        "content-type": "application/json",
      };
      await expectCsrfRejected("POST", headers, setBody);
      vi.clearAllMocks();
      mocks.createClient.mockResolvedValue({});
      await expectCsrfRejected("POST", headers, clearBody);
      vi.clearAllMocks();
      mocks.createClient.mockResolvedValue({});
      await expectCsrfRejected("DELETE", headers);
    });

    it("accepts positive same-origin (matching Origin) on POST set/clear and DELETE", async () => {
      const setRes = await POST(
        new Request("https://aistroyka.ai/api/v1/tenant/active", {
          method: "POST",
          headers: sameOriginHeaders(),
          body: setBody,
        })
      );
      expect(setRes.status).toBe(200);

      const clearRes = await POST(
        new Request("https://aistroyka.ai/api/v1/tenant/active", {
          method: "POST",
          headers: sameOriginHeaders(),
          body: clearBody,
        })
      );
      expect(clearRes.status).toBe(200);

      const delRes = await DELETE(
        new Request("https://aistroyka.ai/api/v1/tenant/active", {
          method: "DELETE",
          headers: sameOriginHeaders(),
        })
      );
      expect(delRes.status).toBe(200);
    });
  });

  it("rejects malformed tenant id", async () => {
    const res = await POST(
      new Request("https://aistroyka.ai/api/v1/tenant/active", {
        method: "POST",
        headers: sameOriginHeaders(),
        body: JSON.stringify({ tenantId: "not-a-uuid" }),
      })
    );
    expect(res.status).toBe(400);
    expect(mocks.userCanAccessTenant).not.toHaveBeenCalled();
  });

  it("rejects unauthorized tenant", async () => {
    mocks.userCanAccessTenant.mockResolvedValue({ ok: true, allowed: false });
    const res = await POST(
      new Request("https://aistroyka.ai/api/v1/tenant/active", {
        method: "POST",
        headers: sameOriginHeaders(),
        body: JSON.stringify({ tenantId: T2 }),
      })
    );
    expect(res.status).toBe(403);
    expect(res.headers.getSetCookie?.() ?? []).toEqual([]);
  });

  it("fails closed on DB access error", async () => {
    mocks.userCanAccessTenant.mockResolvedValue({ ok: false, queryError: true });
    const res = await POST(
      new Request("https://aistroyka.ai/api/v1/tenant/active", {
        method: "POST",
        headers: sameOriginHeaders(),
        body: JSON.stringify({ tenantId: T1 }),
      })
    );
    expect(res.status).toBe(503);
  });

  it("sets HttpOnly cookie on authorized switch", async () => {
    const res = await POST(
      new Request("https://aistroyka.ai/api/v1/tenant/active", {
        method: "POST",
        headers: sameOriginHeaders(),
        body: JSON.stringify({ tenantId: T1 }),
      })
    );
    expect(res.status).toBe(200);
    const setCookie = res.headers.get("set-cookie") ?? "";
    expect(setCookie).toContain(`${ACTIVE_TENANT_COOKIE}=${T1}`);
    expect(setCookie.toLowerCase()).toContain("httponly");
    expect(setCookie.toLowerCase()).toContain("path=/");
    expect(setCookie.toLowerCase()).toContain("samesite=lax");
  });

  it("clears cookie on null tenantId and DELETE", async () => {
    const clearRes = await POST(
      new Request("https://aistroyka.ai/api/v1/tenant/active", {
        method: "POST",
        headers: sameOriginHeaders(),
        body: JSON.stringify({ tenantId: null }),
      })
    );
    expect(clearRes.status).toBe(200);
    expect(clearRes.headers.get("set-cookie") ?? "").toMatch(/Max-Age=0|max-age=0/i);

    const delRes = await DELETE(
      new Request("https://aistroyka.ai/api/v1/tenant/active", {
        method: "DELETE",
        headers: sameOriginHeaders(),
      })
    );
    expect(delRes.status).toBe(200);
    expect(delRes.headers.get("set-cookie") ?? "").toMatch(/Max-Age=0|max-age=0/i);
  });
});
