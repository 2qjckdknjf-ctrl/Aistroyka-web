import { describe, expect, it, vi } from "vitest";
import { POST } from "./route";

vi.mock("@/lib/supabase/admin", () => ({ getAdminClient: vi.fn() }));
vi.mock("@/lib/platform/jobs/job.recovery",()=>({recoverExpiredMaintenanceClaims:vi.fn().mockResolvedValue(0)}));
vi.mock("@/lib/api/require-platform-admin-legacy-route",()=>({blockAuthenticatedNonPlatformCronCaller:vi.fn().mockResolvedValue(null)}));
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
    const { recoverExpiredMaintenanceClaims } = await import("@/lib/platform/jobs/job.recovery");
    vi.mocked(recoverExpiredMaintenanceClaims).mockResolvedValueOnce(1).mockResolvedValueOnce(1);
    vi.mocked(getAdminClient).mockReturnValue(admin as any);
    vi.mocked(enqueueJob).mockImplementation(async (_a, p) => ({ id: `job-${p.tenant_id}`, ...p } as any));

    const req = new Request("https://x/api/v1/admin/jobs/schedule-reconcile", { method: "POST" });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ ok: true, enqueued: 2, recovered: 2, tenants: 2 });
    expect(enqueueJob).toHaveBeenCalledTimes(2);
    expect(recoverExpiredMaintenanceClaims).toHaveBeenCalledWith(admin,"t1");
    expect(recoverExpiredMaintenanceClaims).toHaveBeenCalledWith(admin,"t2");
    expect(vi.mocked(recoverExpiredMaintenanceClaims).mock.invocationCallOrder[0]).toBeLessThan(vi.mocked(enqueueJob).mock.invocationCallOrder[0]);
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
  it("denies a tenant admin before recovery or scheduling",async()=>{
    vi.clearAllMocks();const { blockAuthenticatedNonPlatformCronCaller } = await import("@/lib/api/require-platform-admin-legacy-route");const { recoverExpiredMaintenanceClaims }=await import("@/lib/platform/jobs/job.recovery");const {enqueueJob}=await import("@/lib/platform/jobs/job.service");
    vi.mocked(blockAuthenticatedNonPlatformCronCaller).mockResolvedValueOnce(new Response(JSON.stringify({error:"Platform owner required"}),{status:403}) as any);
    expect((await POST(new Request("https://x/api/v1/admin/jobs/schedule-reconcile",{method:"POST"}))).status).toBe(403);expect(recoverExpiredMaintenanceClaims).not.toHaveBeenCalled();expect(enqueueJob).not.toHaveBeenCalled();
  });
  it("returns a sanitized retryable response on recovery lookup failure",async()=>{
    vi.clearAllMocks();const {getAdminClient}=await import("@/lib/supabase/admin");const {recoverExpiredMaintenanceClaims}=await import("@/lib/platform/jobs/job.recovery");const {enqueueJob}=await import("@/lib/platform/jobs/job.service");
    vi.mocked(getAdminClient).mockReturnValue({from:()=>({select:async()=>({data:[{id:"t1"}],error:null})})} as any);vi.mocked(recoverExpiredMaintenanceClaims).mockRejectedValueOnce(new Error("private database details"));
    const response=await POST(new Request("https://x/api/v1/admin/jobs/schedule-reconcile",{method:"POST"}));expect(response.status).toBe(503);expect(JSON.stringify(await response.json())).not.toContain("private");expect(enqueueJob).not.toHaveBeenCalled();
  });

});
