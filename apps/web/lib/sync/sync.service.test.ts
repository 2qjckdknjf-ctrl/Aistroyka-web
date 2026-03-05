import { describe, expect, it, vi } from "vitest";
import { bootstrap } from "./sync.service";

vi.mock("@/lib/domain/tasks/task.service", () => ({
  listTasksForToday: vi.fn().mockResolvedValue({ data: [{ id: "t1", title: "Task 1" }], error: null }),
}));
vi.mock("@/lib/domain/reports/report.repository", () => ({
  listForBootstrap: vi.fn().mockResolvedValue([
    { id: "r1", status: "draft", created_at: "2024-01-01T00:00:00Z", submitted_at: null },
  ]),
}));
vi.mock("@/lib/domain/upload-session/upload-session.repository", () => ({
  listForBootstrap: vi.fn().mockResolvedValue([
    { id: "s1", status: "created", created_at: "2024-01-01T00:00:00Z", purpose: "project_media" },
  ]),
}));
vi.mock("./change-log.repository", () => ({
  getMaxCursor: vi.fn().mockResolvedValue(42),
}));

describe("SyncService.bootstrap", () => {
  const supabase = {} as any;
  const ctx = {
    tenantId: "tenant-1",
    userId: "user-1",
    role: "member" as const,
    subscriptionTier: "free",
    clientProfile: "web" as const,
    traceId: "trace-1",
  };

  it("returns exact bootstrap response shape", async () => {
    const result = await bootstrap(supabase, ctx, { deviceId: "device-1" });
    expect(result).toHaveProperty("data");
    expect(result.data).toHaveProperty("tasks");
    expect(result.data).toHaveProperty("reports");
    expect(result.data).toHaveProperty("uploadSessions");
    expect(result).toHaveProperty("cursor");
    expect(result).toHaveProperty("serverTime");
    expect(Array.isArray(result.data.tasks)).toBe(true);
    expect(Array.isArray(result.data.reports)).toBe(true);
    expect(Array.isArray(result.data.uploadSessions)).toBe(true);
    expect(typeof result.cursor).toBe("number");
    expect(typeof result.serverTime).toBe("string");
  });

  it("returns tasks, reports, uploadSessions from repositories", async () => {
    const result = await bootstrap(supabase, ctx, { deviceId: "d1" });
    expect(result.data.tasks).toHaveLength(1);
    expect(result.data.tasks[0]).toMatchObject({ id: "t1" });
    expect(result.data.reports).toHaveLength(1);
    expect(result.data.reports[0]).toMatchObject({ id: "r1", status: "draft" });
    expect(result.data.uploadSessions).toHaveLength(1);
    expect(result.data.uploadSessions[0]).toMatchObject({ id: "s1", purpose: "project_media" });
    expect(result.cursor).toBe(42);
  });
});
