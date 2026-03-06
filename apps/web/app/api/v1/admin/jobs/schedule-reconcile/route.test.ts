import { describe, expect, it, vi } from "vitest";
import { POST } from "./route";

vi.mock("@/lib/supabase/admin", () => ({ getAdminClient: vi.fn() }));
vi.mock("@/lib/platform/jobs/job.service", () => ({ enqueueJob: vi.fn() }));
vi.mock("@/lib/api/cron-auth", () => ({ requireCronSecretIfEnabled: vi.fn().mockReturnValue(null) }));

describe("POST /api/v1/admin/jobs/schedule-reconcile", () => {
  it("enqueues one job per tenant with tenant-scoped dedupe_key", async () => {
    const tenants = [{ id: "t1" }, { id: "t2" }];
    const admin = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({ data: tenants }),
      }),
    };
    const { getAdminClient } = await import("@/lib/supabase/admin");
    const { enqueueJob } = await import("@/lib/platform/jobs/job.service");
    vi.mocked(getAdminClient).mockReturnValue(admin as any);
    vi.mocked(enqueueJob).mockImplementation(async (_a, p) => ({ id: `job-${p.tenant_id}`, ...p } as any));

    const req = new Request("https://x/api/v1/admin/jobs/schedule-reconcile", { method: "POST" });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ ok: true, enqueued: 2, tenants: 2 });
    expect(enqueueJob).toHaveBeenCalledTimes(2);
    expect(enqueueJob).toHaveBeenNthCalledWith(1, admin, expect.objectContaining({
      tenant_id: "t1",
      type: "upload_reconcile",
      dedupe_key: "upload_reconcile:t1",
    }));
    expect(enqueueJob).toHaveBeenNthCalledWith(2, admin, expect.objectContaining({
      tenant_id: "t2",
      type: "upload_reconcile",
      dedupe_key: "upload_reconcile:t2",
    }));
  });

  it("returns 403 when cron secret required and missing", async () => {
    const { requireCronSecretIfEnabled } = await import("@/lib/api/cron-auth");
    vi.mocked(requireCronSecretIfEnabled).mockReturnValue(new Response(JSON.stringify({ error: "Unauthorized" }), { status: 403 }) as any);
    const req = new Request("https://x/api/v1/admin/jobs/schedule-reconcile", { method: "POST" });
    const res = await POST(req);
    expect(res.status).toBe(403);
    vi.mocked(requireCronSecretIfEnabled).mockReturnValue(null);
  });
});
