import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  createFieldDailyLogDraft,
  updateFieldDailyLogDraft,
  confirmFieldDailyLog,
  listFieldDailyLogs,
} from "./field-daily-log.service";
import {
  fieldDailyLogConfirmBlockedReason,
  fieldDailyLogEditBlockedReason,
} from "./field-daily-log.types";

vi.mock("@/lib/tenant/tenant.policy", () => ({
  canReadProjects: vi.fn(() => true),
  canManageProjects: vi.fn(() => true),
  isPortalOnlyStakeholderRole: vi.fn(() => false),
}));
vi.mock("@/lib/domain/projects/project.repository", () => ({
  getById: vi.fn(() => Promise.resolve({ id: "proj-1", name: "Test", tenant_id: "t1" })),
}));
vi.mock("./field-daily-log.repository", () => ({
  listByProject: vi.fn(() => Promise.resolve([])),
  getById: vi.fn(() => Promise.resolve(null)),
  create: vi.fn(() => Promise.resolve(null)),
  updateDraft: vi.fn(() => Promise.resolve(null)),
  confirm: vi.fn(() => Promise.resolve(null)),
}));

const noopSupabase = {} as SupabaseClient;
const ctx = { tenantId: "t1", userId: "u1", role: "member" } as Parameters<
  typeof listFieldDailyLogs
>[1];

function draftLog(overrides: Record<string, unknown> = {}) {
  return {
    id: "log-1",
    project_id: "proj-1",
    tenant_id: "t1",
    work_date: "2026-09-16",
    status: "draft" as const,
    note: "poured slab",
    summary: null,
    work_done: null,
    blockers: null,
    weather: null,
    media_refs: [] as string[],
    created_by: "u1",
    confirmed_at: null,
    confirmed_by: null,
    created_at: "2026-09-16T10:00:00Z",
    updated_at: "2026-09-16T10:00:00Z",
    ...overrides,
  };
}

describe("field-daily-log pure gates", () => {
  it("allows edit and confirm only for draft", () => {
    expect(fieldDailyLogEditBlockedReason("draft")).toBeNull();
    expect(fieldDailyLogConfirmBlockedReason("draft")).toBeNull();
    expect(fieldDailyLogEditBlockedReason("confirmed")).toBe("Only draft logs can be edited");
    expect(fieldDailyLogConfirmBlockedReason("confirmed")).toBe("Only draft logs can be confirmed");
  });
});

