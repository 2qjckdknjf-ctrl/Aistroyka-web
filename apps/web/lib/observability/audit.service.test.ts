import { describe, expect, it, vi } from "vitest";
import { emitAudit, listAuditLogs } from "./audit.service";

describe("audit.service", () => {
  it("emitAudit does not throw on insert failure", async () => {
    const supabase = {
      from: () => ({ insert: () => Promise.reject(new Error("db error")) }),
    } as any;
    await expect(emitAudit(supabase, { tenant_id: "t", action: "login" })).resolves.toBeUndefined();
  });

  it("listAuditLogs returns empty when query errors", async () => {
    const supabase = {
      from: () => ({
        select: () => ({ eq: () => ({ gte: () => ({ order: () => ({ limit: () => Promise.resolve({ data: null, error: new Error("err") }) }) }) }) }),
      }),
    } as any;
    const rows = await listAuditLogs(supabase, "t", 30);
    expect(rows).toEqual([]);
  });
});
