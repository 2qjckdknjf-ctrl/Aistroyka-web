import { describe, expect, it, vi, beforeEach } from "vitest";
import { GET, PATCH } from "./route";

vi.mock("@/lib/supabase/server", () => ({
  createClientFromRequest: vi.fn(),
  getSessionUser: vi.fn().mockResolvedValue({ id: "user-1" }),
}));

vi.mock("@/lib/tenant", () => ({
  getTenantContextFromRequest: vi.fn(),
  requireTenant: vi.fn(),
  TenantRequiredError: class TenantRequiredError extends Error {},
}));

vi.mock("@/lib/auth/tenant", () => ({
  hasMinRole: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  getAdminClient: vi.fn(),
}));

vi.mock("@/lib/platform/ai-flywheel/training-consent.service", () => ({
  getTrainingConsent: vi.fn(),
  updateTrainingConsent: vi.fn(),
}));

import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest } from "@/lib/tenant";
import { hasMinRole } from "@/lib/auth/tenant";
import { getAdminClient } from "@/lib/supabase/admin";
import {
  getTrainingConsent,
  updateTrainingConsent,
} from "@/lib/platform/ai-flywheel/training-consent.service";

describe("ai-training-consent route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getTenantContextFromRequest).mockResolvedValue({
      tenantId: "t1",
      userId: "user-1",
      role: "admin",
    } as never);
    vi.mocked(createClientFromRequest).mockResolvedValue({} as never);
  });

  it("GET returns 403 for non-admin", async () => {
    vi.mocked(hasMinRole).mockResolvedValue(false);
    const res = await GET(new Request("http://localhost/api/v1/tenant/ai-training-consent"));
    expect(res.status).toBe(403);
  });

  it("GET returns consent state for admin", async () => {
    vi.mocked(hasMinRole).mockResolvedValue(true);
    vi.mocked(getTrainingConsent).mockResolvedValue({ aiTrainingConsent: false });
    const res = await GET(new Request("http://localhost/api/v1/tenant/ai-training-consent"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.aiTrainingConsent).toBe(false);
  });

  it("PATCH returns 403 for non-admin", async () => {
    vi.mocked(hasMinRole).mockResolvedValue(false);
    const res = await PATCH(
      new Request("http://localhost/api/v1/tenant/ai-training-consent", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aiTrainingConsent: true }),
      })
    );
    expect(res.status).toBe(403);
  });

  it("PATCH updates consent for admin", async () => {
    vi.mocked(hasMinRole).mockResolvedValue(true);
    vi.mocked(getAdminClient).mockReturnValue({} as never);
    vi.mocked(updateTrainingConsent).mockResolvedValue({ ok: true, aiTrainingConsent: true });
    const res = await PATCH(
      new Request("http://localhost/api/v1/tenant/ai-training-consent", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aiTrainingConsent: true }),
      })
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.aiTrainingConsent).toBe(true);
  });
});