describe("field-daily-log.service", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const policy = await import("@/lib/tenant/tenant.policy");
    const projectRepo = await import("@/lib/domain/projects/project.repository");
    vi.mocked(policy.canReadProjects).mockReturnValue(true);
    vi.mocked(policy.canManageProjects).mockReturnValue(true);
    vi.mocked(policy.isPortalOnlyStakeholderRole).mockReturnValue(false);
    vi.mocked(projectRepo.getById).mockResolvedValue({
      id: "proj-1",
      name: "Test",
      tenant_id: "t1",
    } as never);
  });

  it("createFieldDailyLogDraft creates a draft with attribution", async () => {
    const repo = await import("./field-daily-log.repository");
    vi.mocked(repo.create).mockResolvedValue(draftLog());

    const { data, error } = await createFieldDailyLogDraft(noopSupabase, ctx, {
      project_id: "proj-1",
      work_date: "2026-09-16",
      note: "poured slab",
    });
    expect(error).toBe("");
    expect(data?.status).toBe("draft");
    expect(data?.created_by).toBe("u1");
    expect(repo.create).toHaveBeenCalled();
  });

  it("createFieldDailyLogDraft rejects empty body", async () => {
    const { data, error } = await createFieldDailyLogDraft(noopSupabase, ctx, {
      project_id: "proj-1",
      work_date: "2026-09-16",
    });
    expect(data).toBeNull();
    expect(error).toBe("note, structured fields, or media_refs required");
  });

  it("createFieldDailyLogDraft rejects portal-only stakeholder", async () => {
    const policy = await import("@/lib/tenant/tenant.policy");
    vi.mocked(policy.isPortalOnlyStakeholderRole).mockReturnValue(true);
    const { data, error } = await createFieldDailyLogDraft(noopSupabase, ctx, {
      project_id: "proj-1",
      work_date: "2026-09-16",
      note: "x",
    });
    expect(data).toBeNull();
    expect(error).toBe("Portal access not allowed");
  });

  it("draft → confirm records confirmed_by attribution", async () => {
    const repo = await import("./field-daily-log.repository");
    vi.mocked(repo.getById).mockResolvedValue(draftLog());
    vi.mocked(repo.confirm).mockResolvedValue(
      draftLog({
        status: "confirmed",
        confirmed_at: "2026-09-16T12:00:00Z",
        confirmed_by: "u1",
      })
    );

    const { data, error } = await confirmFieldDailyLog(noopSupabase, ctx, "proj-1", "log-1");
    expect(error).toBe("");
    expect(data?.status).toBe("confirmed");
    expect(data?.confirmed_by).toBe("u1");
    expect(repo.confirm).toHaveBeenCalledWith(noopSupabase, "log-1", "t1", "u1");
  });

  it("rejects edit after confirm", async () => {
    const repo = await import("./field-daily-log.repository");
    vi.mocked(repo.getById).mockResolvedValue(
      draftLog({ status: "confirmed", confirmed_by: "u1", confirmed_at: "2026-09-16T12:00:00Z" })
    );

    const { data, error } = await updateFieldDailyLogDraft(noopSupabase, ctx, "proj-1", "log-1", {
      note: "should fail",
    });
    expect(data).toBeNull();
    expect(error).toBe("Only draft logs can be edited");
    expect(repo.updateDraft).not.toHaveBeenCalled();
  });

  it("allows edit while draft", async () => {
    const repo = await import("./field-daily-log.repository");
    vi.mocked(repo.getById).mockResolvedValue(draftLog());
    vi.mocked(repo.updateDraft).mockResolvedValue(draftLog({ note: "updated note" }));

    const { data, error } = await updateFieldDailyLogDraft(noopSupabase, ctx, "proj-1", "log-1", {
      note: "updated note",
    });
    expect(error).toBe("");
    expect(data?.note).toBe("updated note");
  });

  it("rejects confirm when already confirmed", async () => {
    const repo = await import("./field-daily-log.repository");
    vi.mocked(repo.getById).mockResolvedValue(
      draftLog({ status: "confirmed", confirmed_by: "u2" })
    );
    const { data, error } = await confirmFieldDailyLog(noopSupabase, ctx, "proj-1", "log-1");
    expect(data).toBeNull();
    expect(error).toBe("Only draft logs can be confirmed");
  });

  it("listFieldDailyLogs still allows viewers", async () => {
    const policy = await import("@/lib/tenant/tenant.policy");
    const repo = await import("./field-daily-log.repository");
    vi.mocked(policy.canManageProjects).mockReturnValue(false);
    vi.mocked(policy.canReadProjects).mockReturnValue(true);
    vi.mocked(repo.listByProject).mockResolvedValue([draftLog()]);

    const { data, error } = await listFieldDailyLogs(noopSupabase, ctx, "proj-1");
    expect(error).toBe("");
    expect(data).toHaveLength(1);
  });

  it("create/update/confirm reject viewer writes", async () => {
    const policy = await import("@/lib/tenant/tenant.policy");
    const repo = await import("./field-daily-log.repository");
    vi.mocked(policy.canManageProjects).mockReturnValue(false);
    vi.mocked(policy.canReadProjects).mockReturnValue(true);

    const created = await createFieldDailyLogDraft(noopSupabase, ctx, {
      project_id: "proj-1",
      work_date: "2026-09-16",
      note: "viewer should not write",
    });
    expect(created.data).toBeNull();
    expect(created.error).toBe("Insufficient rights");
    expect(repo.create).not.toHaveBeenCalled();

    const updated = await updateFieldDailyLogDraft(noopSupabase, ctx, "proj-1", "log-1", {
      note: "nope",
    });
    expect(updated.data).toBeNull();
    expect(updated.error).toBe("Insufficient rights");
    expect(repo.updateDraft).not.toHaveBeenCalled();

    const confirmed = await confirmFieldDailyLog(noopSupabase, ctx, "proj-1", "log-1");
    expect(confirmed.data).toBeNull();
    expect(confirmed.error).toBe("Insufficient rights");
    expect(repo.confirm).not.toHaveBeenCalled();
  });
});
