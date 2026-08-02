import { describe, expect, it, vi } from "vitest";
import { forbidDisallowedLitePath } from "./lite-allow-list";
import { getTenantContextFromRequest } from "@/lib/tenant/tenant.context";

const createClientFromRequest = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
  createClientFromRequest: (...args: unknown[]) => createClientFromRequest(...args),
  ServiceRoleForbiddenError: class ServiceRoleForbiddenError extends Error {},
}));

describe("handler-level lite allow-list guard", () => {
  it("forbidDisallowedLitePath returns exact 403 body for ios_worker before route work", async () => {
    const request = new Request("http://localhost/api/v1/admin/metrics/overview", {
      headers: { "x-client": "ios_worker" },
    });

    const response = forbidDisallowedLitePath(request);
    expect(response).not.toBeNull();
    expect(response!.status).toBe(403);
    await expect(response!.json()).resolves.toEqual({
      error: "forbidden",
      code: "lite_client_path_forbidden",
    });
  });

  it("getTenantContextFromRequest denies admin, billing, and AI before creating Supabase client", async () => {
    for (const path of [
      "/api/v1/admin/metrics/overview",
      "/api/v1/billing/overview",
      "/api/v1/ai/requests",
    ]) {
      createClientFromRequest.mockClear();
      const ctx = await getTenantContextFromRequest(
        new Request(`http://localhost${path}`, {
          headers: { "x-client": "ios_worker" },
        })
      );

      expect(ctx).toMatchObject({
        tenantId: null,
        userId: null,
        role: null,
        clientProfile: "ios_worker",
        litePathForbidden: true,
      });
      expect(createClientFromRequest, path).not.toHaveBeenCalled();
    }
  });
});
