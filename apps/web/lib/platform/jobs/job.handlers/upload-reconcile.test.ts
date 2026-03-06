import { describe, expect, it, vi } from "vitest";
import { handleUploadReconcile } from "./upload-reconcile";
import * as observability from "@/lib/observability";

vi.mock("@/lib/observability", () => ({ logStructured: vi.fn() }));
const logStructured = vi.mocked(observability.logStructured);

describe("handleUploadReconcile", () => {
  it("does nothing when no expired sessions", async () => {
    const admin = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      lt: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [] }),
      update: vi.fn().mockReturnThis(),
    };
    await handleUploadReconcile(admin as any, {
      id: "j1",
      tenant_id: "t1",
      type: "upload_reconcile",
      payload: {},
      status: "running",
      attempts: 0,
      max_attempts: 2,
      run_after: "",
      locked_by: null,
      locked_at: null,
      last_error: null,
      last_error_type: null,
      trace_id: null,
      created_at: "",
      updated_at: "",
    } as any);
    expect(admin.from).toHaveBeenCalledWith("upload_sessions");
    expect(admin.update).not.toHaveBeenCalled();
    expect(logStructured).not.toHaveBeenCalled();
  });

  it("marks expired sessions and emits upload_session_expired", async () => {
    const expired = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const rows = [
      { id: "s1", tenant_id: "t1", user_id: "u1", created_at: expired, expires_at: expired },
      { id: "s2", tenant_id: "t1", user_id: "u2", created_at: expired, expires_at: expired },
    ];
    let updatePayload: unknown;
    const admin = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      lt: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: rows }),
      update: vi.fn().mockImplementation((p: unknown) => {
        updatePayload = p;
        return { in: vi.fn().mockResolvedValue({}) };
      }),
    };
    await handleUploadReconcile(admin as any, {
      id: "j1",
      tenant_id: "t1",
      type: "upload_reconcile",
      payload: {},
      status: "running",
      attempts: 0,
      max_attempts: 2,
      run_after: "",
      locked_by: null,
      locked_at: null,
      last_error: null,
      last_error_type: null,
      trace_id: null,
      created_at: "",
      updated_at: "",
    } as any);
    expect(updatePayload).toEqual({ status: "expired" });
    expect(logStructured).toHaveBeenCalledTimes(2);
    expect(logStructured).toHaveBeenNthCalledWith(1, expect.objectContaining({
      event: "upload_session_expired",
      session_id: "s1",
      tenant_id: "t1",
      user_id: "u1",
      age_hours: expect.any(Number),
    }));
    expect(logStructured).toHaveBeenNthCalledWith(2, expect.objectContaining({
      event: "upload_session_expired",
      session_id: "s2",
      tenant_id: "t1",
      user_id: "u2",
    }));
  });
});
