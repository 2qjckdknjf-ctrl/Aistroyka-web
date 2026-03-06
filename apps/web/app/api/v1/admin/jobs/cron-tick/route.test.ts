import { describe, expect, it, vi } from "vitest";
import { POST } from "./route";

vi.mock("@/lib/supabase/admin", () => ({ getAdminClient: vi.fn() }));
vi.mock("@/lib/platform/jobs/job.service", () => ({ enqueueJob: vi.fn(), processJobs: vi.fn() }));
vi.mock("@/lib/api/cron-auth", () => ({ requireCronSecretIfEnabled: vi.fn().mockReturnValue(null) }));

describe("POST /api/v1/admin/jobs/cron-tick", () => {
  it("returns 403 when cron secret required and missing", async () => {
    const { requireCronSecretIfEnabled } = await import("@/lib/api/cron-auth");
    vi.mocked(requireCronSecretIfEnabled).mockReturnValue(new Response(JSON.stringify({ error: "Unauthorized" }), { status: 403 }) as any);
    const req = new Request("https://x/api/v1/admin/jobs/cron-tick", { method: "POST" });
    const res = await POST(req);
    expect(res.status).toBe(403);
    vi.mocked(requireCronSecretIfEnabled).mockReturnValue(null);
  });

  it("schedules per tenant and runs processJobs", async () => {
    const tenants = [{ id: "t1" }, { id: "t2" }];
    const admin = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({ data: tenants }),
      }),
    };
    const { getAdminClient } = await import("@/lib/supabase/admin");
    const { enqueueJob, processJobs } = await import("@/lib/platform/jobs/job.service");
    vi.mocked(getAdminClient).mockReturnValue(admin as any);
    vi.mocked(enqueueJob).mockImplementation(async (_a, p) => ({ id: p.tenant_id } as any));
    vi.mocked(processJobs).mockResolvedValue({ processed: 2, success: 2, failed: 0, dead: 0 });

    const req = new Request("https://x/api/v1/admin/jobs/cron-tick", { method: "POST" });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ ok: true, scheduled: 4, processed: 2, tenants: 2 });
    expect(enqueueJob).toHaveBeenCalledTimes(4);
    expect(processJobs).toHaveBeenCalledWith(admin, expect.stringMatching(/^cron-tick-\d+$/), expect.objectContaining({
      limit: 20,
      tenantId: undefined,
      timeBudgetMs: 25_000,
    }));
  });

  it("returns 503 when admin client not configured", async () => {
    const { getAdminClient } = await import("@/lib/supabase/admin");
    vi.mocked(getAdminClient).mockReturnValue(null);
    const req = new Request("https://x/api/v1/admin/jobs/cron-tick", { method: "POST" });
    const res = await POST(req);
    expect(res.status).toBe(503);
  });
});
