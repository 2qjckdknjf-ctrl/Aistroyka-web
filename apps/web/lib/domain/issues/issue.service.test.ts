import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  listIssues,
  createIssue,
  updateIssue,
  getIssueById,
} from "./issue.service";

vi.mock("@/lib/tenant/tenant.policy", () => ({
  canReadProjects: vi.fn(() => true),
  canManageProjects: vi.fn(() => true),
}));
vi.mock("@/lib/domain/projects/project.repository", () => ({
  getById: vi.fn(() => Promise.resolve({ id: "proj-1", name: "Test", tenant_id: "t1" })),
}));
vi.mock("./issue.repository", () => ({
  listByProject: vi.fn(() => Promise.resolve([])),
  getById: vi.fn(() => Promise.resolve(null)),
  create: vi.fn(() => Promise.resolve(null)),
  update: vi.fn(() => Promise.resolve(null)),
}));

const noopSupabase = {} as SupabaseClient;
const ctx = { tenantId: "t1", userId: "u1" } as Parameters<typeof listIssues>[2];

describe("issue.service", () => {
  beforeEach(async () => {
    const projectRepo = await import("@/lib/domain/projects/project.repository");
    vi.mocked(projectRepo.getById).mockResolvedValue({
      id: "proj-1",
      name: "Test",
      tenant_id: "t1",
    } as never);
  });

  it("listIssues returns data when project exists", async () => {
    const repo = await import("./issue.repository");
    vi.mocked(repo.listByProject).mockResolvedValue([
      {
        id: "i1",
        project_id: "proj-1",
        tenant_id: "t1",
        title: "Bug",
        description: null,
        status: "open",
        task_id: null,
        milestone_id: null,
        created_by: null,
        resolved_at: null,
        resolved_by: null,
        created_at: "",
        updated_at: "",
      },
    ]);

    const { data, error } = await listIssues(noopSupabase, ctx, "proj-1");
    expect(error).toBe("");
    expect(data).toHaveLength(1);
    expect(data[0].title).toBe("Bug");
  });

  it("createIssue returns error when title empty", async () => {
    const { data, error } = await createIssue(noopSupabase, ctx, {
      project_id: "proj-1",
      title: "  ",
    });
    expect(data).toBeNull();
    expect(error).toBe("title required");
  });
});
